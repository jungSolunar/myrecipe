import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ingredientsApi } from '../../api';
import type { IngredientListParams, IngredientWriteRequest } from '../../api/types';

const KEY = 'ingredients';

export function useIngredientList(params: IngredientListParams = {}) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: () => ingredientsApi.listIngredients(params),
  });
}

export function useCreateIngredient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: IngredientWriteRequest) => ingredientsApi.createIngredient(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateIngredient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: IngredientWriteRequest }) =>
      ingredientsApi.updateIngredient(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useDeleteIngredient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, force }: { id: string; force?: boolean }) =>
      ingredientsApi.deleteIngredient(id, force),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
