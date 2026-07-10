"use client";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";
import { useSceneStore } from "../engine/scene-store";
import type { MapObjectType } from "../engine/types";

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

export function ObjectPropertiesPanel() {
  const selectedIds = useSceneStore((state) => state.selectedIds);
  const objects = useSceneStore((state) => state.objects);
  const updateObject = useSceneStore((state) => state.updateObject);
  const removeSelected = useSceneStore((state) => state.removeSelected);

  if (selectedIds.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Selecione um objeto para editar suas propriedades.
      </div>
    );
  }

  if (selectedIds.length > 1) {
    return (
      <div className="space-y-3 p-4">
        <p className="text-sm">{selectedIds.length} objetos selecionados</p>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={removeSelected}
        >
          <Trash2 className="size-4" />
          Excluir selecionados
        </Button>
      </div>
    );
  }

  const object = objects[selectedIds[0]];
  if (!object) return null;

  return (
    <div className="space-y-4 p-4" key={object.id}>
      <div className="flex items-center justify-between">
        <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium">
          {TYPE_LABELS[object.type]}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 text-destructive"
          title="Excluir"
          onClick={removeSelected}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      <Field>
        <FieldLabel htmlFor="object-name">Nome</FieldLabel>
        <Input
          id="object-name"
          defaultValue={object.name ?? ""}
          placeholder="Ex.: Gôndola A12"
          onBlur={(event) =>
            updateObject(object.id, { name: event.target.value || null })
          }
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="object-category">Categoria</FieldLabel>
        <Input
          id="object-category"
          defaultValue={object.category ?? ""}
          placeholder="Ex.: Bebidas"
          onBlur={(event) =>
            updateObject(object.id, { category: event.target.value || null })
          }
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="object-status">Status</FieldLabel>
        <Input
          id="object-status"
          defaultValue={object.status ?? ""}
          placeholder="Ex.: Ativo / Pendente"
          onBlur={(event) =>
            updateObject(object.id, { status: event.target.value || null })
          }
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="object-responsible">Responsável</FieldLabel>
        <Input
          id="object-responsible"
          defaultValue={object.responsibleName ?? ""}
          placeholder="Ex.: João (consultor)"
          onBlur={(event) =>
            updateObject(object.id, {
              responsibleName: event.target.value || null,
            })
          }
        />
      </Field>
    </div>
  );
}
