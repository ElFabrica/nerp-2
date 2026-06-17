"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import {
  Collaborator,
  useMutationCreateCollaborator,
  useMutationUpdateCollaborator,
} from "../hooks/use-collaborators";

const schema = z.object({
  name: z.string().min(2, "Informe o nome"),
  role: z.string().min(1, "Informe a função"),
  photoUrl: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collaborator?: Collaborator | null;
}

export function CollaboratorForm({ open, onOpenChange, collaborator }: Props) {
  const create = useMutationCreateCollaborator();
  const update = useMutationUpdateCollaborator();
  const isEdit = Boolean(collaborator);
  const isPending = create.isPending || update.isPending;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", role: "", photoUrl: "" },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: collaborator?.name ?? "",
        role: collaborator?.role ?? "",
        photoUrl: collaborator?.photoUrl ?? "",
      });
    }
  }, [open, collaborator, form]);

  const onSubmit = (data: FormValues) => {
    const payload = {
      name: data.name,
      role: data.role,
      photoUrl: data.photoUrl?.trim() || undefined,
    };

    if (isEdit && collaborator) {
      update.mutate(
        {
          id: collaborator.id,
          ...payload,
          photoUrl: payload.photoUrl ?? null,
        },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      create.mutate(payload, { onSuccess: () => onOpenChange(false) });
    }
  };

  const photoUrl = form.watch("photoUrl");
  const name = form.watch("name");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar colaborador" : "Novo colaborador"}
          </DialogTitle>
          <DialogDescription>
            Cadastre seus colaboradores para registrar quem atende cada pedido.
          </DialogDescription>
        </DialogHeader>

        <form
          id="collaborator-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <div className="flex items-center gap-4">
            <Avatar className="size-16">
              {photoUrl && <AvatarImage src={photoUrl} alt={name} />}
              <AvatarFallback className="text-lg">
                {name?.[0]?.toUpperCase() ?? "?"}
              </AvatarFallback>
            </Avatar>
            <Controller
              name="photoUrl"
              control={form.control}
              render={({ field }) => (
                <Field className="flex-1">
                  <FieldLabel htmlFor={field.name}>Foto (URL)</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    placeholder="https://..."
                    disabled={isPending}
                  />
                </Field>
              )}
            />
          </div>

          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Nome</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  placeholder="Ex.: João Silva"
                  aria-invalid={fieldState.invalid}
                  disabled={isPending}
                />
                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="role"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Função</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  placeholder="Ex.: Garçom, Caixa"
                  aria-invalid={fieldState.invalid}
                  disabled={isPending}
                />
                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </form>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isPending}>
              Cancelar
            </Button>
          </DialogClose>
          <Button type="submit" form="collaborator-form" disabled={isPending}>
            {isPending && <Spinner />}
            {isEdit ? "Salvar" : "Cadastrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
