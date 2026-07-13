"use client";

import { orpc } from "@/lib/orpc";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface PdvPhotoFilters {
  storeId?: string;
  mapObjectId?: string;
  supplierId?: string;
  section?: string;
  responsibleCompany?: string;
  coordinatorName?: string;
  consultantName?: string;
  code?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function usePdvPhotos(filters: PdvPhotoFilters, enabled = true) {
  const { data, isPending } = useQuery({
    ...orpc.pdvPhoto.list.queryOptions({ input: filters }),
    enabled,
  });

  return { photos: data?.photos ?? [], isLoading: isPending };
}

export type PdvPhoto = ReturnType<typeof usePdvPhotos>["photos"][number];

export function usePdvFilterOptions() {
  const { data } = useQuery(
    orpc.pdvPhoto.filterOptions.queryOptions({ input: {} }),
  );
  return (
    data ?? {
      sections: [],
      companies: [],
      coordinators: [],
      consultants: [],
      codes: [],
    }
  );
}

function useInvalidatePdvPhotos() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: orpc.pdvPhoto.list.key() });
    queryClient.invalidateQueries({
      queryKey: orpc.pdvPhoto.filterOptions.key(),
    });
    queryClient.invalidateQueries({ queryKey: orpc.store.list.key() });
  };
}

export function useCreatePdvPhoto() {
  const invalidate = useInvalidatePdvPhotos();
  return useMutation(
    orpc.pdvPhoto.create.mutationOptions({
      onSuccess: () => {
        toast.success("Foto do PDV registrada");
        invalidate();
      },
      onError: (error) => toast.error(error.message),
    }),
  );
}

export function useUpdatePdvPhoto() {
  const invalidate = useInvalidatePdvPhotos();
  return useMutation(
    orpc.pdvPhoto.update.mutationOptions({
      onSuccess: () => {
        toast.success("Foto do PDV atualizada");
        invalidate();
      },
      onError: (error) => toast.error(error.message),
    }),
  );
}

export function useDeletePdvPhoto() {
  const invalidate = useInvalidatePdvPhotos();
  return useMutation(
    orpc.pdvPhoto.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Foto do PDV excluída");
        invalidate();
      },
      onError: (error) => toast.error(error.message),
    }),
  );
}
