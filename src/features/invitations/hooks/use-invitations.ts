"use client";

import { orpc } from "@/lib/orpc";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useInvitations(status: "pending" | "all" = "pending") {
  const { data, isPending } = useQuery(
    orpc.invitation.list.queryOptions({ input: { status } }),
  );
  return { invitations: data ?? [], isLoading: isPending };
}

export function useInvitation(id: string) {
  const { data, isPending, error } = useQuery({
    ...orpc.invitation.get.queryOptions({ input: { id } }),
    enabled: !!id,
    retry: false,
  });
  return { invitation: data ?? null, isLoading: isPending, error };
}

function useInvalidateInvitations() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: orpc.invitation.list.key() });
  };
}

export function useCreateInvitation() {
  const invalidate = useInvalidateInvitations();
  return useMutation(
    orpc.invitation.create.mutationOptions({
      onSuccess: () => {
        toast.success("Convite enviado!");
        invalidate();
      },
      // O convite pode ter sido criado e só o e-mail ter falhado — revalida
      // para ele aparecer como pendente e permitir o reenvio.
      onError: (error) => {
        toast.error(error.message);
        invalidate();
      },
    }),
  );
}

export function useCancelInvitation() {
  const invalidate = useInvalidateInvitations();
  return useMutation(
    orpc.invitation.cancel.mutationOptions({
      onSuccess: () => {
        toast.success("Convite cancelado.");
        invalidate();
      },
      onError: (error) => toast.error(error.message),
    }),
  );
}

export function useResendInvitation() {
  const invalidate = useInvalidateInvitations();
  return useMutation(
    orpc.invitation.resend.mutationOptions({
      onSuccess: () => {
        toast.success("Convite reenviado!");
        invalidate();
      },
      onError: (error) => toast.error(error.message),
    }),
  );
}

export function useAcceptInvitation() {
  return useMutation(
    orpc.invitation.accept.mutationOptions({
      onError: (error) => toast.error(error.message),
    }),
  );
}

export function useRejectInvitation() {
  return useMutation(
    orpc.invitation.reject.mutationOptions({
      onError: (error) => toast.error(error.message),
    }),
  );
}
