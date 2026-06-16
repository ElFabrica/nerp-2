"use client";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { orpc } from "@/lib/orpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { useMutationCreateKitchenOrder } from "../hooks/use-kitchen";

const NO_PRODUCT = "__none__";

const registerOrderSchema = z.object({
  tableNumber: z.string().min(1, "Informe a mesa"),
  dishName: z.string().min(1, "Informe o prato"),
  productId: z.string().optional(),
  estimatedMinutes: z.string().optional(),
});

type RegisterOrderForm = z.infer<typeof registerOrderSchema>;

export function RegisterOrderForm() {
  const [open, setOpen] = useState(false);
  const createOrder = useMutationCreateKitchenOrder();

  // Reusa a query de produtos existente p/ o select opcional.
  const { data: productsData } = useQuery(
    orpc.products.list.queryOptions({ input: { page: 1, pageSize: 100 } }),
  );
  const products = productsData?.products ?? [];

  const form = useForm<RegisterOrderForm>({
    resolver: zodResolver(registerOrderSchema),
    defaultValues: {
      tableNumber: "",
      dishName: "",
      productId: "",
      estimatedMinutes: "",
    },
  });

  const onSubmit = (data: RegisterOrderForm) => {
    const minutes = data.estimatedMinutes
      ? Number(data.estimatedMinutes)
      : undefined;

    createOrder.mutate(
      {
        tableNumber: data.tableNumber,
        dishName: data.dishName,
        productId: data.productId || undefined,
        // se vazio e houver produto, o servidor preenche pelo prepTimeMinutes
        estimatedMinutes:
          minutes && Number.isFinite(minutes) ? minutes : undefined,
        // sem columnId ⇒ cai na coluna isInitial
      },
      {
        onSuccess: () => {
          form.reset();
          setOpen(false);
        },
      },
    );
  };

  const isLoading = createOrder.isPending;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Novo pedido
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Registrar pedido</SheetTitle>
          <SheetDescription>
            Adicione um pedido à cozinha. Ele entra na coluna inicial do kanban.
          </SheetDescription>
        </SheetHeader>

        <form
          id="register-order-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-1 flex-col gap-4 overflow-y-auto px-4"
        >
          <Controller
            name="tableNumber"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Mesa</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  placeholder="18"
                  aria-invalid={fieldState.invalid}
                  disabled={isLoading}
                />
                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="dishName"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Prato</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  placeholder="Ex.: Batata Recheada"
                  aria-invalid={fieldState.invalid}
                  disabled={isLoading}
                />
                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="productId"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Produto (opcional)</FieldLabel>
                <Select
                  value={field.value || NO_PRODUCT}
                  onValueChange={(value) => {
                    const productId = value === NO_PRODUCT ? "" : value;
                    field.onChange(productId);
                    // sugere o prato com o nome do produto, se ainda vazio
                    const product = products.find((p) => p.id === productId);
                    if (product && !form.getValues("dishName")) {
                      form.setValue("dishName", product.name);
                    }
                  }}
                  disabled={isLoading}
                >
                  <SelectTrigger id={field.name} className="w-full">
                    <SelectValue placeholder="Sem produto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_PRODUCT}>Sem produto</SelectItem>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          />

          <Controller
            name="estimatedMinutes"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Min. estimados</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  type="number"
                  min={1}
                  placeholder="auto"
                  disabled={isLoading}
                />
              </Field>
            )}
          />
        </form>

        <SheetFooter>
          <Button
            type="submit"
            form="register-order-form"
            disabled={isLoading}
          >
            {isLoading ? <Spinner /> : <Plus className="size-4" />}
            Registrar pedido
          </Button>
          <SheetClose asChild>
            <Button variant="outline" disabled={isLoading}>
              Cancelar
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
