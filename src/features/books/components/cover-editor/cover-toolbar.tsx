"use client";

import type { ReactNode } from "react";
import { useRef } from "react";
import { ImagePlus, Loader2, Star, Tag, Type } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CoverToolbarProps {
  onAddText: () => void;
  onAddImage: (file: File) => void;
  onImportBrands: () => void;
  canImportBrands: boolean;
  onSetDefault: () => void;
  isUploadingImage: boolean;
  saveStatus: "idle" | "saving" | "saved";
  backgroundControl?: ReactNode;
}

export function CoverToolbar({
  onAddText,
  onAddImage,
  onImportBrands,
  canImportBrands,
  onSetDefault,
  isUploadingImage,
  saveStatus,
  backgroundControl,
}: CoverToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="outline" size="sm" onClick={onAddText} className="gap-2">
        <Type className="size-4" /> Texto
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-2"
        disabled={isUploadingImage}
        onClick={() => fileInputRef.current?.click()}
      >
        {isUploadingImage ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <ImagePlus className="size-4" />
        )}
        Imagem
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onAddImage(file);
          event.target.value = "";
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-2"
        disabled={!canImportBrands}
        onClick={onImportBrands}
        title={canImportBrands ? undefined : "Book sem indústria vinculada"}
      >
        <Tag className="size-4" /> Importar marcas
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={onSetDefault}
      >
        <Star className="size-4" /> Tornar padrão
      </Button>
      {backgroundControl}
      <span className="ml-auto text-xs text-muted-foreground">
        {saveStatus === "saving" && "Salvando…"}
        {saveStatus === "saved" && "Salvo"}
      </span>
    </div>
  );
}
