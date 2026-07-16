"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { useCreateStore, useStore, useUpdateStore } from "../hooks/use-stores";

const storeFormSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  code: z.string().optional(),
  managerName: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

type StoreFormValues = z.infer<typeof storeFormSchema>;

const emptyValues: StoreFormValues = {
  name: "",
  code: "",
  managerName: "",
  city: "",
  state: "",
  address: "",
  notes: "",
};

interface StoreFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId?: string;
}

export function StoreFormDialog({
  open,
  onOpenChange,
  storeId,
}: StoreFormDialogProps) {
  const isEditing = !!storeId;
  const { store, isLoading: isLoadingStore } = useStore(storeId ?? "");
  const createStore = useCreateStore();
  const updateStore = useUpdateStore();

  const form = useForm<StoreFormValues>({
    resolver: zodResolver(storeFormSchema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (!open) return;
    if (isEditing && store) {
      form.reset({
        name: store.name,
        code: store.code ?? "",
        managerName: store.managerName ?? "",
        city: store.city ?? "",
        state: store.state ?? "",
        address: store.address ?? "",
        notes: store.notes ?? "",
      });
    }
    if (!isEditing) {
      form.reset(emptyValues);
    }
  }, [open, isEditing, store, form]);

  const isSaving = createStore.isPending || updateStore.isPending;

  const onSubmit = (values: StoreFormValues) => {
    if (isEditing && storeId) {
      updateStore.mutate(
        { id: storeId, ...values },
        { onSuccess: () => onOpenChange(false) },
      );
      return;
    }
    createStore.mutate(values, {
      onSuccess: () => {
        onOpenChange(false);
        form.reset(emptyValues);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar loja" : "Nova loja"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize as informações da loja."
              : "Cadastre uma loja (ponto de venda) para mapear e registrar PDVs."}
          </DialogDescription>
        </DialogHeader>
        {isEditing && isLoadingStore ? (
          <div className="flex items-center justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="max-h-[60vh] overflow-y-auto pr-1">
              <FieldGroup>
                <Controller
                  name="name"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>
                        Cliente / Loja
                      </FieldLabel>
                      <Input
                        {...field}
                        id={field.name}
                        aria-invalid={fieldState.invalid}
                        placeholder="Ex.: Supermercado Central - Unidade Centro"
                        disabled={isSaving}
                      />
                      {fieldState.error && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <div className="flex items-start gap-4">
                  <Controller
                    name="code"
                    control={form.control}
                    render={({ field }) => (
                      <Field>
                        <FieldLabel htmlFor={field.name}>Código</FieldLabel>
                        <Input
                          {...field}
                          id={field.name}
                          placeholder="Ex.: LJ-001"
                          disabled={isSaving}
                        />
                      </Field>
                    )}
                  />
                  <Controller
                    name="managerName"
                    control={form.control}
                    render={({ field }) => (
                      <Field>
                        <FieldLabel htmlFor={field.name}>
                          Gerente da loja
                        </FieldLabel>
                        <Input
                          {...field}
                          id={field.name}
                          placeholder="Ex.: Maria Souza"
                          disabled={isSaving}
                        />
                      </Field>
                    )}
                  />
                </div>
                <div className="flex items-start gap-4">
                  <Controller
                    name="city"
                    control={form.control}
                    render={({ field }) => (
                      <Field>
                        <FieldLabel htmlFor={field.name}>Cidade</FieldLabel>
                        <Input
                          {...field}
                          id={field.name}
                          placeholder="Ex.: São Paulo"
                          disabled={isSaving}
                        />
                      </Field>
                    )}
                  />
                  <Controller
                    name="state"
                    control={form.control}
                    render={({ field }) => (
                      <Field>
                        <FieldLabel htmlFor={field.name}>Estado</FieldLabel>
                        <Input
                          {...field}
                          id={field.name}
                          placeholder="Ex.: SP"
                          disabled={isSaving}
                        />
                      </Field>
                    )}
                  />
                </div>
                <Controller
                  name="address"
                  control={form.control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>Endereço</FieldLabel>
                      <Input
                        {...field}
                        id={field.name}
                        placeholder="Ex.: Av. Paulista, 1000"
                        disabled={isSaving}
                      />
                    </Field>
                  )}
                />
                <Controller
                  name="notes"
                  control={form.control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>Observações</FieldLabel>
                      <Textarea
                        {...field}
                        id={field.name}
                        placeholder="Informações gerais sobre a loja"
                        disabled={isSaving}
                      />
                    </Field>
                  )}
                />
              </FieldGroup>
            </div>
            <DialogFooter className="mt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Spinner />}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
