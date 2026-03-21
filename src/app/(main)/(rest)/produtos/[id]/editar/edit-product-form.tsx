"use client";

import { Uploader } from "@/components/file-uploader/uploader";
import { PageHeader } from "@/components/page-header";
import { RichTextEditor } from "@/components/rich-text/editor";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useCategory } from "@/context/category/hooks/use-categories";
import { ProductUnit } from "@/generated/prisma/enums";
import { orpc } from "@/lib/orpc";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { ArrowLeft, Save, Upload, X } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const unitLabels: Record<ProductUnit, string> = {
  UN: "Unidade",
  KG: "Quilograma",
  G: "Grama",
  L: "Litro",
  ML: "Mililitro",
  M: "Metro",
  M2: "Metro Quadrado",
  M3: "Metro Cúbico",
  CX: "Caixa",
  PC: "Peça",
  PAR: "Par",
  DZ: "Dúzia",
};

const productSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  categoryId: z.string().optional(),
  description: z.string().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  unit: z.enum(ProductUnit).optional(),
  costPrice: z.coerce.number().min(0, "Preço de custo deve ser positivo"),
  salePrice: z.coerce.number().min(0, "Preço de venda deve ser positivo"),
  minStock: z.coerce.number().min(0, "Estoque mínimo deve ser positivo"),
  isActive: z.boolean(),
  trackStock: z.boolean(),
  showOnCatalog: z.boolean(),
  thumbnail: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

export function EditProductForm() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { id: productId } = useParams<{ id: string }>();
  const {
    data: { product },
  } = useSuspenseQuery(
    orpc.products.get.queryOptions({
      input: {
        id: productId,
      },
    })
  );

  const updateProductMutation = useMutation(
    orpc.products.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.products.get.queryKey({
            input: {
              id: productId,
            },
          }),
        });

        toast.success("Produto atualizado com sucesso!");
        router.push(`/produtos`);
      },
      onError: () => {
        return toast.error("Erro ao atualizar o produto.");
      },
    })
  );

  const { categories, isLoadingCategories } = useCategory();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as Resolver<ProductFormValues>,
    defaultValues: {
      name: product.name,
      categoryId: product.categoryId || "",
      description: product.description || "",
      sku: product.sku || "",
      barcode: product.barcode || "",
      unit: product.unit || "UN",
      costPrice: product.costPrice,
      salePrice: product.salePrice,
      minStock: product.minStock,
      thumbnail: product.thumbnail,
      isActive: product.isActive,
      trackStock: product.trackStock,
      showOnCatalog: product.isFeatured, // Mapping isFeatured to showOnCatalog
    },
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = form;

  const costPrice = watch("costPrice");
  const salePrice = watch("salePrice");

  const margin = useMemo(() => {
    if (!costPrice || costPrice <= 0) return 0;
    return ((salePrice - costPrice) / costPrice) * 100;
  }, [costPrice, salePrice]);

  const onSubmit = async (data: ProductFormValues) => {
    updateProductMutation.mutate({
      id: productId,
      ...data,
      isFeatured: data.showOnCatalog,
    });
  };

  const isUpdating = updateProductMutation.isPending;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Editar Produto"
        description={`Editando: ${product.name}`}
      >
        <Button size={"sm"} variant="outline" asChild>
          <Link href={`/produtos/${product.id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Link>
        </Button>
      </PageHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Controller
                    name="name"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="name">
                          Nome do Produto{" "}
                          <span className="text-destructive">*</span>
                        </FieldLabel>

                        <Input
                          id="name"
                          aria-invalid={fieldState.invalid}
                          placeholder="Ex: Notebook Dell Inspiron 15"
                          disabled={isUpdating}
                          {...field}
                        />

                        {fieldState.invalid && (
                          <FieldError>{fieldState.error?.message}</FieldError>
                        )}
                      </Field>
                    )}
                  />
                  <div className="space-y-2">
                    <Controller
                      name="categoryId"
                      control={control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>Categoria</FieldLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                            disabled={isUpdating}
                          >
                            <SelectTrigger id="category" className="w-full">
                              <SelectValue placeholder="Selecione uma categoria" />
                            </SelectTrigger>
                            <SelectContent>
                              {isLoadingCategories ? (
                                <SelectItem value="loading" disabled>
                                  Carregando...
                                </SelectItem>
                              ) : (
                                categories.map((category) => (
                                  <SelectItem
                                    key={category.id}
                                    value={category.id}
                                  >
                                    {category.name}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>

                          {fieldState.invalid && (
                            <FieldError>{fieldState.error?.message}</FieldError>
                          )}
                        </Field>
                      )}
                    />
                  </div>
                </div>

                <Controller
                  name="description"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="description">Descrição</FieldLabel>

                      <RichTextEditor
                        field={field.value}
                        onChange={field.onChange}
                        disabled={isUpdating}
                      />

                      {fieldState.invalid && (
                        <FieldError>{fieldState.error?.message}</FieldError>
                      )}
                    </Field>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-3">
                  <Controller
                    name="sku"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="sku">SKU</FieldLabel>

                        <Input
                          id="sku"
                          aria-invalid={fieldState.invalid}
                          placeholder="NB-001"
                          disabled={isUpdating}
                          {...field}
                        />

                        {fieldState.invalid && (
                          <FieldError>{fieldState.error?.message}</FieldError>
                        )}
                      </Field>
                    )}
                  />
                  <Controller
                    name="barcode"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="barcode">
                          Código de Barras
                        </FieldLabel>

                        <Input
                          id="barcode"
                          aria-invalid={fieldState.invalid}
                          placeholder="7891234567890"
                          disabled={isUpdating}
                          {...field}
                        />

                        {fieldState.invalid && (
                          <FieldError>{fieldState.error?.message}</FieldError>
                        )}
                      </Field>
                    )}
                  />
                  <Controller
                    name="unit"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="unit">Unidade</FieldLabel>

                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={isUpdating}
                        >
                          <SelectTrigger id="unit">
                            <SelectValue placeholder="Selecione uma unidade" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(unitLabels).map(([key, value]) => (
                              <SelectItem key={key} value={key}>
                                {value}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {fieldState.invalid && (
                          <FieldError>{fieldState.error?.message}</FieldError>
                        )}
                      </Field>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Preços e Estoque</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="costPrice">
                      Preço de Custo <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="costPrice"
                      type="number"
                      step="0.01"
                      {...register("costPrice")}
                      aria-invalid={!!errors.costPrice}
                    />
                    {errors.costPrice && (
                      <p className="text-sm text-destructive">
                        {errors.costPrice.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salePrice">
                      Preço de Venda <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="salePrice"
                      type="number"
                      step="0.01"
                      {...register("salePrice")}
                      aria-invalid={!!errors.salePrice}
                    />
                    {errors.salePrice && (
                      <p className="text-sm text-destructive">
                        {errors.salePrice.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="margin">Margem de Lucro</Label>
                    <Input
                      id="margin"
                      type="number"
                      value={margin.toFixed(2)}
                      disabled
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="currentStock">Estoque Atual</Label>
                    <Input
                      id="currentStock"
                      type="number"
                      defaultValue={product.currentStock}
                      disabled
                    />
                    <p className="text-xs text-muted-foreground">
                      Use movimentações para alterar o estoque
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minStock">
                      Estoque Mínimo <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="minStock"
                      type="number"
                      {...register("minStock")}
                      aria-invalid={!!errors.minStock}
                    />
                    {errors.minStock && (
                      <p className="text-sm text-destructive">
                        {errors.minStock.message}
                      </p>
                    )}
                  </div>
                  {/* <div className="space-y-2">
                    <Label htmlFor="location">Localização</Label>
                    <Input id="location" {...register("location")} />
                  </div> */}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Imagem do Produto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Controller
                  name="thumbnail"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field className="text-center">
                      <Uploader value={field.value} onChange={field.onChange} />
                      <FieldDescription>
                        Formatos aceitos: JPG, PNG, GIF
                        <br />
                        Tamanho máximo: 5MB
                      </FieldDescription>
                    </Field>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configurações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="isActive">Produto Ativo</Label>
                    <p className="text-xs text-muted-foreground">
                      Disponível para venda
                    </p>
                  </div>
                  <Controller
                    name="isActive"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        id="isActive"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="trackStock">Controlar Estoque</Label>
                    <p className="text-xs text-muted-foreground">
                      Rastrear quantidade
                    </p>
                  </div>
                  <Controller
                    name="trackStock"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        id="trackStock"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="showOnCatalog">
                      Exibir no Catálogo Online
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Visível para clientes
                    </p>
                  </div>
                  <Controller
                    name="showOnCatalog"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        id="showOnCatalog"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-2">
              <Button type="submit" className="w-full" disabled={isUpdating}>
                <Save className="h-4 w-4 mr-2" />
                {isUpdating ? "Salvando..." : "Salvar Alterações"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full bg-transparent"
                asChild
              >
                <Link href={`/produtos/${product.id}`}>Cancelar</Link>
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
