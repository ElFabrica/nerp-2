"use client";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Archive, ExternalLink, LayoutGrid } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useKanbanDnd } from "../hooks/use-kanban-dnd";
import { useMutationCreateColumn } from "../hooks/use-pedidos-columns";
import { useQueryKitchenColumns } from "../hooks/use-pedidos-columns";
import {
  useQueryArchivedKitchenOrders,
  useQueryKitchenOrders,
} from "../hooks/use-pedidos";
import type { KitchenOrder } from "../hooks/use-pedidos";
import { Badge } from "@/components/ui/badge";
import { ArchivedOrders } from "./archived-orders";
import { ColumnManager } from "./column-manager";
import { KitchenColumn } from "./pedidos-column";
import { OrderCard } from "./order-card";
import { RegisterOrderForm } from "./register-order-form";

// As 3 colunas padrão (espelham o seed do afterCreateOrganization) — usadas só
// no empty-state de orgs legadas sem backfill.
const DEFAULT_COLUMNS = [
  { name: "Em Preparo", color: "#F97316", isInitial: true, icon: "ChefHat" },
  { name: "Prontos", color: "#22C55E", showOnTv: true, icon: "BellRing" },
  { name: "Entregues", color: "#64748B", isFinal: true, icon: "CheckCheck" },
] as const;

export function KitchenBoard() {
  const { data: columns = [], isLoading: loadingColumns } =
    useQueryKitchenColumns(false);
  const { data: orders = [] } = useQueryKitchenOrders();
  const { data: archivedOrders = [] } = useQueryArchivedKitchenOrders();
  const createColumn = useMutationCreateColumn();

  // alterna a área de arquivados (botão de toggle no header)
  const [showArchived, setShowArchived] = useState(false);

  // slug da org ativa p/ a URL pública da TV
  const [orgSlug, setOrgSlug] = useState<string | null>(null);
  useEffect(() => {
    authClient.organization.getFullOrganization().then(({ data }) => {
      if (data?.slug) setOrgSlug(data.slug);
    });
  }, []);

  // agrupa pedidos por columnId (a lista já vem ordenada por position)
  const ordersByColumn = useMemo(() => {
    const map = new Map<string, KitchenOrder[]>();
    for (const order of orders) {
      const list = map.get(order.columnId);
      if (list) list.push(order);
      else map.set(order.columnId, [order]);
    }
    return map;
  }, [orders]);

  const countIn = (columnId: string) =>
    ordersByColumn.get(columnId)?.length ?? 0;

  // coluna terminal (isFinal) — alvo da ação direta "Entregue" nos cards
  const finalColumn = columns.find((c) => c.isFinal) ?? null;

  const { activeId, activeColumnId, onDragStart, onDragCancel, onDragEnd } =
    useKanbanDnd({
      columns,
      countIn,
    });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const activeOrder = activeId
    ? (orders.find((o) => o.id === activeId) ?? null)
    : null;

  async function createDefaultColumns() {
    for (const column of DEFAULT_COLUMNS) {
      await createColumn.mutateAsync({ ...column });
    }
  }

  const openTvPanel = () => {
    if (orgSlug) window.open(`/painel/${orgSlug}`, "_blank");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pedidos"
        description="Registre os pedidos e acompanhe o preparo no kanban."
      >
        <ColumnManager />
        <Button variant="outline" onClick={openTvPanel} disabled={!orgSlug}>
          <ExternalLink className="size-4" />
          Abrir painel da TV
        </Button>
        <Button
          variant={showArchived ? "secondary" : "outline"}
          aria-pressed={showArchived}
          onClick={() => setShowArchived((v) => !v)}
        >
          <Archive className="size-4" />
          Arquivados
          {archivedOrders.length > 0 && (
            <Badge variant="secondary">{archivedOrders.length}</Badge>
          )}
        </Button>
        <RegisterOrderForm />
      </PageHeader>

      {loadingColumns ? (
        <div className="flex gap-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-96 w-72 shrink-0" />
          ))}
        </div>
      ) : columns.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <LayoutGrid />
            </EmptyMedia>
            <EmptyTitle>Nenhuma coluna configurada</EmptyTitle>
            <EmptyDescription>
              Esta organização ainda não tem colunas no kanban da cozinha.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              onClick={createDefaultColumns}
              disabled={createColumn.isPending}
            >
              Criar colunas padrão
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragCancel={onDragCancel}
          onDragEnd={onDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4">
            {columns.map((column, index) => {
              // próxima coluna por position p/ o botão de avançar (fallback)
              const nextColumn =
                !column.isFinal && index < columns.length - 1
                  ? columns[index + 1]
                  : null;
              return (
                <KitchenColumn
                  key={column.id}
                  column={column}
                  orders={ordersByColumn.get(column.id) ?? []}
                  nextColumn={nextColumn}
                  finalColumn={finalColumn}
                  isDragActive={activeId != null}
                  activeColumnId={activeColumnId}
                />
              );
            })}
          </div>

          {/* Fantasma do card durante o arraste. dropAnimation desativado: o
              movimento entre colunas é otimista (react-query), então o card já
              aparece na coluna nova no mesmo frame. A animação padrão voaria o
              fantasma de volta à posição original (coluna antiga) antes do
              re-render — daí o efeito de "voltar". Sem ela, a troca é instantânea. */}
          <DragOverlay dropAnimation={null}>
            {activeOrder ? (
              <OrderCard order={activeOrder} nextColumn={null} overlay />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Área de arquivados (toggle no header) */}
      {showArchived && <ArchivedOrders />}
    </div>
  );
}
