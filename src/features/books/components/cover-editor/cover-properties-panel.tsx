"use client";

import { AlignCenter, AlignLeft, AlignRight, Bold, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { CoverElement } from "../../lib/cover-layout";

interface CoverPropertiesPanelProps {
  element: CoverElement | null;
  onChange: (id: string, patch: Partial<CoverElement>) => void;
  onDelete: (id: string) => void;
}

export function CoverPropertiesPanel({
  element,
  onChange,
  onDelete,
}: CoverPropertiesPanelProps) {
  if (!element) {
    return (
      <p className="text-sm text-muted-foreground">
        Selecione um elemento no canvas pra editar.
      </p>
    );
  }

  const patch = (value: Partial<CoverElement>) => onChange(element.id, value);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium capitalize">
          {element.type === "text"
            ? "Texto"
            : element.type === "image"
              ? "Imagem"
              : "Linha divisória"}
        </p>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(element.id)}
          title="Remover elemento"
        >
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </div>

      {element.type === "text" && (
        <>
          <div className="space-y-1.5">
            <Label className="text-xs">Texto</Label>
            <Textarea
              value={element.text}
              onChange={(event) => patch({ text: event.target.value })}
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Tamanho da fonte</Label>
              <Input
                type="number"
                min={8}
                max={120}
                value={element.fontSize}
                onChange={(event) =>
                  patch({ fontSize: Number(event.target.value) || element.fontSize })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Cor</Label>
              <input
                type="color"
                className="h-9 w-full rounded-md border"
                value={element.color}
                onChange={(event) => patch({ color: event.target.value })}
              />
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant={element.fontWeight === "bold" ? "default" : "outline"}
              size="icon"
              onClick={() =>
                patch({ fontWeight: element.fontWeight === "bold" ? "normal" : "bold" })
              }
            >
              <Bold className="size-4" />
            </Button>
            <Button
              type="button"
              variant={element.align === "left" ? "default" : "outline"}
              size="icon"
              onClick={() => patch({ align: "left" })}
            >
              <AlignLeft className="size-4" />
            </Button>
            <Button
              type="button"
              variant={element.align === "center" ? "default" : "outline"}
              size="icon"
              onClick={() => patch({ align: "center" })}
            >
              <AlignCenter className="size-4" />
            </Button>
            <Button
              type="button"
              variant={element.align === "right" ? "default" : "outline"}
              size="icon"
              onClick={() => patch({ align: "right" })}
            >
              <AlignRight className="size-4" />
            </Button>
            <button
              type="button"
              className={cn(
                "ml-auto text-xs px-2 py-1 rounded-md border",
                element.uppercase && "bg-primary text-primary-foreground",
              )}
              onClick={() => patch({ uppercase: !element.uppercase })}
            >
              MAIÚSCULAS
            </button>
          </div>
        </>
      )}

      {element.type === "divider" && (
        <div className="space-y-1.5">
          <Label className="text-xs">Cor</Label>
          <input
            type="color"
            className="h-9 w-full rounded-md border"
            value={element.color}
            onChange={(event) => patch({ color: event.target.value })}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Largura</Label>
          <Input
            type="number"
            value={Math.round(element.width)}
            onChange={(event) =>
              patch({ width: Number(event.target.value) || element.width })
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Altura</Label>
          <Input
            type="number"
            value={Math.round(element.height)}
            onChange={(event) =>
              patch({ height: Number(event.target.value) || element.height })
            }
          />
        </div>
      </div>
    </div>
  );
}
