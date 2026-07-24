"""Pydantic 모델 — openapi.yaml v1.0.0 스키마와 1:1.

응답 모델은 계약의 필드명/타입/nullable/required 를 그대로 따른다.
"""
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field


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
    steps: List[str]
    ingredients: List[RecipeIngredientWrite]


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


class Ingredient(BaseModel):
    id: str
    name: str
    category: Optional[str] = None
    default_unit: Optional[str] = None
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


class InventoryItem(BaseModel):
    id: str
    ingredient_id: str
    ingredient_name: Optional[str] = None
    quantity: float
    unit: Optional[str] = None
    expires_at: Optional[str] = None
    owner_id: str
    created_at: str
    updated_at: str


class InventoryListResponse(BaseModel):
    data: List[InventoryItem]
    next_cursor: Optional[str] = None
    has_more: bool


# ---- 업로드 ----
class UploadResponse(BaseModel):
    url: str
