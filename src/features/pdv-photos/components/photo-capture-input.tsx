"use client";

import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Camera, ImagePlus, Loader2 } from "lucide-react";
import { useRef } from "react";

interface PhotoCaptureInputProps {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
  isUploading?: boolean;
  className?: string;
}

// Dois inputs irmãos em vez de um com `capture` condicional: na prática
// `capture` e `multiple` se excluem — Chrome no Android ignora o `multiple`
// quando há `capture`, e o iOS abre direto a câmera sem opção de galeria.
// O input de câmera só existe no DOM sob mobile.
export function PhotoCaptureInput({
  onFiles,
  disabled,
  isUploading,
  className,
}: PhotoCaptureInputProps) {
  const isMobile = useIsMobile();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    onFiles(Array.from(fileList));
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className ?? ""}`}>
      {isMobile && (
        <>
          <Button
            type="button"
            className="h-11 flex-1 gap-2"
            disabled={disabled || isUploading}
            onClick={() => cameraInputRef.current?.click()}
          >
            {isUploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Camera className="size-4" />
            )}
            Tirar foto
          </Button>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(event) => {
              handleChange(event.target.files);
              event.target.value = "";
            }}
          />
        </>
      )}

      <Button
        type="button"
        variant={isMobile ? "outline" : "default"}
        className="h-11 flex-1 gap-2"
        disabled={disabled || isUploading}
        onClick={() => galleryInputRef.current?.click()}
      >
        {isUploading && !isMobile ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <ImagePlus className="size-4" />
        )}
        {isMobile ? "Galeria" : "Adicionar fotos"}
      </Button>
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => {
          handleChange(event.target.files);
          event.target.value = "";
        }}
      />
    </div>
  );
}
