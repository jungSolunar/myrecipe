// api/ingredients.ts — 식재료 개인 마스터 CRUD (US-008), 레시피 편집 재료 검색(US-009). 계약: /ingredients
import { apiRequest } from './client';
import type {
  Ingredient,
  IngredientListParams,
  IngredientWriteRequest,
  Paginated,
} from './types';

export function listIngredients(
  params: IngredientListParams = {},
): Promise<Paginated<Ingredient>> {
  return apiRequest<Paginated<Ingredient>>('/ingredients', {
    query: {
      cursor: params.cursor,
      limit: params.limit,
      q: params.q,
      category: params.category,
    },
  });
}

export function createIngredient(body: IngredientWriteRequest): Promise<Ingredient> {
  return apiRequest<Ingredient>('/ingredients', { method: 'POST', body });
}

export function updateIngredient(
  ingredientId: string,
  body: IngredientWriteRequest,
): Promise<Ingredient> {
  return apiRequest<Ingredient>(`/ingredients/${encodeURIComponent(ingredientId)}`, {
    method: 'PUT',
    body,
  });
}

/** force=true 시 참조를 정리하고 강제 삭제(US-008 AC3). */
export function deleteIngredient(ingredientId: string, force = false): Promise<void> {
  return apiRequest<void>(`/ingredients/${encodeURIComponent(ingredientId)}`, {
    method: 'DELETE',
    query: force ? { force: true } : undefined,
  });
}
