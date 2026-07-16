"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CatalogTable } from "./catalog-table";
import {
  useCreateMediaType,
  useCreateNegotiationType,
  useCreateStoreSector,
  useDeleteMediaType,
  useDeleteNegotiationType,
  useDeleteStoreSector,
  useMediaTypes,
  useNegotiationTypes,
  useStoreSectors,
  useUpdateMediaType,
  useUpdateNegotiationType,
  useUpdateStoreSector,
} from "../hooks/use-trade-catalog";

function MediaTab({ kind }: { kind: "FISICA" | "DIGITAL" }) {
  const { mediaTypes, isLoading } = useMediaTypes({ kind, includeInactive: true });
  const create = useCreateMediaType();
  const update = useUpdateMediaType();
  const remove = useDeleteMediaType();

  return (
    <CatalogTable
      rows={mediaTypes}
      isLoading={isLoading}
      isCreating={create.isPending}
      onCreate={(code, name) => create.mutate({ kind, code, name })}
      onRename={(id, name) => update.mutate({ id, name })}
      onToggleActive={(id, isActive) => update.mutate({ id, isActive })}
      onDelete={(id) => remove.mutate({ id })}
    />
  );
}

function NegotiationTab() {
  const { negotiationTypes, isLoading } = useNegotiationTypes({
    includeInactive: true,
  });
  const create = useCreateNegotiationType();
  const update = useUpdateNegotiationType();
  const remove = useDeleteNegotiationType();

  return (
    <CatalogTable
      rows={negotiationTypes}
      isLoading={isLoading}
      isCreating={create.isPending}
      onCreate={(code, name) => create.mutate({ code, name })}
      onRename={(id, name) => update.mutate({ id, name })}
      onToggleActive={(id, isActive) => update.mutate({ id, isActive })}
      onDelete={(id) => remove.mutate({ id })}
    />
  );
}

function SectorTab() {
  const { storeSectors, isLoading } = useStoreSectors({ includeInactive: true });
  const create = useCreateStoreSector();
  const update = useUpdateStoreSector();
  const remove = useDeleteStoreSector();

  return (
    <CatalogTable
      rows={storeSectors}
      isLoading={isLoading}
      isCreating={create.isPending}
      onCreate={(code, name) => create.mutate({ code, name })}
      onRename={(id, name) => update.mutate({ id, name })}
      onToggleActive={(id, isActive) => update.mutate({ id, isActive })}
      onDelete={(id) => remove.mutate({ id })}
    />
  );
}

export function TradeCatalogManager() {
  return (
    <Tabs defaultValue="media-fisica">
      <TabsList>
        <TabsTrigger value="media-fisica">Mídia Física</TabsTrigger>
        <TabsTrigger value="media-digital">Mídia Digital</TabsTrigger>
        <TabsTrigger value="negociacao">Tipos de Negociação</TabsTrigger>
        <TabsTrigger value="setores">Setores</TabsTrigger>
      </TabsList>

      <TabsContent value="media-fisica" className="mt-4">
        <MediaTab kind="FISICA" />
      </TabsContent>
      <TabsContent value="media-digital" className="mt-4">
        <MediaTab kind="DIGITAL" />
      </TabsContent>
      <TabsContent value="negociacao" className="mt-4">
        <NegotiationTab />
      </TabsContent>
      <TabsContent value="setores" className="mt-4">
        <SectorTab />
      </TabsContent>
    </Tabs>
  );
}
