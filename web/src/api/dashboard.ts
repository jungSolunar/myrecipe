// api/dashboard.ts — 홈 대시보드 집계 (US-018 [v2.3.0]). 계약: GET /dashboard (로그인 필수).
import { apiRequest } from './client';
import type { RecipeListItem } from './types';
import type { InventoryItem } from './inventory';

/** [US-018] KPI① 부가: 등록 레시피의 카테고리 분포. */
export interface CategoryDistribution {
  category: string | null;
  count: number;
}

/** [US-018] 홈 대시보드 요약 (openapi: DashboardSummary). KPI 4종 + 패널 3종. */
export interface DashboardSummary {
  registered_recipe_count: number;
  makeable_recipe_count: number;
  inventory_ingredient_count: number;
  expiring_soon_count: number;
  category_distribution?: CategoryDistribution[];
  makeable_recipes: RecipeListItem[];
  expiring_ingredients: InventoryItem[];
  recent_recipes: RecipeListItem[];
}

/** GET /dashboard — 홈 대시보드 요약. */
export function getDashboard(): Promise<DashboardSummary> {
  return apiRequest<DashboardSummary>('/dashboard');
}
