"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { orpc } from "@/lib/orpc";
import { PAGE_PERMISSIONS } from "@/lib/permissions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, Users } from "lucide-react";
import { toast } from "sonner";

export function PermissionsPanel() {
  const queryClient = useQueryClient();
  const { data: members, isLoading } = useQuery(
    orpc.members.list.queryOptions({ input: {} }),
  );

  const updatePerms = useMutation(
    orpc.members.updatePermissions.mutationOptions({
      onSuccess: () => {
        toast.success("Permissões atualizadas!");
        queryClient.invalidateQueries({
          queryKey: orpc.members.list.key(),
        });
        queryClient.invalidateQueries({
          queryKey: orpc.members.getCurrent.key(),
        });
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const toggle = (
    memberId: string,
    currentPermissions: string[],
    key: string,
  ) => {
    const has = currentPermissions.includes(key);
    const next = has
      ? currentPermissions.filter((p) => p !== key)
      : [...currentPermissions, key];
    updatePerms.mutate({ memberId, permissions: next });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="size-5" />
          Permissões de páginas
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : !members || members.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Users className="size-6" />
              </EmptyMedia>
              <EmptyTitle>Nenhum membro</EmptyTitle>
              <EmptyDescription>
                Convide colaboradores para a organização para liberar páginas.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="space-y-4">
            {members.map((member) => {
              const isAdminLike =
                member.role === "owner" || member.role === "admin";
              return (
                <div
                  key={member.id}
                  className="flex flex-col gap-3 rounded-lg border bg-card p-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="size-10">
                      {member.image && (
                        <AvatarImage src={member.image} alt={member.name} />
                      )}
                      <AvatarFallback>
                        {member.name[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium leading-tight">
                        {member.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {member.email}
                      </p>
                    </div>
                    <Badge
                      variant={isAdminLike ? "default" : "outline"}
                      className="capitalize"
                    >
                      {member.role}
                    </Badge>
                  </div>

                  {isAdminLike ? (
                    <p className="text-xs text-muted-foreground">
                      {member.role === "owner" ? "Owner" : "Admin"} sempre vê
                      todas as páginas.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {PAGE_PERMISSIONS.map((page) => {
                        const checked = member.permissions.includes(page.key);
                        const id = `${member.id}-${page.key}`;
                        return (
                          <label
                            key={id}
                            htmlFor={id}
                            className="flex cursor-pointer items-center gap-2 rounded-md border px-2 py-1.5 text-sm hover:bg-accent"
                          >
                            <Checkbox
                              id={id}
                              checked={checked}
                              disabled={updatePerms.isPending}
                              onCheckedChange={() =>
                                toggle(member.id, member.permissions, page.key)
                              }
                            />
                            <span className="truncate">{page.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
