"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfigPanel } from "./components/config-panel";
import { CatalogPreview } from "./components/catalog-preview";
import {
  usePromotionalCatalog,
  useUpdateCatalog,
  usePromotionalProducts,
} from "./hooks/use-catalog";
import { useExport } from "./hooks/use-export";
import type { CatalogConfig } from "./types";
import { DEFAULT_CONFIG } from "./types";

// Calcula itens por página com base no layout e no tamanho do canvas.
// As estimativas refletem o nº de cards que cabem verticalmente dentro
// de 1080×1080 (square) ou 1080×1920 (story) considerando a altura
// típica de cada card + espaçamento + cabeçalho.
function getItemsPerPage(
  layout: CatalogConfig["layout"],
  pageSize: CatalogConfig["pageSize"],
): number {
  const story = pageSize === "story";
  switch (layout) {
    case "grid-2":   return story ? 4  : 2;
    case "grid-3":   return story ? 9  : 6;
    case "grid-4":   return story ? 16 : 8;
    case "list":     return story ? 12 : 6;
    case "featured": return story ? 10 : 5;
    case "carousel": return story ? 8  : 4;
    case "masonry":  return story ? 9  : 6;
    case "table":    return story ? 20 : 10;
    default:         return 6;
  }
}

interface CatalogEditorProps {
  catalogId: string;
}

export function CatalogEditor({ catalogId }: CatalogEditorProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const allPageRefs = useRef<(HTMLDivElement | null)[]>([]);

  const { data: catalogData, isLoading } = usePromotionalCatalog(catalogId);
  const updateMutation = useUpdateCatalog();

  const [config, setConfig] = useState<CatalogConfig>(DEFAULT_CONFIG);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  useEffect(() => {
    if (catalogData?.config) {
      setConfig({ ...DEFAULT_CONFIG, ...(catalogData.config as Partial<CatalogConfig>) });
    }
  }, [catalogData?.config]);

  // Fetch estável: excludedProductIds e sortBy não entram na query key.
  // Mudar esses campos nunca dispara um novo fetch — o useMemo abaixo
  // recalcula em tempo real, garantindo UI otimista sem reset.
  const { data: rawProducts = [] } = usePromotionalProducts({
    manuallyAddedIds: config.manuallyAddedIds,
    categoryFilter: config.categoryFilter,
  });

  const products = useMemo(() => {
    const excluded = new Set(config.excludedProductIds);
    let list = rawProducts.filter((p) => !excluded.has(p.id));

    switch (config.sortBy) {
      case "discount-desc":
        list = [...list].sort((a, b) => (b.discount ?? 0) - (a.discount ?? 0));
        break;
      case "savings-desc":
        list = [...list].sort((a, b) => (b.savings ?? 0) - (a.savings ?? 0));
        break;
      case "price-asc":
        list = [...list].sort(
          (a, b) =>
            (a.promotionalPrice ?? a.salePrice) -
            (b.promotionalPrice ?? b.salePrice),
        );
        break;
      case "price-desc":
        list = [...list].sort(
          (a, b) =>
            (b.promotionalPrice ?? b.salePrice) -
            (a.promotionalPrice ?? a.salePrice),
        );
        break;
      case "name-asc":
        list = [...list].sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return list;
  }, [rawProducts, config.excludedProductIds, config.sortBy]);

  // Paginação — quantos itens cabem por página (baseado no layout + canvas)
  const itemsPerPage = useMemo(
    () => getItemsPerPage(config.layout, config.pageSize),
    [config.layout, config.pageSize],
  );

  const [currentPage, setCurrentPage] = useState(0);

  const totalPages = Math.max(1, Math.ceil(products.length / itemsPerPage));

  const pageProducts = useMemo(
    () => products.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage),
    [products, currentPage, itemsPerPage],
  );

  // Volta à pag. 0 quando o nº de itens por página muda (troca de layout/formato)
  useEffect(() => {
    setCurrentPage(0);
  }, [itemsPerPage]);

  // Todos os chunks de produtos (para renderização oculta + export PDF multi-página)
  const pageChunks = useMemo(
    () =>
      Array.from({ length: totalPages }, (_, i) =>
        products.slice(i * itemsPerPage, (i + 1) * itemsPerPage),
      ),
    [products, totalPages, itemsPerPage],
  );

  // Auto-save with debounce
  useEffect(() => {
    if (!catalogData) return;
    setSaveStatus("saving");
    const timer = setTimeout(() => {
      updateMutation.mutate(
        { id: catalogId, config: config as Record<string, unknown> },
        {
          onSuccess: () => setSaveStatus("saved"),
          onError: () => setSaveStatus("idle"),
        },
      );
    }, 800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  const { exportAsPng, exportAsPdf, isExporting } = useExport({
    previewRef,
    allPageRefs,
    totalPages,
    catalogName: catalogData?.name ?? "catalogo",
    pageSize: config.pageSize,
  });

  const handleConfigChange = (changes: Partial<CatalogConfig>) => {
    setConfig((prev) => ({ ...prev, ...changes }));
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (!catalogData) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <p className="text-muted-foreground">Catálogo não encontrado.</p>
        <Button asChild variant="outline">
          <Link href="/catalogo-promocional">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0 h-full">
      {/* Header */}
      <div className="flex items-center gap-4 pb-4">
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <Button asChild variant="ghost" size="sm" className="shrink-0">
            <Link href="/catalogo-promocional">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Catálogos
            </Link>
          </Button>
          <span className="text-muted-foreground text-sm">/</span>
          <span className="font-semibold text-sm truncate px-1">{catalogData.name}</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {saveStatus === "saving" ? "Salvando..." : saveStatus === "saved" ? "Salvo" : ""}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            updateMutation.mutate({ id: catalogId, config: config as Record<string, unknown> })
          }
        >
          <Save className="h-4 w-4 mr-1" />
          Salvar
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={isExporting}>
              {isExporting ? "Gerando..." : "↓ Exportar"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={exportAsPng}>
              Baixar página atual (PNG)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportAsPdf}>
              Baixar todas as páginas (PDF)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/*
        Páginas ocultas fora da viewport — cada CatalogPreview é renderizado
        com width=1080 para que o scale interno seja 1:1, garantindo que o
        html-to-image capture o canvas no tamanho correto (1080×pageH).
      */}
      <div
        style={{ position: "fixed", left: -9999, top: 0, width: 1080, pointerEvents: "none" }}
        aria-hidden
      >
        {pageChunks.map((prods, i) => (
          <CatalogPreview
            key={i}
            ref={(el) => { allPageRefs.current[i] = el; }}
            config={config}
            products={prods}
          />
        ))}
      </div>

      {/* Editor layout */}
      <div className="flex gap-0 border rounded-lg overflow-hidden" style={{ height: "calc(100vh - 220px)" }}>
        {/* Config panel */}
        <div className="w-72 shrink-0 border-r bg-background overflow-hidden flex flex-col">
          <ConfigPanel
            config={config}
            products={products}
            onConfigChange={handleConfigChange}
          />
        </div>

        {/* Preview */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-3 px-4 py-2 border-b bg-background shrink-0">
              <Button
                variant="ghost"
                size="sm"
                disabled={currentPage === 0}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <span className="text-xs text-muted-foreground">
                Página {currentPage + 1} de {totalPages}
                <span className="ml-2 opacity-60">
                  ({products.length} produto{products.length !== 1 ? "s" : ""})
                </span>
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={currentPage >= totalPages - 1}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Próxima
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
          <div className="flex-1 overflow-auto bg-muted/30 p-6">
            <CatalogPreview ref={previewRef} config={config} products={pageProducts} />
          </div>
        </div>
      </div>
    </div>
  );
}
