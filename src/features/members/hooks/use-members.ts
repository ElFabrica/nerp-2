"use client";

import { orpc } from "@/lib/orpc";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useMembers() {
  const { data, isPending } = useQuery(
    orpc.members.list.queryOptions({ input: {} }),
  );
  return { members: data ?? [], isLoading: isPending };
}

export function useCurrentMember() {
  const { data, isPending } = useQuery(
    orpc.members.getCurrent.queryOptions({ input: {} }),
  );
  return { member: data ?? null, isLoading: isPending };
}

function useInvalidateMembers() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: orpc.members.list.key() });
    queryClient.invalidateQueries({ queryKey: orpc.members.getCurrent.key() });
  };
}

export function useUpdateMemberRole() {
  const invalidate = useInvalidateMembers();
  return useMutation(
    orpc.members.updateRole.mutationOptions({
      onSuccess: () => {
        toast.success("Cargo atualizado!");
        invalidate();
      },
      onError: (error) => toast.error(error.message),
    }),
  );
}

export function useRemoveMember() {
  const invalidate = useInvalidateMembers();
  return useMutation(
    orpc.members.remove.mutationOptions({
      onSuccess: () => {
        toast.success("Membro removido da organização.");
        invalidate();
      },
      onError: (error) => toast.error(error.message),
    }),
  );
}

export function useUpdateMemberPermissions() {
  const invalidate = useInvalidateMembers();
  return useMutation(
    orpc.members.updatePermissions.mutationOptions({
      onSuccess: () => {
        toast.success("Permissões atualizadas!");
        invalidate();
      },
      onError: (error) => toast.error(error.message),
    }),
  );
}
