"""Pydantic 모델 — openapi.yaml v1.0.0 스키마와 1:1.

응답 모델은 계약의 필드명/타입/nullable/required 를 그대로 따른다.
"""
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field
from typing_extensions import Literal


# ---- 공통 에러 (문서화용; 실제 응답은 errors.error_body 로 직렬화) ----
class ErrorDetail(BaseModel):
    field: Optional[str] = None
    reason: Optional[str] = None


# ---- 인증 ----
class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class User(BaseModel):
    id: str
    email: str
    created_at: str
    updated_at: str


class AuthResponse(BaseModel):
    user: User


# ---- 레시피 ----
class RecipeIngredientWrite(BaseModel):
    ingredient_id: str
    quantity: float
    unit: Optional[str] = None


class RecipeWriteRequest(BaseModel):
    title: str = Field(min_length=1)
    category: Optional[str] = None
    description: Optional[str] = None
    photo_url: Optional[str] = None
    # [v2.3.0/US-014] 조리시간(분, 정수). 선택 — 미입력 시 null.
    cook_time_minutes: Optional[int] = Field(default=None, ge=0)
    steps: List[str]
    ingredients: List[RecipeIngredientWrite]


# ---- 별점 (회원별 평점 집계, US-015 [v2.3.0]) ----
class RecipeRating(BaseModel):
    """레시피의 회원별 평점 집계. 평가 0건이면 average=None, count=0."""
    average: Optional[float] = None
    count: int = 0


class RatingWriteRequest(BaseModel):
    # [US-015] 별점 등록/수정 본문. 1인 1평점 upsert. 1~5 정수, 범위 밖이면 400.
    score: int = Field(ge=1, le=5)


class RatingResponse(BaseModel):
    recipe_id: str
    rating: RecipeRating
    my_score: Optional[int] = None


class RecipeIngredient(BaseModel):
    ingredient_id: str
    name: Optional[str] = None
    quantity: float
    unit: Optional[str] = None
    status: Optional[str] = None  # US-012: sufficient|insufficient|missing (로그인+재고 시에만)


class MissingIngredient(BaseModel):
    ingredient_id: str
    name: str
    required_quantity: float
    unit: Optional[str] = None


class IngredientAvailability(BaseModel):
    status: str  # sufficient|insufficient
    missing_count: int
    missing_ingredients: List[MissingIngredient] = []


class RecipeListItem(BaseModel):
    id: str
    title: str
    category: Optional[str] = None
    photo_url: Optional[str] = None
    ingredient_count: int
    # [v2.3.0/US-014] 조리시간(분). 미입력 시 null. 비로그인 응답에도 포함(공개 정보).
    cook_time_minutes: Optional[int] = None
    # [v2.3.0/US-015] 회원별 평점 집계. 평가 0건이면 average=null, count=0. 비로그인에도 포함.
    rating: Optional[RecipeRating] = None
    owner_id: str
    created_at: str
    updated_at: str


class RecipeDetail(BaseModel):
    id: str
    title: str
    category: Optional[str] = None
    description: Optional[str] = None
    photo_url: Optional[str] = None
    steps: List[str]
    ingredients: List[RecipeIngredient]
    ingredient_availability: Optional[IngredientAvailability] = None
    # [v2.3.0/US-014] 조리시간(분). 미입력 시 null. 비로그인 응답에도 포함(공개 정보).
    cook_time_minutes: Optional[int] = None
    # [v2.3.0/US-015] 회원별 평점 집계. 평가 0건이면 average=null, count=0. 비로그인에도 포함.
    rating: Optional[RecipeRating] = None
    owner_id: str
    is_owner: bool
    created_at: str
    updated_at: str


class RecipeListResponse(BaseModel):
    data: List[RecipeListItem]
    next_cursor: Optional[str] = None
    has_more: bool


# ---- 식재료 마스터 ----
class IngredientWriteRequest(BaseModel):
    name: str = Field(min_length=1)
    category: Optional[str] = None
    default_unit: Optional[str] = None
    # [v2.3.0/US-016] 별칭(복수, 검색용). 생략/빈 배열 허용.
    aliases: Optional[List[str]] = None
    kcal_per_100g: Optional[float] = Field(default=None, ge=0)
    # 기본 보관방법: 냉장/냉동/실온 중 하나만 허용(그 외 400). 재고 storage_location(냉장실/…)과 구분.
    default_storage: Optional[Literal["냉장", "냉동", "실온"]] = None
    memo: Optional[str] = None


class Ingredient(BaseModel):
    id: str
    name: str
    category: Optional[str] = None
    default_unit: Optional[str] = None
    # [v2.3.0/US-016] 별칭 배열. 미입력 시 빈 배열.
    aliases: List[str] = []
    kcal_per_100g: Optional[float] = None
    default_storage: Optional[str] = None
    memo: Optional[str] = None
    owner_id: str
    created_at: str
    updated_at: str


class IngredientListResponse(BaseModel):
    data: List[Ingredient]
    next_cursor: Optional[str] = None
    has_more: bool


# ---- 재고 (US-011 [Should]) ----
class InventoryWriteRequest(BaseModel):
    ingredient_id: str
    quantity: float = Field(ge=0)
    unit: Optional[str] = None
    expires_at: Optional[str] = None
    # [v2.3.0/US-017] 보관위치: 냉장실/냉동실/실온 중 하나만 허용(그 외 400). 마스터 default_storage와 구분.
    storage_location: Optional[Literal["냉장실", "냉동실", "실온"]] = None


class InventoryItem(BaseModel):
    id: str
    ingredient_id: str
    ingredient_name: Optional[str] = None
    quantity: float
    unit: Optional[str] = None
    expires_at: Optional[str] = None
    # [v2.3.0/US-017] 보관위치. 미입력 시 null. 매칭 판정 미반영(표시·관리용).
    storage_location: Optional[str] = None
    owner_id: str
    created_at: str
    updated_at: str


class InventoryListResponse(BaseModel):
    data: List[InventoryItem]
    next_cursor: Optional[str] = None
    has_more: bool


# ---- 홈 대시보드 (US-018 [v2.3.0]) ----
class CategoryDistributionItem(BaseModel):
    category: Optional[str] = None
    count: int


class DashboardSummary(BaseModel):
    registered_recipe_count: int
    makeable_recipe_count: int
    inventory_ingredient_count: int
    expiring_soon_count: int
    category_distribution: List[CategoryDistributionItem] = []
    makeable_recipes: List[RecipeListItem] = []
    expiring_ingredients: List[InventoryItem] = []
    recent_recipes: List[RecipeListItem] = []


# ---- 업로드 ----
class UploadResponse(BaseModel):
    url: str
