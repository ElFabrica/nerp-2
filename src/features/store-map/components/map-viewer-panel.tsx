"use client";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useBrands } from "@/features/brands/hooks/use-brands";
import { PdvPhotoSection } from "@/features/pdv-photos/components/pdv-photo-section";
import { useSupplier } from "@/features/supplier/hooks/use-supplier";
import { UserCog } from "lucide-react";
import { readNegotiation } from "../engine/negotiation";
import { useSceneStore } from "../engine/scene-store";
import type { MapObjectType } from "../engine/types";
import { useMapObjectAudit } from "../hooks/use-map-object-audit";

const TYPE_LABELS: Record<MapObjectType, string> = {
  WALL: "Parede",
  AISLE: "Corredor",
  SECTOR: "Setor",
  GONDOLA: "Gôndola",
  ISLAND: "Ilha",
  CHECKOUT: "Caixa",
  ENTRANCE: "Entrada",
  EXIT: "Saída",
  DEPOSIT: "Depósito",
  RESTRICTED_AREA: "Área restrita",
  PIN: "Pin",
  TEXT: "Texto",
};

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "Sem visita registrada";
  return new Date(iso).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

interface InfoRowProps {
  label: string;
  value: string | null | undefined;
}

/** Linha somente-leitura: o promotor consulta, quem edita é o admin no editor. */
function InfoRow({ label, value }: InfoRowProps) {
  if (!value) return null;
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="shrink-0 text-xs text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium">{value}</span>
    </div>
  );
}

interface MapViewerPanelProps {
  storeName?: string;
}

export function MapViewerPanel({ storeName }: MapViewerPanelProps) {
  const selectedIds = useSceneStore((state) => state.selectedIds);
  const objects = useSceneStore((state) => state.objects);
  const storeId = useSceneStore((state) => state.floorPlan?.storeId);

  const object = selectedIds.length === 1 ? objects[selectedIds[0]] : undefined;
  const { suppliers } = useSupplier({ pageSize: 100 });
  const { brands } = useBrands(object?.supplierId ?? undefined);
  const { audit } = useMapObjectAudit(object?.id);

  if (!object) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground">
        Toque em um elemento do mapa (ou use a busca) para ver as informações e
        registrar as fotos.
      </div>
    );
  }

  const negotiation = readNegotiation(object.properties);
  const supplierName =
    suppliers.find((supplier) => supplier.id === object.supplierId)?.name ??
    null;
  const brandName =
    brands.find((brand) => brand.id === object.brandId)?.name ?? null;

  const start = formatDate(negotiation.negotiationStart);
  const end = formatDate(negotiation.negotiationEnd);
  const period = start && end ? `${start} a ${end}` : (start ?? end);

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-semibold leading-tight">
            Informações da Prateleira
          </h2>
          {storeName && (
            <p className="text-xs text-muted-foreground">{storeName}</p>
          )}
        </div>
        <Badge variant="secondary">{TYPE_LABELS[object.type]}</Badge>
      </div>

      <div className="space-y-2 rounded-md border p-3">
        <InfoRow label="Elemento" value={object.name} />
        <InfoRow label="Localização" value={negotiation.location} />
        <InfoRow label="Tipo de espaço" value={negotiation.spaceType} />
        <InfoRow label="Categoria" value={object.category} />
        <InfoRow label="Indústria" value={supplierName} />
        <InfoRow label="Marca ocupante" value={brandName} />
        <InfoRow label="Distribuidor" value={negotiation.distributor} />
        <InfoRow label="Período" value={period} />
        <InfoRow label="Status" value={object.status} />
      </div>

      <div className="space-y-2 rounded-md bg-muted/50 p-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <UserCog className="size-3.5" />
          Rastreabilidade
        </div>
        <InfoRow
          label="Última visita"
          value={formatDateTime(audit?.lastVisitAt)}
        />
        <InfoRow label="Promotor" value={audit?.promoterName ?? "—"} />
        <InfoRow label="Supervisor" value={audit?.supervisorName ?? "—"} />
      </div>

      {storeId && (
        <>
          <Separator />
          <PdvPhotoSection
            storeId={storeId}
            mapObjectId={object.id}
            defaultSupplierId={object.supplierId}
            defaultSection={object.category}
          />
        </>
      )}
    </div>
  );
}
