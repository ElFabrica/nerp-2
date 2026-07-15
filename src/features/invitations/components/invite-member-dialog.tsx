"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  INVITABLE_ROLES,
  INVITABLE_ROLE_VALUES,
  PAGE_PERMISSIONS,
} from "@/lib/permissions";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { useCreateInvitation } from "../hooks/use-invitations";

const inviteSchema = z.object({
  email: z.email("Informe um e-mail válido"),
  role: z.enum(INVITABLE_ROLE_VALUES),
  permissions: z.array(z.string()),
});

type InviteForm = z.infer<typeof inviteSchema>;

export function InviteMemberDialog({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const createInvitation = useCreateInvitation();

  const form = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "", role: "member", permissions: [] },
  });

  const role = form.watch("role");

  useEffect(() => {
    if (!open) form.reset();
  }, [open, form]);

  const onSubmit = (data: InviteForm) => {
    createInvitation.mutate(data, { onSuccess: () => setOpen(false) });
  };

  const isLoading = createInvitation.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convidar membro</DialogTitle>
          <DialogDescription>
            Enviaremos um e-mail com o link de convite. Ele expira em 48 horas.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="max-h-[60vh] overflow-y-auto pr-1">
            <FieldGroup>
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>E-mail</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      type="email"
                      autoComplete="off"
                      placeholder="Ex.: maria@empresa.com"
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
                name="role"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Cargo</FieldLabel>
                    <Select
                      name={field.name}
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger
                        id={field.name}
                        aria-invalid={fieldState.invalid}
                        disabled={isLoading}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {INVITABLE_ROLES.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {
                        INVITABLE_ROLES.find((r) => r.value === field.value)
                          ?.description
                      }
                    </p>
                  </Field>
                )}
              />

              {role === "member" && (
                <Controller
                  name="permissions"
                  control={form.control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>Páginas liberadas</FieldLabel>
                      <div className="grid grid-cols-2 gap-2">
                        {PAGE_PERMISSIONS.map((page) => {
                          const id = `invite-${page.key}`;
                          const checked = field.value.includes(page.key);
                          return (
                            <label
                              key={page.key}
                              htmlFor={id}
                              className="flex cursor-pointer items-center gap-2 rounded-md border px-2 py-1.5 text-sm hover:bg-accent"
                            >
                              <Checkbox
                                id={id}
                                checked={checked}
                                disabled={isLoading}
                                onCheckedChange={() =>
                                  field.onChange(
                                    checked
                                      ? field.value.filter(
                                          (k) => k !== page.key,
                                        )
                                      : [...field.value, page.key],
                                  )
                                }
                              />
                              <span className="truncate">{page.label}</span>
                            </label>
                          );
                        })}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        As permissões são aplicadas assim que o convite for
                        aceito.
                      </p>
                    </Field>
                  )}
                />
              )}
            </FieldGroup>
          </div>

          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button variant="outline" type="button">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Spinner />}
              Enviar convite
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
