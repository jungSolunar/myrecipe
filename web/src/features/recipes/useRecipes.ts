import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { recipesApi } from '../../api';
import type { RecipeListParams, RecipeWriteRequest } from '../../api/types';

const KEY = 'recipes';

export function useRecipeList(params: RecipeListParams = {}) {
  return useQuery({
    queryKey: [KEY, 'list', params],
    queryFn: () => recipesApi.listRecipes(params),
  });
}

export function useRecipeDetail(recipeId: string | undefined) {
  return useQuery({
    queryKey: [KEY, 'detail', recipeId],
    queryFn: () => recipesApi.getRecipe(recipeId as string),
    enabled: Boolean(recipeId),
  });
}

export function useCreateRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: RecipeWriteRequest) => recipesApi.createRecipe(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY, 'list'] }),
  });
}

export function useUpdateRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: RecipeWriteRequest }) =>
      recipesApi.updateRecipe(id, body),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: [KEY, 'list'] });
      void qc.invalidateQueries({ queryKey: [KEY, 'detail', vars.id] });
    },
  });
}

export function useDeleteRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => recipesApi.deleteRecipe(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY, 'list'] }),
  });
}
