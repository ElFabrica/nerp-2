"use client";

import {
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Package,
  AlertTriangle,
  ShoppingCart,
  DollarSign,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageHeader } from "@/components/page-header";
import { useQueryDashboard } from "@/features/dashboard/hooks/use-dashboard";
import {
  currencyFormatter,
  formatCurrencyInput,
} from "@/utils/currency-formatter";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { ptBR } from "date-fns/locale";
import {
  getSaleStatusBadgeClass,
  getSaleStatusLabel,
} from "@/utils/convert-sale-status";
import { ReactNode } from "react";
import {
  FormatMessageSalesToday,
  FormatMessageTotalSales,
} from "./format-values";

export default function DashboardPage() {
  const { data, isDashboardLoading } = useQueryDashboard({});

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Visão geral do seu negócio" />

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total em Vendas
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {isDashboardLoading ? (
                <Skeleton className="h-6 w-20" />
              ) : (
                <>
                  {formatCurrency(data?.salesTotal ?? 0)}
                  <FormatMessageTotalSales value={data?.salesTotal || 0} />
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Produtos Ativos
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {isDashboardLoading ? (
                <Skeleton className="h-6 w-20" />
              ) : (
                <>
                  {data?.productsActive}
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Plus className="h-3 w-3 text-green-500" />
                    <span className="text-green-500">
                      {data?.productAddedToday}
                    </span>{" "}
                    novos hoje
                  </p>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Estoque Baixo
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {isDashboardLoading ? (
                <Skeleton className="h-6 w-20" />
              ) : (
                <>
                  {data?.productsLowStock}

                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <ArrowDownRight className="h-3 w-3 text-red-500" />
                    <span className="text-red-500">-3</span> desde ontem
                  </p>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Vendas Hoje
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {isDashboardLoading ? (
                <Skeleton className="h-6 w-20" />
              ) : (
                <>
                  {data?.salesToday}
                  <FormatMessageSalesToday
                    value={data?.salesFromYesterdayToToday || 0}
                  />
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Sales */}
        <Card>
          <CardHeader>
            <CardTitle>Últimas Vendas</CardTitle>
            <CardDescription>
              Você teve {data?.salesToday} vendas hoje
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isDashboardLoading
                  ? // Skeleton para loading
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={`skeleton-${index}`}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <div className="space-y-2">
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-3 w-24" />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-20" />
                        </TableCell>
                        <TableCell className="text-right">
                          <Skeleton className="h-4 w-24 ml-auto" />
                        </TableCell>
                      </TableRow>
                    ))
                  : // Dados reais
                    data?.latestSales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {sale.customer.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {sale.customer.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                há{" "}
                                {formatDistanceToNow(new Date(sale.createdAt), {
                                  locale: ptBR,
                                })}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`bg-success text-success-foreground ${getSaleStatusBadgeClass(
                              sale.status
                            )}`}
                          >
                            {getSaleStatusLabel(sale.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          R$ {formatCurrencyInput(sale.total.toString())}
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Low Stock Products */}
        <Card>
          <CardHeader>
            <CardTitle>Produtos com Estoque Baixo</CardTitle>
            <CardDescription>
              {data?.productsLowStock} produtos precisam de atenção
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 ">
              {isDashboardLoading
                ? // Skeleton para loading
                  Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={`skeleton-${index}`}
                      className="flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <Skeleton className="h-4 w-32 mb-2" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <Skeleton className="h-4 w-12 mb-1" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                        <Skeleton className="h-6 w-20" />
                      </div>
                    </div>
                  ))
                : // Dados reais
                  data?.productWithLowStock.slice(0, 4).map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{product.name}</div>
                        <div className="text-xs text-muted-foreground">
                          SKU: {product.sku || "N/A"}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {product.stock} un
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Min: {product.stockMin}
                          </div>
                        </div>
                        <Badge
                          className={
                            product.stock === 0
                              ? "bg-destructive text-white"
                              : "bg-orange-500 text-white"
                          }
                        >
                          {product.stock === 0 ? "Sem estoque" : "Baixo"}
                        </Badge>
                      </div>
                    </div>
                  ))}
            </div>
            {data && data?.productsLowStock > 4 && (
              <Button variant="outline" className="w-full mt-4 bg-transparent">
                Ver Todos os Alertas
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
