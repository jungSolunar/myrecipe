// api/recipes.ts — 레시피 CRUD·목록·검색 (US-004~007, US-010). 계약: /recipes
import { apiRequest } from './client';
import type {
  Paginated,
  RecipeDetail,
  RecipeListItem,
  RecipeListParams,
  RecipeWriteRequest,
} from './types';

export function listRecipes(params: RecipeListParams = {}): Promise<Paginated<RecipeListItem>> {
  return apiRequest<Paginated<RecipeListItem>>('/recipes', {
    query: {
      cursor: params.cursor,
      limit: params.limit,
      q: params.q,
      category: params.category,
      ingredient_id: params.ingredient_id,
      sort: params.sort,
      // [US-013] 추천 모드에서만 전달. undefined 면 buildQuery 가 파라미터를 생략(기본 동작 불변).
      available_only: params.available_only,
    },
  });
}

export function getRecipe(recipeId: string): Promise<RecipeDetail> {
  return apiRequest<RecipeDetail>(`/recipes/${encodeURIComponent(recipeId)}`);
}

export function createRecipe(body: RecipeWriteRequest): Promise<RecipeDetail> {
  return apiRequest<RecipeDetail>('/recipes', { method: 'POST', body });
}

export function updateRecipe(recipeId: string, body: RecipeWriteRequest): Promise<RecipeDetail> {
  return apiRequest<RecipeDetail>(`/recipes/${encodeURIComponent(recipeId)}`, {
    method: 'PUT',
    body,
  });
}

export function deleteRecipe(recipeId: string): Promise<void> {
  return apiRequest<void>(`/recipes/${encodeURIComponent(recipeId)}`, { method: 'DELETE' });
}
