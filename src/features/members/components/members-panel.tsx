"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { roleLabel } from "@/lib/permissions";
import {
  MoreVertical,
  ShieldCheck,
  Trash2,
  UserCog,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useMembers, useUpdateMemberRole } from "../hooks/use-members";
import { RemoveMemberDialog } from "./remove-member-dialog";

interface MembersPanelProps {
  canManage: boolean;
  currentMemberId: string | null;
}

export function MembersPanel({
  canManage,
  currentMemberId,
}: MembersPanelProps) {
  const { members, isLoading } = useMembers();
  const updateRole = useUpdateMemberRole();
  const [removing, setRemoving] = useState<{ id: string; name: string } | null>(
    null,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="size-5" />
          Membros
        </CardTitle>
        <CardDescription>
          Quem tem acesso à organização e com qual cargo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {members.map((member) => {
              const isOwner = member.role === "owner";
              const isSelf = member.id === currentMemberId;
              // Dono e a própria conta são protegidos no backend também.
              const canActOnMember = canManage && !isOwner && !isSelf;

              return (
                <div
                  key={member.id}
                  className="flex items-center gap-3 rounded-lg border bg-card p-3"
                >
                  <Avatar className="size-10">
                    {member.image && (
                      <AvatarImage src={member.image} alt={member.name} />
                    )}
                    <AvatarFallback>
                      {member.name[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium leading-tight">
                      {member.name}
                      {isSelf && (
                        <span className="ml-1 text-xs font-normal text-muted-foreground">
                          (você)
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {member.email}
                    </p>
                  </div>

                  <Badge variant={isOwner ? "default" : "outline"}>
                    {isOwner && <ShieldCheck />}
                    {roleLabel(member.role)}
                  </Badge>

                  {canActOnMember && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={updateRole.isPending}
                          aria-label={`Ações de ${member.name}`}
                        >
                          <MoreVertical />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            updateRole.mutate({
                              memberId: member.id,
                              role:
                                member.role === "admin" ? "member" : "admin",
                            })
                          }
                        >
                          <UserCog />
                          {member.role === "admin"
                            ? "Rebaixar para Membro"
                            : "Tornar Administrador"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() =>
                            setRemoving({ id: member.id, name: member.name })
                          }
                        >
                          <Trash2 />
                          Remover da organização
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {removing && (
        <RemoveMemberDialog
          memberId={removing.id}
          memberName={removing.name}
          open={!!removing}
          onOpenChange={(open) => !open && setRemoving(null)}
        />
      )}
    </Card>
  );
}
