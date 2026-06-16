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
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { useMutationCreateKitchenOrders } from "../hooks/use-pedidos";

const NO_PRODUCT = "__none__";

const registerOrderSchema = z.object({
  tableNumber: z.string().min(1, "Informe a mesa"),
  items: z
    .array(
      z.object({
        dishName: z.string().min(1, "Informe o prato"),
        productId: z.string().optional(),
        quantity: z.string().optional(),
        estimatedMinutes: z.string().optional(),
      }),
    )
    .min(1, "Adicione ao menos um prato"),
});

type RegisterOrderForm = z.infer<typeof registerOrderSchema>;

const emptyItem = {
  dishName: "",
  productId: "",
  quantity: "1",
  estimatedMinutes: "",
};

export function RegisterOrderForm() {
  const [open, setOpen] = useState(false);
  const createOrders = useMutationCreateKitchenOrders();

  // Reusa a query de produtos existente p/ o select opcional.
  const { data: productsData } = useQuery(
    orpc.products.list.queryOptions({ input: { page: 1, pageSize: 100 } }),
  );
  const products = productsData?.products ?? [];

  const form = useForm<RegisterOrderForm>({
    resolver: zodResolver(registerOrderSchema),
    defaultValues: {
      tableNumber: "",
      items: [{ ...emptyItem }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const onSubmit = (data: RegisterOrderForm) => {
    const items = data.items.map((item) => {
      const quantity = item.quantity ? Number(item.quantity) : 1;
      const minutes = item.estimatedMinutes
        ? Number(item.estimatedMinutes)
        : undefined;

      return {
        dishName: item.dishName,
        productId: item.productId || undefined,
        quantity: quantity && Number.isFinite(quantity) ? quantity : 1,
        // se vazio e houver produto, o servidor preenche pelo prepTimeMinutes
        estimatedMinutes:
          minutes && Number.isFinite(minutes) ? minutes : undefined,
      };
    });

    createOrders.mutate(
      {
        tableNumber: data.tableNumber,
        items,
        // sem columnId ⇒ cai na coluna isInitial
      },
      {
        onSuccess: () => {
          form.reset({ tableNumber: "", items: [{ ...emptyItem }] });
          setOpen(false);
        },
      },
    );
  };

  const isLoading = createOrders.isPending;

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
          <SheetTitle>Registrar pedidos</SheetTitle>
          <SheetDescription>
            Adicione um ou mais pratos para a mesma mesa. Cada prato vira um card
            na coluna inicial do kanban.
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

          <div className="flex flex-col gap-4">
            {fields.map((item, index) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-lg border p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Prato {index + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground"
                    onClick={() => remove(index)}
                    disabled={isLoading || fields.length === 1}
                    aria-label="Remover prato"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>

                <Controller
                  name={`items.${index}.dishName`}
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
                      {fieldState.error && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                <Controller
                  name={`items.${index}.productId`}
                  control={form.control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>
                        Produto (opcional)
                      </FieldLabel>
                      <Select
                        value={field.value || NO_PRODUCT}
                        onValueChange={(value) => {
                          const productId = value === NO_PRODUCT ? "" : value;
                          field.onChange(productId);
                          // sugere o prato com o nome do produto, se ainda vazio
                          const product = products.find(
                            (p) => p.id === productId,
                          );
                          if (
                            product &&
                            !form.getValues(`items.${index}.dishName`)
                          ) {
                            form.setValue(
                              `items.${index}.dishName`,
                              product.name,
                            );
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

                <div className="flex gap-3">
                  <Controller
                    name={`items.${index}.quantity`}
                    control={form.control}
                    render={({ field }) => (
                      <Field className="flex-1">
                        <FieldLabel htmlFor={field.name}>Qtd</FieldLabel>
                        <Input
                          {...field}
                          id={field.name}
                          type="number"
                          min={1}
                          placeholder="1"
                          disabled={isLoading}
                        />
                      </Field>
                    )}
                  />

                  <Controller
                    name={`items.${index}.estimatedMinutes`}
                    control={form.control}
                    render={({ field }) => (
                      <Field className="flex-1">
                        <FieldLabel htmlFor={field.name}>
                          Min. estimados
                        </FieldLabel>
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
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={() => append({ ...emptyItem })}
              disabled={isLoading}
            >
              <Plus className="size-4" />
              Adicionar prato
            </Button>
          </div>
        </form>

        <SheetFooter>
          <Button
            type="submit"
            form="register-order-form"
            disabled={isLoading}
          >
            {isLoading ? <Spinner /> : <Plus className="size-4" />}
            Registrar pedidos
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
