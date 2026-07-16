"use client";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { useBrands } from "@/features/brands/hooks/use-brands";
import { PdvPhotoSection } from "@/features/pdv-photos/components/pdv-photo-section";
import { useSupplier } from "@/features/supplier/hooks/use-supplier";
import { useMediaTypes, useStoreSectors } from "@/features/trade-catalog/hooks/use-trade-catalog";
import { RefreshCw, Trash2 } from "lucide-react";
import {
  type NegotiationField,
  readNegotiation,
  withNegotiationField,
} from "../engine/negotiation";
import { useSceneStore } from "../engine/scene-store";
import {
  NEGOTIABLE_TYPES,
  SPACE_STATE_META,
  SPACE_STATE_ORDER,
} from "../engine/space-state";
import type { MapObjectType } from "../engine/types";
import { useAssignSpaceCode } from "../hooks/use-assign-space-code";

const NONE = "__none__";
const DEFAULT_LABEL_FONT_M = 0.4;

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
  const storeId = useSceneStore((state) => state.floorPlan?.storeId);

  const object = selectedIds.length === 1 ? objects[selectedIds[0]] : undefined;
  const { suppliers } = useSupplier();
  const { brands } = useBrands(object?.supplierId ?? undefined);
  const { storeSectors } = useStoreSectors();
  const { mediaTypes } = useMediaTypes();
  const assignSpaceCode = useAssignSpaceCode();

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

  if (!object) return null;

  const size =
    object.geometry.kind === "RECT"
      ? `${object.geometry.width.toFixed(2)} × ${object.geometry.height.toFixed(2)} m`
      : null;

  const negotiation = readNegotiation(object.properties);

  const setNegotiation = (field: NegotiationField, value: string) =>
    updateObject(object.id, {
      properties: withNegotiationField(object, field, value),
    });

  const isNegotiable = NEGOTIABLE_TYPES.has(object.type);
  const labelFont = object.style.fontSize ?? DEFAULT_LABEL_FONT_M;

  const handleAssignCode = () => {
    assignSpaceCode.mutate(
      { mapObjectId: object.id },
      {
        onSuccess: (result) =>
          updateObject(object.id, {
            spaceCode: result.spaceCode,
            spaceSeq: result.spaceSeq,
          }),
      },
    );
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium">
            {TYPE_LABELS[object.type]}
          </span>
          {size && (
            <span className="mt-1 text-xs text-muted-foreground">{size}</span>
          )}
        </div>
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

      <div className="space-y-4" key={object.id}>
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
          <FieldLabel>Tamanho do rótulo ({labelFont.toFixed(1)} m)</FieldLabel>
          <Slider
            value={[labelFont]}
            min={0.2}
            max={2}
            step={0.1}
            onValueChange={([value]) =>
              updateObject(object.id, {
                style: { ...object.style, fontSize: value },
              })
            }
          />
        </Field>

        {isNegotiable && (
          <>
            <Field>
              <FieldLabel>Estado do espaço</FieldLabel>
              <Select
                value={object.spaceState}
                onValueChange={(value) =>
                  updateObject(object.id, {
                    spaceState: value as (typeof SPACE_STATE_ORDER)[number],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SPACE_STATE_ORDER.map((state) => (
                    <SelectItem key={state} value={state}>
                      {SPACE_STATE_META[state].dot} {SPACE_STATE_META[state].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>ID do espaço</FieldLabel>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={object.spaceCode ?? ""}
                  placeholder="Gere o Digital Space ID"
                  className="font-mono text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  title={object.spaceCode ? "Regenerar ID" : "Gerar ID"}
                  disabled={assignSpaceCode.isPending}
                  onClick={handleAssignCode}
                >
                  <RefreshCw className="size-4" />
                </Button>
              </div>
            </Field>
          </>
        )}

        <Field>
          <FieldLabel>Categoria</FieldLabel>
          <Select
            value={object.category ?? NONE}
            onValueChange={(value) =>
              updateObject(object.id, { category: value === NONE ? null : value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o setor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Nenhuma</SelectItem>
              {storeSectors.map((sector) => (
                <SelectItem key={sector.id} value={sector.name}>
                  {sector.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel htmlFor="object-location">Localização</FieldLabel>
          <Input
            id="object-location"
            defaultValue={negotiation.location ?? ""}
            placeholder="Ex.: Corredor 05 | Lado direito"
            onBlur={(event) => setNegotiation("location", event.target.value)}
          />
        </Field>

        <Field>
          <FieldLabel>Tipo de espaço</FieldLabel>
          <Select
            value={negotiation.spaceType ?? NONE}
            onValueChange={(value) =>
              setNegotiation("spaceType", value === NONE ? "" : value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo de mídia" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Nenhum</SelectItem>
              <SelectGroup>
                <SelectLabel>Mídia física</SelectLabel>
                {mediaTypes
                  .filter((media) => media.kind === "FISICA")
                  .map((media) => (
                    <SelectItem key={media.id} value={media.name}>
                      {media.code} — {media.name}
                    </SelectItem>
                  ))}
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>Mídia digital</SelectLabel>
                {mediaTypes
                  .filter((media) => media.kind === "DIGITAL")
                  .map((media) => (
                    <SelectItem key={media.id} value={media.name}>
                      {media.code} — {media.name}
                    </SelectItem>
                  ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field>
        <FieldLabel>Empresa / Indústria</FieldLabel>
        <Select
          value={object.supplierId ?? NONE}
          onValueChange={(value) =>
            updateObject(object.id, {
              supplierId: value === NONE ? null : value,
              brandId: null,
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione a indústria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>Nenhuma</SelectItem>
            {suppliers.map((supplier) => (
              <SelectItem key={supplier.id} value={supplier.id}>
                {supplier.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {object.supplierId && (
        <Field>
          <FieldLabel>Marca</FieldLabel>
          <Select
            value={object.brandId ?? NONE}
            onValueChange={(value) =>
              updateObject(object.id, {
                brandId: value === NONE ? null : value,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a marca" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Nenhuma</SelectItem>
              {brands.map((brand) => (
                <SelectItem key={brand.id} value={brand.id}>
                  {brand.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      )}

      <div className="space-y-4" key={`${object.id}-meta`}>
        <Field>
          <FieldLabel htmlFor="object-distributor">
            Distribuidor / Representante
          </FieldLabel>
          <Input
            id="object-distributor"
            defaultValue={negotiation.distributor ?? ""}
            placeholder="Ex.: Solar"
            onBlur={(event) =>
              setNegotiation("distributor", event.target.value)
            }
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field>
            <FieldLabel htmlFor="object-negotiation-start">Início</FieldLabel>
            <Input
              id="object-negotiation-start"
              type="date"
              defaultValue={negotiation.negotiationStart ?? ""}
              onBlur={(event) =>
                setNegotiation("negotiationStart", event.target.value)
              }
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="object-negotiation-end">Fim</FieldLabel>
            <Input
              id="object-negotiation-end"
              type="date"
              defaultValue={negotiation.negotiationEnd ?? ""}
              onBlur={(event) =>
                setNegotiation("negotiationEnd", event.target.value)
              }
            />
          </Field>
        </div>

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
