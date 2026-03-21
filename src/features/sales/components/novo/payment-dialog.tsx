"use client";

import type React from "react";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Banknote,
  CreditCard,
  QrCode,
  Loader2,
  Receipt,
  FileText,
  Printer,
  ArrowLeftRight,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PaymentMethod } from "@/generated/prisma/enums";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  customerName: string | null;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (paymentMethod: PaymentMethod) => void;
  onConfirm: (data: {
    paymentMethod: PaymentMethod;
    amountPaid: number;
    change: number;
    generateInvoice: boolean;
    printReceipt: boolean;
  }) => void;
}

export function PaymentDialog({
  open,
  onOpenChange,
  total,
  customerName,
  onConfirm,
  paymentMethod,
  setPaymentMethod,
}: PaymentDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [amountPaid, setAmountPaid] = useState("");
  const [generateInvoice, setGenerateInvoice] = useState(false);
  const [printReceipt, setPrintReceipt] = useState(true);

  const paid = Number.parseFloat(amountPaid) || 0;
  const change = paymentMethod === "DINHEIRO" ? Math.max(0, paid - total) : 0;
  const canFinish = paymentMethod === "DINHEIRO" ? paid >= total : true;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    onConfirm({
      paymentMethod,
      amountPaid: paymentMethod === "DINHEIRO" ? paid : total,
      change,
      generateInvoice,
      printReceipt,
    });

    setIsLoading(false);
    setAmountPaid("");
    setGenerateInvoice(false);
    setPrintReceipt(true);
    onOpenChange(false);
  };

  const quickAmounts = [50, 100, 200, 500];

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const paymentMethods = [
    { id: "DINHEIRO" as const, label: "Dinheiro", icon: Banknote },
    { id: "CREDITO" as const, label: "Crédito", icon: CreditCard },
    { id: "DEBITO" as const, label: "Débito", icon: CreditCard },
    { id: "PIX" as const, label: "PIX", icon: QrCode },
    { id: "BOLETO" as const, label: "Boleto", icon: FileText },
    {
      id: "TRANSFERENCIA" as const,
      label: "Transferência Bancária",
      icon: ArrowLeftRight,
    },
    {
      id: "OUTROS" as const,
      label: "Outros",
      icon: ArrowLeftRight,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Finalizar Venda</DialogTitle>
          <DialogDescription>
            {customerName
              ? `Cliente: ${customerName}`
              : "Venda sem cliente identificado"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <ScrollArea className="h-[550px] px-2">
            <div className="space-y-4 py-4">
              {/* Total */}
              <div className="rounded-lg border bg-primary/5 p-4 text-center">
                <p className="text-sm text-muted-foreground">Total a Pagar</p>
                <p className="text-3xl font-bold text-primary">
                  {formatCurrency(total)}
                </p>
              </div>

              {/* Payment Method */}
              <div className="space-y-3">
                <Label>Forma de Pagamento</Label>
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={(value) => {
                    setPaymentMethod(value as PaymentMethod);
                  }}
                  className="grid grid-cols-2 gap-2"
                >
                  {paymentMethods.map((method) => (
                    <div key={method.id}>
                      <RadioGroupItem
                        value={method.id}
                        id={method.id}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={method.id}
                        className={cn(
                          "flex items-center justify-center gap-2 rounded-lg border-2 border-muted bg-popover p-3 cursor-pointer transition-all hover:bg-accent",
                          paymentMethod === method.id &&
                            "border-primary bg-primary/5",
                        )}
                      >
                        <method.icon
                          className={cn(
                            "h-4 w-4",
                            paymentMethod === method.id && "text-primary",
                          )}
                        />
                        <span className="text-sm font-medium">
                          {method.label}
                        </span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Amount Paid (only for cash) */}
              {paymentMethod === "DINHEIRO" && (
                <div className="space-y-3">
                  <Label htmlFor="amountPaid">Valor Recebido</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      R$
                    </span>
                    <Input
                      id="amountPaid"
                      type="number"
                      step="0.01"
                      min={total}
                      placeholder="0,00"
                      className="pl-10 text-lg"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {quickAmounts.map((amount) => (
                      <Button
                        key={amount}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setAmountPaid(String(amount))}
                      >
                        {formatCurrency(amount)}
                      </Button>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setAmountPaid(String(total))}
                    >
                      Valor exato
                    </Button>
                  </div>

                  {paid >= total && (
                    <div className="rounded-lg border bg-success/10 p-3 text-center">
                      <p className="text-sm text-muted-foreground">Troco</p>
                      <p className="text-xl font-bold text-success">
                        {formatCurrency(change)}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <Separator />

              {/* Options */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="generateInvoice"
                    checked={generateInvoice}
                    onCheckedChange={(checked) =>
                      setGenerateInvoice(checked as boolean)
                    }
                  />
                  <Label
                    htmlFor="generateInvoice"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <FileText className="h-4 w-4" />
                    Gerar Nota Fiscal (NF-e)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="printReceipt"
                    checked={printReceipt}
                    onCheckedChange={(checked) =>
                      setPrintReceipt(checked as boolean)
                    }
                  />
                  <Label
                    htmlFor="printReceipt"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Printer className="h-4 w-4" />
                    Imprimir Cupom
                  </Label>
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !canFinish}
              className="gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Receipt className="h-4 w-4" />
              )}
              Confirmar Pagamento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
