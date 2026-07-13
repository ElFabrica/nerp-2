"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { constructUrl } from "@/hooks/use-construct-url";
import { Trash2 } from "lucide-react";
import Image from "next/image";
import {
  type PdvPhotoFilters,
  useDeletePdvPhoto,
  usePdvPhotos,
} from "../hooks/use-pdv-photos";

interface PdvPhotoHistoryProps {
  filters: PdvPhotoFilters;
  enabled?: boolean;
  emptyText?: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export function PdvPhotoHistory({
  filters,
  enabled = true,
  emptyText = "Nenhuma foto do PDV registrada.",
}: PdvPhotoHistoryProps) {
  const { photos, isLoading } = usePdvPhotos(filters, enabled);
  const deletePhoto = useDeletePdvPhoto();

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (photos.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  }

  return (
    <div className="space-y-3">
      {photos.map((photo) => {
        const chips = [
          photo.section,
          photo.code,
          photo.actionValue != null
            ? photo.actionValue.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })
            : null,
          photo.supplierName,
          photo.responsibleCompany,
          photo.coordinatorName && `Coord.: ${photo.coordinatorName}`,
          photo.consultantName && `Cons.: ${photo.consultantName}`,
        ].filter((value): value is string => !!value);

        return (
          <div key={photo.id} className="rounded-lg border p-3">
            <div className="mb-2 flex items-start justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1">
                <span className="text-sm font-medium">
                  {formatDate(photo.capturedAt)}
                </span>
                {chips.map((chip) => (
                  <Badge key={chip} variant="secondary" className="font-normal">
                    {chip}
                  </Badge>
                ))}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 shrink-0 text-destructive"
                title="Excluir"
                onClick={() => deletePhoto.mutate({ id: photo.id })}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {photo.photos.map((key) => (
                <a
                  key={key}
                  href={constructUrl(key)}
                  target="_blank"
                  rel="noreferrer"
                  className="relative aspect-square overflow-hidden rounded-md border"
                >
                  <Image
                    src={constructUrl(key)}
                    alt="Foto do PDV"
                    fill
                    sizes="100px"
                    className="object-cover transition hover:scale-105"
                  />
                </a>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
