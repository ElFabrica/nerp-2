"use client";

import { constructUrl } from "@/hooks/use-construct-url";
import { uploadToR2 } from "@/lib/upload-to-r2";
import { Loader2, Plus, X } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { toast } from "sonner";

interface MultiPhotoUploaderProps {
  value: string[];
  onChange: (keys: string[]) => void;
  disabled?: boolean;
}

export function MultiPhotoUploader({
  value,
  onChange,
  disabled,
}: MultiPhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadingCount, setUploadingCount] = useState(0);

  const handleFiles = async (files: FileList) => {
    const list = Array.from(files);
    if (list.length === 0) return;
    setUploadingCount((count) => count + list.length);
    try {
      const keys = await Promise.all(list.map((file) => uploadToR2(file)));
      onChange([...value, ...keys]);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Falha ao enviar fotos",
      );
    } finally {
      setUploadingCount((count) => Math.max(0, count - list.length));
    }
  };

  const removeAt = (index: number) => {
    onChange(value.filter((_, current) => current !== index));
  };

  return (
    <div className="grid grid-cols-3 gap-2">
      {value.map((key, index) => (
        <div
          key={key}
          className="group relative aspect-square overflow-hidden rounded-md border"
        >
          <Image
            src={constructUrl(key)}
            alt="Foto do PDV"
            fill
            sizes="120px"
            className="object-cover"
          />
          <button
            type="button"
            onClick={() => removeAt(index)}
            className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100"
            aria-label="Remover foto"
          >
            <X className="size-3" />
          </button>
        </div>
      ))}

      {Array.from({ length: uploadingCount }).map((_, index) => (
        <div
          key={`uploading-${index}`}
          className="flex aspect-square items-center justify-center rounded-md border"
        >
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ))}

      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className="flex aspect-square items-center justify-center rounded-md border border-dashed text-muted-foreground transition hover:border-primary hover:text-primary disabled:opacity-50"
        aria-label="Adicionar fotos"
      >
        <Plus className="size-5" />
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => {
          if (event.target.files) handleFiles(event.target.files);
          event.target.value = "";
        }}
      />
    </div>
  );
}
