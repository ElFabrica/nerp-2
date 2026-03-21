"use client";

import { useEffect, useState } from "react";
import type { ProductCatalog } from "../../types/product";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { currencyFormatter } from "@/utils/currency-formatter";
import Image from "next/image";
import { useConstructUrl } from "@/hooks/use-construct-url";
import placeholder from "@/assets/background-default-image.svg";
import Link from "next/link";
import { useCart } from "@/hooks/use-cart";
import { ButtonSale } from "../button-sale";

interface ProductCardProps extends ProductCatalog {
  allowsOrders?: boolean;
  subdomain: string;
  isDisponile: boolean;
  promotionalPrice: number | null;
}

export function ProductCard({
  id,
  name,
  salePrice,
  promotionalPrice,
  thumbnail,
  allowsOrders,
  slug,
  subdomain,
  isDisponile,
}: ProductCardProps) {
  const { toggleProduct, isProductInCart } = useCart(subdomain);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const showAsInCart = isMounted && isProductInCart(id);
  const isDisabled = isMounted && isProductInCart(id);

  const imageSrc =
    thumbnail && thumbnail.trim() !== ""
      ? useConstructUrl(thumbnail)
      : placeholder;

  return (
    <div
      id={id}
      className="flex flex-col items-center 
      gap-y-3 pb-5 rounded-sm bg-accent-foreground/5 shadow-sm 
      transition-shadow overflow-hidden animate-fade-in
      hover:shadow-md hover:shadow-elegant"
    >
      <div className="aspect-square overflow-hidden w-full relative h-45">
        <Link href={`/${slug}`}>
          <Image
            className="object-cover transition-transform rounded-sm cursor-pointer"
            src={imageSrc}
            alt={name}
            fill
          />
        </Link>
      </div>
      <div className="flex flex-col w-full px-5">
        <Tooltip>
          <TooltipTrigger asChild>
            <h2 className="text-sm font-semibold line-clamp-1 min-h-[30px]">
              {name}
            </h2>
          </TooltipTrigger>
          <TooltipContent>
            <p>{name}</p>
          </TooltipContent>
        </Tooltip>
        {promotionalPrice ? (
          <div className="flex items-center gap-x-2">
            <p className="text-lg font-bold">
              R${currencyFormatter(promotionalPrice)}
            </p>
            <p className="text-sm font-semibold line-through">
              R${currencyFormatter(salePrice)}
            </p>
          </div>
        ) : (
          <p className="text-lg font-bold">R${currencyFormatter(salePrice)}</p>
        )}
      </div>
      {allowsOrders && (
        <div className="flex items-center gap-x-2 w-full px-5">
          <ButtonSale
            className="w-full"
            data={{
              productIsDisponile: isDisponile,
              showAsInCart: showAsInCart,
            }}
            onClick={() => toggleProduct(id, "1")}
          />
        </div>
      )}
    </div>
  );
}
