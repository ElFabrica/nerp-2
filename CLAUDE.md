# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev              # dev server (Turbopack) on :3000
pnpm build            # prisma generate && prisma migrate deploy && next build
pnpm lint             # Biome check (NOT ESLint)
pnpm format           # Biome format --write
npx tsc --noEmit      # typecheck — no npm script for this, run it directly
pnpm db:migrate       # prisma migrate dev
pnpm db:generate      # regenerate Prisma client (required after pulling schema changes)
pnpm db:studio
pnpm db:seed          # runs prisma/seed.ts
pnpm inngest:dev      # Inngest dev server on :8299 (needed for background jobs)
docker compose up -d  # Postgres 17, host port 5433
```

**There is no test suite** — no Vitest/Jest/Playwright, no test files, no CI workflows. Verification is `pnpm lint` + `npx tsc --noEmit` + manually exercising the flow in the browser. Don't invent a `pnpm test`.

Note `pnpm build` runs `prisma migrate deploy`, so a bad migration breaks the build, not just runtime. Only `main` deploys on Vercel (`vercel.json`); `.nixpacks.toml` is a second Nixpacks-based target.

## Architecture

Next.js 15 App Router + React 19 + oRPC + Prisma 7 + Better Auth + Inngest. Multi-tenant ERP, Portuguese domain language (pt-BR). Single path alias: `@/*` → `./src/*`.

### The oRPC server lives in `src/app/`

Not `src/server` or `src/rpc`:

- `src/app/middlewares/{base,auth,org}.ts` — `base` procedure + typed errors; `requireAuthMiddleware` injects `context.user`/`context.session`; `requireOrgMiddleware` injects `context.org`.
- `src/app/router/<entity>/<verb>.ts` — one procedure per file, re-exported from that folder's `index.ts`, merged into the root object in `src/app/router/index.ts`. That root object is the single source of type inference for the whole client.
- `src/app/api/rpc/[[...rest]]/route.ts` — the HTTP mount, which also verifies machine-to-machine (S2S) requests and injects `isS2S`/`s2sOrg`/`s2sUser` into context before the handler runs.

There is no `publicProcedure`/`protectedProcedure`. You opt in by chaining:

```ts
export const createBook = base
  .use(requireAuthMiddleware)
  .use(requireOrgMiddleware)
  .input(z.object({ name: z.string().min(1, "Informe o nome do book") }))
  .output(z.object({ id: z.string() }))
  .handler(async ({ input, context, errors }) => {
    const book = await prisma.book.create({
      data: { organizationId: context.org.id, createdById: context.user.id, name: input.name },
      select: { id: true },
    });
    return { id: book.id };
  });
```

### Multi-tenancy is manual — the most important rule

`requireOrgMiddleware` gives you `context.org` but **does not scope any query**. There is no RLS and no Prisma extension. Every handler must pass `organizationId: context.org.id` itself; omitting it is a silent cross-tenant data leak. Any ID arriving from input must be re-validated against the org before use, rather than trusted:

```ts
const supplier = await prisma.supplier.findFirst({
  where: { id: input.supplierId, organizationId: context.org.id },
  select: { id: true },
});
if (!supplier) throw errors.NOT_FOUND({ message: "Indústria não encontrada" });
```

Throw via the typed `errors` object, never `throw new Error`.

Public storefront procedures (`router/catalog/public.ts`, `checkout/`, `pedidos/public-*`) are the exception: they use bare `base` with no auth middleware, take `subdomain` as input, and resolve the org themselves.

### Server/client duality of `orpc`

`src/app/layout.tsx` line 1 is `import "@/lib/orpc.server"` — a side-effect import that sets `globalThis.$client` to a direct in-process router client. `src/lib/orpc.ts` then does `globalThis.$client ?? createORPCClient(link)`. So the same `orpc` import is an in-process call on the server and an HTTP fetch in the browser. **Removing that layout import silently breaks every server-side oRPC call.**

### Feature modules

Server and client are split across two trees. `src/app/router/<entity>/` holds the procedures; `src/features/<feature>/` holds the UI:

```
src/features/<feature>/
  components/*.tsx        "use client" components
  hooks/use-<feature>.ts  ALL useQuery/useMutation wrappers live here
  server/                 server-only "fat" business logic (optional)
  params.ts               nuqs parsers (optional)
```

No `procedures/`, no `actions/`, no per-feature `schemas/` (Zod schemas are inline). Server Actions are not the pattern — everything goes through oRPC.

Components never call `orpc` directly; they go through a feature hook that toasts on error and invalidates on success:

```ts
export function useCreateBook() {
  const queryClient = useQueryClient();
  return useMutation(orpc.book.create.mutationOptions({
    onSuccess: () => {
      toast.success("Book criado");
      queryClient.invalidateQueries({ queryKey: orpc.book.list.key() });
    },
    onError: (error) => toast.error(error.message),
  }));
}
```

`page.tsx` stays thin — `await requirePermission("<key>")` then render a container from `src/features/`.

### Prisma

Generated to `src/generated/prisma` (gitignored). **Import from `@/generated/prisma/client` and `@/generated/prisma/enums` — never `@prisma/client`.** The client is the *default* export of `@/lib/db`: `import prisma from "@/lib/db"`. Single 1471-line `prisma/schema.prisma`, 42 models. Convert `Decimal` → `Number` and `Date` → ISO string at the handler boundary.

### Auth & permissions

Better Auth (`src/lib/auth.ts`) with the `organization` plugin plus a custom `crossLoginPlugin` (cross-subdomain cookies were deliberately removed — Chrome rejects `Domain=.localhost`). `src/middleware.ts` does **not** protect routes; it only rewrites subdomains to `/[subdomain]/...` for storefronts. Enforcement lives in layouts (`requireAuth()` from `src/lib/auth-utils.ts`) and the oRPC middlewares.

New admin page → add a key to `PAGE_PERMISSIONS` in `src/lib/permissions.ts`, guard the page with `requirePermission(key)`, add a sidebar entry in `src/components/app-sidebar.tsx`, and if it's a new top-level path add it to the allowlist in `src/middleware.ts` so subdomain rewriting doesn't hijack it. Owner/admin bypass all permission checks.

### Background jobs (Inngest)

Client/events in `src/lib/inngest/client.ts`, functions array in `src/lib/inngest/functions.ts`, served at `src/app/api/inngest/route.ts`. Jobs: NASA sync delivery, product import, book PDF generation. The pattern: a procedure writes a status row (`GENERATING`/`PENDING`) then sends the event; the function body is a thin `step.run` delegating to `src/features/<domain>/server/*`, with `onFailure` marking the row `FAILED`; the client polls via `refetchInterval` keyed on status.

### Route groups

`(main)/(rest)/` is the authenticated ERP (sidebar shell, `requireAuth()` + `currentOrganization()`). Others: `(auth)`, `(home)`, `(org)/create-organization`, `(storefront)/[subdomain]` (public per-tenant store), `(waiter)`, `(pedidos-display)/painel`.

## Conventions

- **Strict typing — `any` is forbidden.** Use Prisma generated types, `z.infer`, or domain types.
- Clean code, no superfluous comments — comment only the non-obvious "why".
- Reuse existing primitives before writing new ones (`cn()`, `constructUrl` in `src/hooks/use-construct-url.ts`, `src/utils/*` formatters, shadcn/ui).
- **Tailwind 4 is CSS-first — there is no `tailwind.config.*`.** Design tokens go in the `@theme inline` + `:root`/`.dark` blocks of `src/app/globals.css`.
- shadcn/ui (new-york, lucide icons) in `src/components/ui/`. Prefer `flex` + `gap-*` over `space-x/y-*`; `size-*` over `w-N h-N`; semantic tokens over manual `dark:` overrides.
- **Forms**: react-hook-form + `zodResolver` with the schema inline, using `<Controller>` + the `Field`/`FieldGroup`/`FieldLabel`/`FieldError` family — *not* shadcn's `<Form>/<FormField>` wrapper. Canonical example: `src/features/supplier/components/add-supplier.tsx`.
- **Tables are hand-rolled** with `components/ui/table.tsx` primitives — `@tanstack/react-table` is not used. Cursor pagination via `src/hooks/use-cursor-pagination.ts`.
- Biome (2 spaces, double quotes, **import sorting deliberately off**). Run `pnpm biome check --write` on new files.
- Commits: Conventional Commits with Portuguese subjects and scopes — `feat(store-map): M9 — régua com ticks`, `fix(build): resolve 'canvas' do konva`.

## Gotchas

- The `canvas: false` webpack alias in `next.config.ts` is load-bearing: Konva pulls a Node build that `require('canvas')`, which breaks production builds without it. Konva editors are `ssr: false`.
- `images.remotePatterns` derives a hostname from `NEXT_PUBLIC_S3_BUCKET_CONSTRUCTOR_URL`; unset, it silently becomes an empty hostname.
- `src/context/` and `src/schemas/` predate the `src/features/` convention and are vestigial — don't add to them.
- Docs drift from code: the README env template, the DB port (compose says 5433), and `docs/catalogo-promocional/` route paths are all out of date. Trust the code and `docker-compose.yml`.

## Reference docs

- `docs/TRADE_MARKETING.md` — the map/PDV/Book module: data model, the meters-based domain decoupled from the Konva renderer (`src/features/store-map/engine/`), roadmap M1–M9, conventions (§9), and known issues (§11, including a documented cross-tenant leak in `supplier/update.ts` and `supplier/delete.ts`).
- `docs/catalogo-promocional/` — promotional catalog spec (paths partly stale).
- `.agents/skills/` — vendored third-party skills (shadcn, vercel-react-best-practices, web-design-guidelines, context7).
