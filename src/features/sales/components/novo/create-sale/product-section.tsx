import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Grid3X3Icon, ListIcon, Search } from "lucide-react";
import { ProductSale } from ".";
import { currencyFormatter } from "@/utils/currency-formatter";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import { useQueryState } from "nuqs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export type ViewMode = "grid" | "list";

interface ProductSessionProps {
  products: ProductSale[];
  addToCart: (product: ProductSale) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  isLoading?: boolean;
}

export function ProductSection({
  products,
  addToCart,
  searchInputRef,
  searchTerm,
  setSearchTerm,
  viewMode,
  setViewMode,
  hasNextPage,
  hasPreviousPage,
  isLoading,
}: ProductSessionProps) {
  const [page, setPage] = useQueryState("page");

  const previousIsDisabled = !hasPreviousPage;
  const nextIsDisabled = !hasNextPage;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Buscar por nome, SKU ou código de barras..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Tabs
              value={viewMode}
              onValueChange={(v) => setViewMode(v as ViewMode)}
            >
              <TabsList className="h-9">
                <TabsTrigger value="grid" className="px-2">
                  <Grid3X3Icon className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="list" className="px-2">
                  <ListIcon className="h-4 w-4" />
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === "grid" ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {isLoading
                ? Array.from({ length: 12 }).map((_, index) => (
                    <Skeleton key={index} className="h-33 w-full" />
                  ))
                : products.map((product) => (
                    <button
                      key={product.id}
                      onClick={() =>
                        Number(product.currentStock) > 0 && addToCart(product)
                      }
                      disabled={Number(product.currentStock) === 0}
                      className="group relative flex flex-col items-center gap-2 rounded-lg border p-3 transition-all hover:border-secondary hover:bg-accent/30  disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Avatar className="h-14 w-14 rounded-md">
                        <AvatarImage
                          src={product.image || "/placeholder.svg"}
                          alt={product.name}
                        />
                        <AvatarFallback>
                          {product.name.substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-center">
                        <div className="text-xs font-medium line-clamp-2">
                          {product.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {product.sku}
                        </div>
                        <div className="mt-1 text-sm font-semibold text-green-600">
                          {currencyFormatter(product.salePrice)}
                        </div>
                        <Badge
                          variant={
                            product.currentStock > 0 ? "default" : "destructive"
                          }
                          className="mt-1 text-xs"
                        >
                          {product.currentStock > 0
                            ? `${product.currentStock} un`
                            : "Sem estoque"}
                        </Badge>
                      </div>
                    </button>
                  ))}
            </div>
          ) : (
            <div className="space-y-2">
              {isLoading
                ? Array.from({ length: 12 }).map((_, index) => (
                    <Skeleton key={index} className="h-24 w-24" />
                  ))
                : products.map((product) => (
                    <button
                      key={product.id}
                      onClick={() =>
                        product.currentStock > 0 && addToCart(product)
                      }
                      disabled={product.currentStock === 0}
                      className="w-full flex items-center gap-3 rounded-lg border p-3 transition-all hover:border-primary hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Avatar className="h-12 w-12 rounded-md">
                        <AvatarImage
                          src={product.image || "/placeholder.svg"}
                          alt={product.name}
                        />
                        <AvatarFallback>
                          {product.name.substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {product.sku} | {product.barcode}
                        </div>
                      </div>
                      <Badge
                        variant={
                          product.currentStock > 0 ? "secondary" : "destructive"
                        }
                      >
                        {product.currentStock > 0
                          ? `${product.currentStock} un`
                          : "Sem estoque"}
                      </Badge>
                      <div className="font-semibold text-primary">
                        {currencyFormatter(product.salePrice)}
                      </div>
                    </button>
                  ))}
            </div>
          )}
          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationItem>
                <Button
                  variant={"secondary"}
                  disabled={previousIsDisabled}
                  onClick={() => setPage(String((Number(page) || 1) - 1))}
                >
                  Anterior
                </Button>
              </PaginationItem>
              <Button variant={"secondary"} disabled>
                {page || 1}
              </Button>
              <PaginationItem>
                <Button
                  variant={"secondary"}
                  disabled={nextIsDisabled}
                  onClick={() => setPage(String((Number(page) || 1) + 1))}
                >
                  Próximo
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </CardContent>
      </Card>
    </div>
  );
}
