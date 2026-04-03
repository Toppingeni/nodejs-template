import {
  queryOptions,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  SampleFilters,
  CreateSampleDto,
  UpdateSampleDto,
} from "../../shared/types/sample";
import { sampleApi, handleApiError } from "./api";

// queryOptions factories
export const sampleOptions = {
  list: (filters?: SampleFilters) =>
    queryOptions({
      queryKey: ["samples", "list", filters ?? {}] as const,
      queryFn: () => sampleApi.getAll(filters),
    }),

  detail: (id: string) =>
    queryOptions({
      queryKey: ["samples", "detail", id] as const,
      queryFn: () => sampleApi.getById(id),
      enabled: !!id,
    }),
};

// Query hooks
export const useSamples = (filters?: SampleFilters) =>
  useQuery(sampleOptions.list(filters));

export const useSampleById = (id: string) => useQuery(sampleOptions.detail(id));

// Mutation hooks
export const useCreateSample = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSampleDto) => sampleApi.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["samples", "list"] });
      toast.success("สร้างข้อมูลสำเร็จ");
    },
    onError: (error: unknown) => {
      const apiError = handleApiError(error);
      toast.error(apiError.message);
    },
  });
};

export const useUpdateSample = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSampleDto }) =>
      sampleApi.update(id, data),
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["samples", "list"] });
      void queryClient.invalidateQueries({
        queryKey: ["samples", "detail", variables.id],
      });
      toast.success("อัปเดตข้อมูลสำเร็จ");
    },
    onError: (error: unknown) => {
      const apiError = handleApiError(error);
      toast.error(apiError.message);
    },
  });
};

export const useDeleteSample = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sampleApi.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["samples", "list"] });
      toast.success("ลบข้อมูลสำเร็จ");
    },
    onError: (error: unknown) => {
      const apiError = handleApiError(error);
      toast.error(apiError.message);
    },
  });
};
