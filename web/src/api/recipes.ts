// api/recipes.ts — 레시피 CRUD·목록·검색 (US-004~007, US-010). 계약: /recipes
import { apiRequest } from './client';
import type {
  Paginated,
  RatingResponse,
  RatingWriteRequest,
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

// ---- 별점 (US-015 [v2.3.0], 로그인 필수 1인 1평점 upsert) ----
/** PUT /recipes/{id}/rating — 내 별점 등록/수정. */
export function putRating(recipeId: string, body: RatingWriteRequest): Promise<RatingResponse> {
  return apiRequest<RatingResponse>(`/recipes/${encodeURIComponent(recipeId)}/rating`, {
    method: 'PUT',
    body,
  });
}

/** DELETE /recipes/{id}/rating — 내 별점 취소. */
export function deleteRating(recipeId: string): Promise<RatingResponse> {
  return apiRequest<RatingResponse>(`/recipes/${encodeURIComponent(recipeId)}/rating`, {
    method: 'DELETE',
  });
}
