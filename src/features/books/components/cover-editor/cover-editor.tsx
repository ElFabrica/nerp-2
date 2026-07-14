"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useDefaultCoverTemplate,
  useSetDefaultCoverTemplate,
  useSupplierBrands,
  useUpdateBookCoverLayout,
  useUploadCoverImage,
} from "../../hooks/use-books";
import {
  DEFAULT_COVER_BACKGROUND,
  type CoverBackground,
  type CoverElement,
  buildDefaultClosingLayout,
  buildDefaultCoverLayout,
  createImageElement,
  createTextElement,
} from "../../lib/cover-layout";
import { CoverBackgroundPopover } from "./cover-background-popover";
import { CoverPropertiesPanel } from "./cover-properties-panel";
import { CoverToolbar } from "./cover-toolbar";

const CoverStage = dynamic(
  () => import("./cover-stage").then((mod) => mod.CoverStage),
  { ssr: false, loading: () => <div className="flex aspect-video items-center justify-center rounded-lg border"><Spinner /></div> },
);

interface CoverEditorProps {
  bookId: string;
  supplierId: string | null;
  coverLayout: unknown;
  closingLayout: unknown;
  coverBackground: unknown;
  closingBackground: unknown;
}

type PageKey = "cover" | "closing";

function isElementArray(value: unknown): value is CoverElement[] {
  return Array.isArray(value);
}

function isBackground(value: unknown): value is CoverBackground {
  return (
    !!value &&
    typeof value === "object" &&
    "color" in value &&
    "opacity" in value
  );
}

export function CoverEditor({
  bookId,
  supplierId,
  coverLayout,
  closingLayout,
  coverBackground,
  closingBackground,
}: CoverEditorProps) {
  const { template, isLoading: isTemplateLoading } = useDefaultCoverTemplate();
  const updateLayout = useUpdateBookCoverLayout();
  const setDefaultTemplate = useSetDefaultCoverTemplate();
  const uploadImage = useUploadCoverImage();
  const { brands } = useSupplierBrands(supplierId);

  const [activePage, setActivePage] = useState<PageKey>("cover");
  const [cover, setCover] = useState<CoverElement[] | null>(
    isElementArray(coverLayout) ? coverLayout : null,
  );
  const [closing, setClosing] = useState<CoverElement[] | null>(
    isElementArray(closingLayout) ? closingLayout : null,
  );
  const [coverBg, setCoverBg] = useState<CoverBackground | null>(
    isBackground(coverBackground) ? coverBackground : null,
  );
  const [closingBg, setClosingBg] = useState<CoverBackground | null>(
    isBackground(closingBackground) ? closingBackground : null,
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  // Pré-popula com o template padrão da org (ou o layout legado) assim que
  // sabemos que o book ainda não tem capa própria.
  useEffect(() => {
    if (isTemplateLoading) return;
    setCover((current) => current ?? template?.coverLayout ?? buildDefaultCoverLayout());
    setClosing((current) => current ?? template?.closingLayout ?? buildDefaultClosingLayout());
    setCoverBg((current) => current ?? template?.coverBackground ?? DEFAULT_COVER_BACKGROUND);
    setClosingBg((current) => current ?? template?.closingBackground ?? DEFAULT_COVER_BACKGROUND);
  }, [isTemplateLoading, template]);

  const elements = activePage === "cover" ? cover : closing;
  const setElements = activePage === "cover" ? setCover : setClosing;
  const background = activePage === "cover" ? coverBg : closingBg;
  const setBackground = activePage === "cover" ? setCoverBg : setClosingBg;
  const selected = elements?.find((element) => element.id === selectedId) ?? null;

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextSaveRef = useRef(true);

  useEffect(() => {
    if (!cover || !closing || !coverBg || !closingBg) return;
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }
    setSaveStatus("saving");
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      updateLayout.mutate(
        {
          id: bookId,
          coverLayout: cover,
          closingLayout: closing,
          coverBackground: coverBg,
          closingBackground: closingBg,
        },
        { onSuccess: () => setSaveStatus("saved") },
      );
    }, 600);
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cover, closing, coverBg, closingBg, bookId]);

  const updateElement = (id: string, patch: Partial<CoverElement>) => {
    setElements((current) =>
      (current ?? []).map((element) =>
        element.id === id ? ({ ...element, ...patch } as CoverElement) : element,
      ),
    );
  };

  const deleteElement = (id: string) => {
    setElements((current) => (current ?? []).filter((element) => element.id !== id));
    setSelectedId(null);
  };

  const addText = () => {
    const element = createTextElement();
    setElements((current) => [...(current ?? []), element]);
    setSelectedId(element.id);
  };

  const addImageElement = async (file: File) => {
    const key = await uploadImage.mutateAsync(file);
    const element = createImageElement(key, {
      x: 60 + Math.random() * 100,
      y: 60 + Math.random() * 100,
    });
    setElements((current) => [...(current ?? []), element]);
    setSelectedId(element.id);
  };

  const importBrands = () => {
    if (brands.length === 0) return;
    const spacing = 130;
    const totalWidth = brands.length * spacing;
    const startX = Math.max(40, (960 - totalWidth) / 2);
    const newElements = brands
      .filter((brand) => brand.logo)
      .map((brand, index) =>
        createImageElement(brand.logo as string, {
          x: startX + index * spacing,
          y: 460,
          width: 100,
          height: 50,
        }),
      );
    setElements((current) => [...(current ?? []), ...newElements]);
  };

  const handleSetDefault = () => {
    if (!cover || !closing || !coverBg || !closingBg) return;
    setDefaultTemplate.mutate({
      coverLayout: cover,
      closingLayout: closing,
      coverBackground: coverBg,
      closingBackground: closingBg,
    });
  };

  const canImportBrands = useMemo(() => !!supplierId && brands.length > 0, [supplierId, brands]);

  if (!elements || !background) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs value={activePage} onValueChange={(value) => { setActivePage(value as PageKey); setSelectedId(null); }}>
        <TabsList>
          <TabsTrigger value="cover">Capa</TabsTrigger>
          <TabsTrigger value="closing">Página final</TabsTrigger>
        </TabsList>

        <TabsContent value={activePage} className="mt-4">
          <CoverToolbar
            onAddText={addText}
            onAddImage={addImageElement}
            onImportBrands={importBrands}
            canImportBrands={canImportBrands}
            onSetDefault={handleSetDefault}
            isUploadingImage={uploadImage.isPending}
            saveStatus={saveStatus}
            backgroundControl={
              <CoverBackgroundPopover
                background={background}
                onChange={setBackground}
                onUploadImage={uploadImage.mutateAsync}
                isUploadingImage={uploadImage.isPending}
              />
            }
          />

          <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_260px]">
            <CoverStage
              elements={elements}
              background={background}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onChange={updateElement}
            />
            <div className="rounded-lg border p-3">
              <CoverPropertiesPanel
                element={selected}
                onChange={updateElement}
                onDelete={deleteElement}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
