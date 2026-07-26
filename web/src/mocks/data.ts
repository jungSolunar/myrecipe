/*
 * mocks/data.ts — MSW 목 서버용 인메모리 데이터 스토어.
 * openapi.yaml 의 스키마/예시를 그대로 따른다. 백엔드가 없을 때 개발·테스트에서 사용.
 */
import type { Ingredient, RecipeDetail, User } from '../api/types';
import type { InventoryItem } from '../api/inventory';

/** [US-015] 개별 회원 평점 레코드(집계 전 원본). */
export interface RatingRecord {
  recipe_id: string;
  user_id: string;
  score: number;
}

export interface Store {
  currentUser: User | null;
  users: Array<User & { password: string }>;
  ingredients: Ingredient[];
  recipes: RecipeDetail[];
  inventory: InventoryItem[];
  ratings: RatingRecord[];
  seq: number;
}

const OWNER: User = {
  id: 'usr_seed',
  email: 'chef@example.com',
  created_at: '2026-07-24T09:00:00Z',
  updated_at: '2026-07-24T09:00:00Z',
};

function seedIngredients(): Ingredient[] {
  const base = [
    { id: 'ing_egg', name: '계란', category: '가공식품', default_unit: '개', aliases: ['달걀', 'egg'], kcal_per_100g: 155, default_storage: '냉장' as const },
    { id: 'ing_pa', name: '대파', category: '채소', default_unit: '대', aliases: ['파'], kcal_per_100g: 25, default_storage: '냉장' as const },
    { id: 'ing_tofu', name: '두부', category: '가공식품', default_unit: '모', aliases: [], kcal_per_100g: 84, default_storage: '냉장' as const },
    { id: 'ing_salt', name: '소금', category: '양념', default_unit: '약간', aliases: [], kcal_per_100g: null, default_storage: '실온' as const },
    { id: 'ing_oil', name: '식용유', category: '양념', default_unit: '큰술', aliases: [], kcal_per_100g: 884, default_storage: '실온' as const },
  ];
  return base.map((b) => ({
    memo: null,
    ...b,
    owner_id: OWNER.id,
    created_at: '2026-07-24T09:30:00Z',
    updated_at: '2026-07-24T09:30:00Z',
  }));
}

function seedRecipes(): RecipeDetail[] {
  return [
    {
      id: 'rcp_egg_roll',
      title: '기본 계란말이',
      category: '한식',
      description: '부드러운 기본 계란말이',
      photo_url: null,
      steps: [
        '계란 4개를 볼에 풀고 소금으로 간한다.',
        '대파를 잘게 썰어 계란물에 섞는다.',
        '달군 팬에 기름을 두르고 계란물을 얇게 부어 익으면 돌돌 만다.',
        '한 김 식힌 뒤 먹기 좋게 썬다.',
      ],
      ingredients: [
        { ingredient_id: 'ing_egg', name: '계란', quantity: 4, unit: '개' },
        { ingredient_id: 'ing_pa', name: '대파', quantity: 0.5, unit: '대' },
        { ingredient_id: 'ing_salt', name: '소금', quantity: 1, unit: '약간' },
        { ingredient_id: 'ing_oil', name: '식용유', quantity: 1, unit: '큰술' },
      ],
      cook_time_minutes: 15,
      owner_id: OWNER.id,
      is_owner: false,
      created_at: '2026-07-24T10:00:00Z',
      updated_at: '2026-07-24T10:00:00Z',
    },
    {
      id: 'rcp_fried_rice',
      title: '계란 볶음밥',
      category: '한식',
      description: null,
      photo_url: null,
      steps: ['밥과 계란을 볶는다.', '대파와 소금으로 간한다.'],
      ingredients: [
        { ingredient_id: 'ing_egg', name: '계란', quantity: 2, unit: '개' },
        { ingredient_id: 'ing_pa', name: '대파', quantity: 1, unit: '대' },
      ],
      cook_time_minutes: 10,
      owner_id: OWNER.id,
      is_owner: false,
      created_at: '2026-07-24T10:05:00Z',
      updated_at: '2026-07-24T10:05:00Z',
    },
  ];
}

/** [US-015] 시드 평점 레코드(다른 회원들의 평가). */
function seedRatings(): RatingRecord[] {
  return [
    { recipe_id: 'rcp_egg_roll', user_id: 'usr_other1', score: 5 },
    { recipe_id: 'rcp_egg_roll', user_id: 'usr_other2', score: 4 },
  ];
}

export function createStore(): Store {
  return {
    currentUser: null,
    users: [{ ...OWNER, password: 'password1' }],
    ingredients: seedIngredients(),
    recipes: seedRecipes(),
    inventory: [],
    ratings: seedRatings(),
    seq: 1,
  };
}

export const store: Store = createStore();

/** 테스트 사이 상태 초기화. */
export function resetStore(overrides?: Partial<Store>) {
  const fresh = createStore();
  store.currentUser = overrides?.currentUser ?? fresh.currentUser;
  store.users = overrides?.users ?? fresh.users;
  store.ingredients = overrides?.ingredients ?? fresh.ingredients;
  store.recipes = overrides?.recipes ?? fresh.recipes;
  store.inventory = overrides?.inventory ?? fresh.inventory;
  store.ratings = overrides?.ratings ?? fresh.ratings;
  store.seq = overrides?.seq ?? fresh.seq;
}

export function nextId(prefix: string): string {
  store.seq += 1;
  return `${prefix}_${store.seq}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
