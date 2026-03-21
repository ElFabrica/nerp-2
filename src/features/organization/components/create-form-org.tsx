"use client";

import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";

const createOrgSchema = z.object({
  name: z.string().min(1, ""),
  slug: z.string().min(1, "Slug é obrigatório"),
  logo: z.string().optional(),
});

type CreateOrgSchema = z.infer<typeof createOrgSchema>;

export function CreateFormOrg({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const form = useForm<CreateOrgSchema>({
    resolver: zodResolver(createOrgSchema),
    defaultValues: {
      name: "",
      slug: "",
      logo: "",
    },
  });

  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const isFirstRender = useRef(true);
  const router = useRouter();

  const name = form.watch("name");
  const logo = form.watch("logo");

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const slug = createSlug(e.target.value);
    form.setValue("slug", slug, { shouldValidate: true });
    setIsSlugManuallyEdited(true);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      form.setValue("logo", reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  function createSlug(text: string): string {
    if (!text) return "";

    return text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  const mutationCreateSettingsCatalog = useMutation(
    orpc.catalogSettings.create.mutationOptions()
  );

  const onSubmit = async (formData: CreateOrgSchema) => {
    const { data } = await authClient.organization.checkSlug({
      slug: formData.slug,
    });

    if (!data?.status) {
      toast.error("Esse slug já está em uso");
      return;
    }

    const metadata = { name: formData.name, createdAt: new Date() };

    const { data: organization, error } = await authClient.organization.create({
      name: formData.name,
      slug: formData.slug,
      logo: formData.logo,
      metadata,
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    await authClient.organization.setActive({
      organizationId: organization.id,
      organizationSlug: organization.slug,
    });

    mutationCreateSettingsCatalog.mutate({
      name: name,
    });

    toast.success("Organização criada com sucesso");
    router.push("/dashboard");
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (!isSlugManuallyEdited && name) {
      const slug = createSlug(name);
      form.setValue("slug", slug, { shouldValidate: true });
    }
  }, [name, isSlugManuallyEdited, form.setValue]);

  const isLoading = form.formState.isSubmitting;

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Crie sua organização</CardTitle>
          <CardDescription>
            Insira os dados abaixo para criar sua organização
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Nome da Organização</FieldLabel>
                <Input
                  id="name"
                  disabled={isLoading}
                  {...form.register("name")}
                  placeholder="Empresa de Vendas"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="slug">Slug</FieldLabel>
                <Input
                  id="slug"
                  disabled={isLoading}
                  {...form.register("slug")}
                  onChange={handleSlugChange}
                  placeholder="empresa-de-vendas"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="logo">Logo</FieldLabel>
                <Input
                  id="logo"
                  type="file"
                  disabled={isLoading}
                  accept="image/*"
                  onChange={handleLogoChange}
                />
                {logo && (
                  <div className="mt-2 relative group w-24 h-24 max-w-24">
                    <Image
                      src={logo}
                      alt="Logo da organização"
                      fill
                      className="rounded-md object-cover"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100"
                      onClick={() => form.setValue("logo", "")}
                    >
                      <XCircle />
                    </Button>
                  </div>
                )}
              </Field>
              <Field>
                <Button type="submit" disabled={isLoading}>
                  Criar
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
