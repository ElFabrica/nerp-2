"use client";

import { authClient } from "@/lib/auth-client";
import { orpc } from "@/lib/orpc";
import { isSuperAdmin } from "@/lib/super-admin";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// Só UX: esconde/mostra os controles. O gate real é no servidor.
export function useIsSuperAdmin() {
  const { data: session } = authClient.useSession();
  return isSuperAdmin(session?.user.email);
}

export function useMediaModelPhotos() {
  const { data, isPending } = useQuery(
    orpc.mediaModelPhoto.list.queryOptions({ input: {} }),
  );
  return { photos: data?.items ?? [], isLoading: isPending };
}

function useInvalidateModelPhotos() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: orpc.mediaModelPhoto.list.key() });
}

export function useCreateMediaModelPhoto() {
  const invalidate = useInvalidateModelPhotos();
  return useMutation(
    orpc.mediaModelPhoto.create.mutationOptions({
      onSuccess: () => {
        toast.success("Foto adicionada à biblioteca");
        invalidate();
      },
      onError: (error) => toast.error(error.message),
    }),
  );
}

export function useDeleteMediaModelPhoto() {
  const invalidate = useInvalidateModelPhotos();
  return useMutation(
    orpc.mediaModelPhoto.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Foto removida da biblioteca");
        invalidate();
      },
      onError: (error) => toast.error(error.message),
    }),
  );
}
