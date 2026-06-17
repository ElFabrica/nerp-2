// Registro central das páginas que exigem permissão. Toda nova página admin
// deve declarar sua chave aqui para entrar no painel de "Permissões".
export const PAGE_PERMISSIONS = [
  {
    key: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
  },
  {
    key: "pedidos",
    label: "Pedidos (cozinha)",
    href: "/pedidos",
  },
  {
    key: "vendas",
    label: "Frente de caixa",
    href: "/vendas",
  },
  {
    key: "produtos",
    label: "Produtos",
    href: "/produtos",
  },
  {
    key: "estoque",
    label: "Estoque",
    href: "/estoque",
  },
  {
    key: "clientes",
    label: "Clientes",
    href: "/clientes",
  },
  {
    key: "catalogo",
    label: "Catálogo Online",
    href: "/catalogo",
  },
  {
    key: "colaboradores",
    label: "Colaboradores",
    href: "/colaboradores",
  },
  {
    key: "configuracoes",
    label: "Configurações",
    href: "/configuracoes",
  },
] as const;

export type PagePermissionKey = (typeof PAGE_PERMISSIONS)[number]["key"];

export const PAGE_PERMISSION_KEYS = PAGE_PERMISSIONS.map((p) => p.key);

// Roles do plugin organization do Better Auth que sempre veem tudo.
const ROLES_WITH_FULL_ACCESS = new Set(["owner", "admin"]);

export function hasFullAccess(role: string | null | undefined): boolean {
  if (!role) return false;
  return ROLES_WITH_FULL_ACCESS.has(role);
}

interface MemberLike {
  role: string;
  permissions: string[] | null | undefined;
}

export function memberHasPermission(
  member: MemberLike | null | undefined,
  key: PagePermissionKey,
): boolean {
  if (!member) return false;
  if (hasFullAccess(member.role)) return true;
  return (member.permissions ?? []).includes(key);
}

// Resolve a primeira página acessível por uma lista de permissões (para usar
// como fallback de redirect quando o usuário cai numa rota proibida).
export function firstAllowedHref(
  member: MemberLike | null | undefined,
): string | null {
  if (!member) return null;
  if (hasFullAccess(member.role)) return "/dashboard";
  for (const page of PAGE_PERMISSIONS) {
    if ((member.permissions ?? []).includes(page.key)) return page.href;
  }
  return null;
}
