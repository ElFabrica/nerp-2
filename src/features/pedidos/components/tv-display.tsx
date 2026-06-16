"use client";

import { orpc } from "@/lib/orpc";
import { useQuery } from "@tanstack/react-query";
import { Beer, BellRing, Loader2, TriangleAlert } from "lucide-react";

// Polling no lugar de websockets: alinhado ao restante do KDS (use-kitchen).
// A própria rota publicReady já some com pedidos antigos (AUTO_HIDE_MS).
const POLL_MS = 5000;

export function TvDisplay({ orgSlug }: { orgSlug: string }) {
  const { data, isLoading, isError } = useQuery(
    orpc.kitchen.publicReady.queryOptions({
      input: { orgSlug },
      refetchInterval: POLL_MS,
    }),
  );

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center gap-3 text-zinc-400">
        <Loader2 className="size-8 animate-spin" />
        <span className="text-2xl">Carregando painel…</span>
      </div>
    );
  }

  // Inclui NOT_FOUND de orgSlug inexistente — sem expor detalhes do erro.
  if (isError || !data) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-zinc-400">
        <TriangleAlert className="size-12 text-amber-500" />
        <p className="text-2xl">Painel indisponível</p>
        <p className="text-lg text-zinc-500">
          Verifique o endereço do estabelecimento.
        </p>
      </div>
    );
  }

  const { orgName, orders } = data;

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-zinc-800 px-8 py-6 text-center">
        <h1 className="flex items-center justify-center gap-3 text-4xl font-bold sm:text-5xl">
          <Beer className="size-10 text-amber-400" />
          {orgName}
        </h1>
        <p className="mt-2 text-xl font-semibold tracking-widest text-emerald-400 sm:text-2xl">
          PEDIDOS PRONTOS PARA RETIRADA
        </p>
      </header>

      <main className="flex-1 overflow-y-auto p-8">
        {orders.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-zinc-500">
            <BellRing className="size-16" />
            <p className="text-3xl">Nenhum pedido pronto no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(20rem,1fr))] gap-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-2xl border border-emerald-600/40 bg-emerald-950/40 px-6 py-8 text-center"
              >
                <p className="text-3xl font-bold text-emerald-300 sm:text-4xl">
                  Mesa {order.tableNumber}
                </p>
                <p className="mt-3 text-2xl font-medium text-white sm:text-3xl">
                  {order.dishName}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-zinc-800 px-8 py-5 text-center text-zinc-400">
        <p className="text-xl">Acompanhe sua mesa no painel.</p>
        <p className="text-lg text-zinc-500">
          Retire no balcão ou solicite a um garçom.
        </p>
      </footer>
    </div>
  );
}
