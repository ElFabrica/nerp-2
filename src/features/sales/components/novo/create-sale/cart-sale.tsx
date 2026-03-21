"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DollarSignIcon,
  PercentIcon,
  ShoppingCartIcon,
  XIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Minus, Plus, Trash2, User } from "lucide-react";
import { currencyFormatter } from "@/utils/currency-formatter";
import { Label } from "@/components/ui/label";
import { CartItem, CustomerSales } from ".";
import { useState } from "react";
import { FieldError } from "@/components/ui/field";
import { FieldErrors } from "react-hook-form";
import { SaleFormData } from "./schema";

interface CartSaleProps {
  cartItems: CartItem[];
  clearCart: () => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  setItemQuantity: (id: string, quantity: number) => void;
  customer?: CustomerSales | null;
  setCustomerDialogOpen: (open: boolean) => void;
  discount: number;
  setDiscount: (discount: number) => void;
  subtotal: number;
  total: number;
  setPaymentDialogOpen: (open: boolean) => void;
  discountType: "percent" | "value";
  setDiscountType: (discountType: "percent" | "value") => void;
  error?: FieldErrors<SaleFormData>;
}

export function CartSale({
  cartItems,
  clearCart,
  removeItem,
  updateQuantity,
  setItemQuantity,
  customer,
  setCustomerDialogOpen,
  discount,
  setDiscount,
  subtotal,
  total,
  setPaymentDialogOpen,
  discountType,
  setDiscountType,
  error,
}: CartSaleProps) {
  const discountAmount =
    discountType === "percent" ? (subtotal * discount) / 100 : discount;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCartIcon className="h-5 w-5" />
              <span>Carrinho</span>
              {cartItems.length > 0 && (
                <Badge variant="secondary">
                  {cartItems.reduce((sum, i) => sum + i.quantity, 0)} itens
                </Badge>
              )}
            </div>
            {cartItems.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearCart}>
                <Trash2 className="h-4 w-4 mr-2" />
                Limpar
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <ShoppingCartIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">Carrinho vazio</p>
              <p className="text-xs text-muted-foreground mt-1">
                Busque produtos ou use o leitor de código de barras
              </p>
            </div>
          ) : (
            <>
              <ScrollArea className="h-[280px] pr-4">
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 rounded-lg border p-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {item.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.sku}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {currencyFormatter(item.price)} x {item.quantity}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-7 w-7 bg-transparent"
                            onClick={() => updateQuantity(item.id, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            max={Number(item.currentStock)}
                            value={item.quantity}
                            onChange={(e) => {
                              setItemQuantity(item.id, Number(e.target.value));
                            }}
                            className="h-7 w-12 text-center p-0"
                          />
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-7 w-7 bg-transparent"
                            onClick={() => updateQuantity(item.id, 1)}
                            disabled={
                              item.quantity >= Number(item.currentStock)
                            }
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive"
                            onClick={() => removeItem(item.id)}
                          >
                            <XIcon className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="font-semibold text-sm">
                          {currencyFormatter(item.price * item.quantity)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <Separator />

              {/* Customer */}
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
                onClick={() => setCustomerDialogOpen(true)}
              >
                <User className="h-4 w-4 mr-2" />
                {customer ? (
                  <span className="truncate">{customer.name}</span>
                ) : (
                  <span className="text-muted-foreground">
                    Adicionar cliente
                  </span>
                )}
              </Button>

              {/* Discount */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label className="text-xs">Desconto</Label>
                  <div className="flex mt-1">
                    <Input
                      type="number"
                      min="0"
                      max={discountType === "percent" ? 100 : subtotal}
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                      className="rounded-r-none"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-l-none border-l-0 bg-transparent"
                      onClick={() =>
                        setDiscountType(
                          discountType === "percent" ? "value" : "percent",
                        )
                      }
                    >
                      {discountType === "percent" ? (
                        <PercentIcon className="h-4 w-4" />
                      ) : (
                        <span className="text-xs font-medium">R$</span>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Summary */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">
                    {currencyFormatter(subtotal)}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-success">
                    <span>
                      Desconto{" "}
                      {discountType === "percent" ? `(${discount}%)` : ""}
                    </span>
                    <span>- {currencyFormatter(discountAmount)}</span>
                  </div>
                )}
                {error?.discount && (
                  <FieldError>{error.discount.message}</FieldError>
                )}

                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span className="text-primary">
                    {currencyFormatter(total)}
                  </span>
                </div>
              </div>
              <Button
                size="lg"
                className="w-full"
                onClick={() => setPaymentDialogOpen(true)}
                disabled={cartItems.length === 0}
              >
                <DollarSignIcon className="h-5 w-5 mr-2" />
                Finalizar Venda
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
