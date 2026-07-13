"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { PdvPhotoSection } from "@/features/pdv-photos/components/pdv-photo-section";
import { ArrowLeft, MapIcon } from "lucide-react";
import Link from "next/link";
import { useStore } from "../hooks/use-stores";

interface StoreDetailProps {
  storeId: string;
}

export function StoreDetail({ storeId }: StoreDetailProps) {
  const { store, isLoading } = useStore(storeId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link href="/lojas" aria-label="Voltar para lojas">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">{store?.name ?? "Loja"}</h1>
            {store?.managerName && (
              <p className="text-sm text-muted-foreground">
                Gerente: {store.managerName}
              </p>
            )}
          </div>
        </div>
        <Button asChild variant="outline">
          <Link href={`/lojas/${storeId}/mapa`}>
            <MapIcon className="size-4" />
            Abrir mapa
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <PdvPhotoSection storeId={storeId} title="Fotos do PDV da loja" />
        </CardContent>
      </Card>
    </div>
  );
}
