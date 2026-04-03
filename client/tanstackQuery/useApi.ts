import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useLogout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      // No API call needed — auth context handles token clearing
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });
};
