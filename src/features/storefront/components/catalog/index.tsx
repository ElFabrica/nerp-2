"use client";

import { FiltersCatalog } from "./filters";
import { useCallback, useEffect, useState } from "react";
import { ProductCard } from "./product-card";
import type { EmblaCarouselType, EmblaOptionsType } from "embla-carousel";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { notFound } from "next/navigation";
import { useCatalogSettings } from "@/features/storefront/hooks/use-catalog-settings";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryCatalogProducts } from "@/features/storefront/hooks/use-catalog-products";
import Image from "next/image";
import { useConstructUrl } from "@/hooks/use-construct-url";
import { useQueryState } from "nuqs";
import { parseCurrencyInput } from "@/utils/currency-formatter";
interface CatalogProps {
  subdomain: string;
}
export function Catalog({ subdomain }: CatalogProps) {
  const options: EmblaOptionsType = { loop: true };
  const [categoriesSlugs] = useQueryState("categories");
  const [minValue] = useQueryState("min_value");
  const [maxValue] = useQueryState("max_value");

  const { data: catalogSettings, isLoading } = useCatalogSettings({
    subdomain,
  });

  const { data, isLoadingProducts } = useQueryCatalogProducts({
    subdomain,
    categories: categoriesSlugs?.trim().split(","),
    minValue: minValue ? parseCurrencyInput(minValue) : undefined,
    maxValue: maxValue ? parseCurrencyInput(maxValue) : undefined,
  });

  const [emblaRef, emblaApi] = useEmblaCarousel(options, [
    Autoplay({ playOnInit: true, delay: 4000 }),
  ]);

  if (isLoading || isLoadingProducts) {
    return (
      <div className="w-full max-w-6xl mx-auto justify-center">
        <div className="flex flex-col w-full justify-between px-3">
          {/*Carousel */}
          <div className="overflow-hidden size-full mt-7">
            <div className="flex gap-2 size-full">
              <div className="flex w-full justify-center translate-0 shrink-0 grow-0 min-w-full size-full">
                <Skeleton className="h-64 w-full bg-accent-foreground/10 rounded-sm" />
              </div>
            </div>
          </div>
          <div className="flex flex-row w-full items-center justify-between gap-x-3 py-6 ">
            <Skeleton className="w-24 h-6 bg-accent-foreground/10" />
            <Skeleton className="w-24 h-6 bg-accent-foreground/10" />
          </div>
          <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: 10 }).map((_, index) => (
              <Skeleton
                key={index}
                className="h-64 w-full bg-accent-foreground/10"
              />
            ))}
          </ul>
        </div>
      </div>
    );
  }

  if (catalogSettings === undefined) {
    console.log("Espera 01");
    return notFound();
  }

  if (data === undefined) {
    console.log("Espera 02");
    return notFound();
  }

  if (catalogSettings.isActive === false) {
    console.log("Espera 03");
    return notFound();
  }

  const { products, categories } = data;

  return (
    <div className="w-full max-w-6xl mx-auto justify-center">
      <div className="flex flex-col w-full justify-between px-3">
        {/*Carousel */}
        <div className="overflow-hidden size-full mt-7" ref={emblaRef}>
          <div className="flex gap-2 size-full">
            {catalogSettings.bannerImages &&
              catalogSettings.bannerImages.map((image, index) => (
                <div
                  className="flex w-full justify-center translate-0 shrink-0 grow-0 min-w-full size-full h-60 relative"
                  key={`image-carousel-${index}`}
                >
                  <Image
                    src={useConstructUrl(image)}
                    alt="Imagem do catalogo"
                    className="object-cover w-full rounded-sm"
                    fill
                  />
                </div>
              ))}
          </div>
        </div>
        <div className="flex flex-row w-full items-center justify-between gap-x-3 py-6 ">
          <span className="hidden sm:block text-sm text-muted-foreground">
            {products.length} produto(s) encontrado(s)
          </span>
          <FiltersCatalog categories={categories} />
        </div>
        <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {products.map((product, index) => (
            <ProductCard
              key={`product-${product.id}-${index}`}
              subdomain={subdomain}
              id={product.id}
              isDisponile={product.productIsDisponile}
              organizationId={product.organizationId}
              name={product.name}
              slug={product.slug}
              salePrice={product.salePrice}
              promotionalPrice={product.promotionalPrice}
              thumbnail={product.thumbnail}
              allowsOrders={catalogSettings.allowOrders}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}

// use DotButton
type UseDotButtonType = {
  selectedIndex: number;
  scrollSnaps: number[];
  onDotButtonClick: (index: number) => void;
};

export const useDotButton = (
  emblaApi: EmblaCarouselType | undefined,
  onButtonClick?: (emblaApi: EmblaCarouselType) => void,
): UseDotButtonType => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const onDotButtonClick = useCallback(
    (index: number) => {
      if (!emblaApi) return;
      emblaApi.scrollTo(index);
      if (onButtonClick) onButtonClick(emblaApi);
    },
    [emblaApi, onButtonClick],
  );

  const onInit = useCallback((emblaApi: EmblaCarouselType) => {
    setScrollSnaps(emblaApi.scrollSnapList());
  }, []);

  const onSelect = useCallback((emblaApi: EmblaCarouselType) => {
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;

    onInit(emblaApi);
    onSelect(emblaApi);

    emblaApi.on("reInit", onInit).on("reInit", onSelect).on("select", onSelect);
  }, [emblaApi, onInit, onSelect]);

  return {
    selectedIndex,
    scrollSnaps,
    onDotButtonClick,
  };
};
