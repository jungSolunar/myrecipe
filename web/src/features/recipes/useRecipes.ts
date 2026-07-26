import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { recipesApi } from '../../api';
import type { RecipeListParams, RecipeWriteRequest } from '../../api/types';

const KEY = 'recipes';

/** [US-015] 내 별점 등록/수정. 성공 시 상세 캐시 무효화로 평균/평가수 갱신. */
export function useSetRating(recipeId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (score: number) => recipesApi.putRating(recipeId as string, { score }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [KEY, 'detail', recipeId] });
      void qc.invalidateQueries({ queryKey: [KEY, 'list'] });
    },
  });
}

/** [US-015] 내 별점 취소. */
export function useDeleteRating(recipeId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => recipesApi.deleteRating(recipeId as string),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [KEY, 'detail', recipeId] });
      void qc.invalidateQueries({ queryKey: [KEY, 'list'] });
    },
  });
}

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
