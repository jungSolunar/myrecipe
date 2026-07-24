/*
 * api/types.ts — api/openapi.yaml(v1.0.0) 계약에서 파생한 타입.
 * 계약에 없는 필드는 추가하지 않는다. (예: cookTime 등 임의 필드 금지)
 * Should/Could(US-011~013) 필드는 계약에 optional 로 존재하므로 optional 로 반영한다.
 */

// ---- 공통 ----
export interface ErrorDetail {
  field?: string;
  reason?: string;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: ErrorDetail[];
  };
}

export interface Paginated<T> {
  data: T[];
  next_cursor: string | null;
  has_more: boolean;
}

// ---- 인증 (US-001~003) ----
export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  user: User;
}

export interface SignupRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// ---- 레시피 (US-004~007, US-010) ----
export type IngredientAvailabilityStatus = 'sufficient' | 'insufficient' | 'missing';

export interface RecipeIngredient {
  ingredient_id: string;
  name?: string;
  quantity: number;
  unit?: string | null;
  /** [US-012 Should] 로그인 + 재고 있을 때만 응답에 포함 */
  status?: IngredientAvailabilityStatus;
}

export interface RecipeListItem {
  id: string;
  title: string;
  category?: string | null;
  photo_url?: string | null;
  ingredient_count?: number;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

/** [US-012 Should] 레시피 상세의 재고 대조 결과 (비로그인/재고 없음 시 생략) */
export interface IngredientAvailability {
  status: 'sufficient' | 'insufficient';
  missing_count: number;
  missing_ingredients?: Array<{
    ingredient_id: string;
    name?: string;
    required_quantity?: number;
    unit?: string | null;
  }>;
}

export interface RecipeDetail {
  id: string;
  title: string;
  category?: string | null;
  description?: string | null;
  photo_url?: string | null;
  steps: string[];
  ingredients: RecipeIngredient[];
  ingredient_availability?: IngredientAvailability;
  owner_id: string;
  is_owner?: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecipeWriteIngredient {
  ingredient_id: string;
  quantity: number;
  unit?: string | null;
}

export interface RecipeWriteRequest {
  title: string;
  category?: string | null;
  description?: string | null;
  photo_url?: string | null;
  steps: string[];
  ingredients: RecipeWriteIngredient[];
}

export interface RecipeListParams {
  cursor?: string;
  limit?: number;
  q?: string;
  category?: string;
  ingredient_id?: string[];
  sort?: 'recent' | 'missing_asc';
}

// ---- 식재료 마스터 (US-008, US-009) ----
export interface Ingredient {
  id: string;
  name: string;
  category?: string | null;
  default_unit?: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface IngredientWriteRequest {
  name: string;
  category?: string | null;
  default_unit?: string | null;
}

export interface IngredientListParams {
  cursor?: string;
  limit?: number;
  q?: string;
  category?: string;
}

// ---- 업로드 (US-004 사진 선택) ----
export interface UploadResponse {
  url: string;
}
