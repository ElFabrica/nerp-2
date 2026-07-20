"use client";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { PhotoCaptureInput } from "@/features/pdv-photos/components/photo-capture-input";
import { useStores, useCreateStore } from "@/features/stores/hooks/use-stores";
import { useMediaTypes } from "@/features/trade-catalog/hooks/use-trade-catalog";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useIsMobile } from "@/hooks/use-mobile";
import { constructUrl } from "@/hooks/use-construct-url";
import { compressImage } from "@/lib/compress-image";
import { uploadToR2 } from "@/lib/upload-to-r2";
import { cn } from "@/lib/utils";
import { ArrowLeft, Check, Store as StoreIcon, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MAX_PHOTOS } from "./book-page-photo-grid";

interface AddPageSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (payload: {
    storeId: string;
    mediaTypeId?: string;
    photoKeys: string[];
  }) => Promise<void> | void;
  isSaving: boolean;
}

type Step = 1 | 2 | 3;

export function AddPageSheet({
  open,
  onOpenChange,
  onConfirm,
  isSaving,
}: AddPageSheetProps) {
  const isMobile = useIsMobile();
  const [step, setStep] = useState<Step>(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const { stores, isLoading: isLoadingStores } = useStores(
    debouncedSearch || undefined,
  );
  const { mediaTypes, isLoading: isLoadingMediaTypes } = useMediaTypes();
  const createStore = useCreateStore();

  const [storeId, setStoreId] = useState<string | null>(null);
  const [storeName, setStoreName] = useState("");
  const [mediaTypeId, setMediaTypeId] = useState<string | null>(null);
  const [photoKeys, setPhotoKeys] = useState<string[]>([]);
  const [uploadingCount, setUploadingCount] = useState(0);

  useEffect(() => {
    if (open) return;
    setStep(1);
    setSearch("");
    setStoreId(null);
    setStoreName("");
    setMediaTypeId(null);
    setPhotoKeys([]);
    setUploadingCount(0);
  }, [open]);

  const goToMediaStep = () => {
    // Catálogo de mídia vazio não pode travar o promotor em campo.
    setStep(mediaTypes.length === 0 && !isLoadingMediaTypes ? 3 : 2);
  };

  const selectStore = (id: string, name: string) => {
    setStoreId(id);
    setStoreName(name);
    goToMediaStep();
  };

  const handleCreateStore = () => {
    const name = search.trim();
    if (!name) return;
    createStore.mutate(
      { name },
      { onSuccess: (result) => selectStore(result.id, result.name) },
    );
  };

  const handleFiles = async (files: File[]) => {
    const remaining = Math.max(MAX_PHOTOS - photoKeys.length, 0);
    if (remaining === 0) return;
    const toUpload = files.slice(0, remaining);
    setUploadingCount((count) => count + toUpload.length);
    try {
      const keys = await Promise.all(
        toUpload.map(async (file) =>
          uploadToR2(await compressImage(file), true),
        ),
      );
      setPhotoKeys((prev) => [...prev, ...keys].slice(0, MAX_PHOTOS));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Falha ao enviar fotos",
      );
    } finally {
      setUploadingCount((count) => Math.max(0, count - toUpload.length));
    }
  };

  const handleSave = async () => {
    if (!storeId) return;
    await onConfirm({
      storeId,
      mediaTypeId: mediaTypeId ?? undefined,
      photoKeys,
    });
    onOpenChange(false);
  };

  const title =
    step === 1 ? "Escolher o PDV" : step === 2 ? "Tipo de mídia" : "Fotos";
  const description =
    step === 1
      ? "Busque a loja que você está visitando. Se ela ainda não estiver cadastrada, dá pra criar na hora."
      : step === 2
        ? `${storeName} — o que você está fotografando?`
        : `${storeName} — tire as fotos do espaço.`;

  const body = (
    <div className="space-y-4">
      {step === 1 && (
        <Command shouldFilter={false} className="rounded-md border">
          <CommandInput
            value={search}
            onValueChange={setSearch}
            placeholder="Buscar loja…"
          />
          <CommandList className="max-h-[45vh]">
            {isLoadingStores && (
              <div className="flex justify-center py-6">
                <Spinner />
              </div>
            )}
            {!isLoadingStores && stores.length === 0 && (
              <CommandEmpty className="py-6">
                {search.trim() ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="mx-auto h-11 gap-2"
                    disabled={createStore.isPending}
                    onClick={handleCreateStore}
                  >
                    {createStore.isPending ? (
                      <Spinner />
                    ) : (
                      <StoreIcon className="size-4" />
                    )}
                    Criar loja «{search.trim()}»
                  </Button>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    Digite para buscar uma loja.
                  </span>
                )}
              </CommandEmpty>
            )}
            {!isLoadingStores && stores.length > 0 && (
              <CommandGroup>
                {stores.map((store) => (
                  <CommandItem
                    key={store.id}
                    value={store.id}
                    onSelect={() => selectStore(store.id, store.name)}
                    className="min-h-12 cursor-pointer flex-col items-start gap-0.5"
                  >
                    <span className="font-medium">{store.name}</span>
                    {(store.code || store.city) && (
                      <span className="text-xs text-muted-foreground">
                        {[
                          store.code,
                          [store.city, store.state].filter(Boolean).join("/"),
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      )}

      {step === 2 && (
        <>
          <div className="grid grid-cols-2 gap-2">
            {isLoadingMediaTypes && (
              <div className="col-span-2 flex justify-center py-6">
                <Spinner />
              </div>
            )}
            {mediaTypes.map((mediaType) => (
              <button
                key={mediaType.id}
                type="button"
                onClick={() => {
                  setMediaTypeId(mediaType.id);
                  setStep(3);
                }}
                className={cn(
                  "flex min-h-16 flex-col items-start justify-center gap-0.5 rounded-lg border p-3 text-left transition-colors hover:border-primary",
                  mediaTypeId === mediaType.id && "border-primary bg-primary/5",
                )}
              >
                <span className="text-xs font-bold text-muted-foreground">
                  {mediaType.code}
                </span>
                <span className="text-sm font-medium leading-tight">
                  {mediaType.name}
                </span>
              </button>
            ))}
          </div>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => {
              setMediaTypeId(null);
              setStep(3);
            }}
          >
            Não informar a mídia
          </Button>
        </>
      )}

      {step === 3 && (
        <>
          {(photoKeys.length > 0 || uploadingCount > 0) && (
            <div className="grid grid-cols-3 gap-2">
              {photoKeys.map((key) => (
                <div
                  key={key}
                  className="relative aspect-square overflow-hidden rounded-md border"
                >
                  {/* biome-ignore lint/performance/noImgElement: preview simples de key do R2 */}
                  <img
                    src={constructUrl(key)}
                    alt=""
                    className="size-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setPhotoKeys((prev) =>
                        prev.filter((current) => current !== key),
                      )
                    }
                    className="absolute right-1 top-1 flex size-7 items-center justify-center rounded-full bg-black/60 text-white"
                    aria-label="Remover foto"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
              {Array.from({ length: uploadingCount }).map((_, index) => (
                <div
                  key={`uploading-${index}`}
                  className="flex aspect-square items-center justify-center rounded-md border"
                >
                  <Spinner />
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            {photoKeys.length} de {MAX_PHOTOS} fotos
          </p>

          <PhotoCaptureInput
            onFiles={handleFiles}
            disabled={photoKeys.length >= MAX_PHOTOS}
            isUploading={uploadingCount > 0}
          />

          <Button
            type="button"
            className="h-12 w-full gap-2"
            disabled={isSaving || uploadingCount > 0}
            onClick={handleSave}
          >
            {isSaving ? <Spinner /> : <Check className="size-4" />}
            Salvar página
          </Button>
        </>
      )}
    </div>
  );

  const header = (
    <div className="flex items-start gap-2">
      {step > 1 && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={() => setStep((current) => (current === 3 ? 2 : 1) as Step)}
          aria-label="Voltar"
        >
          <ArrowLeft className="size-4" />
        </Button>
      )}
      <div className="space-y-1">
        <span className="text-xs font-medium text-muted-foreground">
          Passo {step} de 3
        </span>
        <p className="text-lg font-semibold leading-none">{title}</p>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="max-h-[92vh] overflow-y-auto px-4 pb-6"
        >
          <SheetHeader className="px-0">
            <SheetTitle asChild>{header}</SheetTitle>
            <SheetDescription>{description}</SheetDescription>
          </SheetHeader>
          {body}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle asChild>{header}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  );
}
