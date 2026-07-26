/*
 * mocks/handlers.ts — openapi.yaml(v1.0.0) 기반 MSW 핸들러.
 * 세션은 목 단순화를 위해 인메모리(store.currentUser)로 표현한다.
 */
import { http, HttpResponse } from 'msw';
import type {
  AuthResponse,
  Ingredient,
  IngredientAvailability,
  IngredientWriteRequest,
  LoginRequest,
  Paginated,
  RatingWriteRequest,
  RecipeDetail,
  RecipeIngredient,
  RecipeListItem,
  RecipeRating,
  RecipeWriteRequest,
  SignupRequest,
  UploadResponse,
  User,
} from '../api/types';
import type {
  InventoryItem,
  InventoryWriteRequest,
} from '../api/inventory';
import type { DashboardSummary } from '../api/dashboard';
import { nextId, nowIso, store } from './data';

const BASE = '/api/v1';

// ---- v2.3.0 집계 헬퍼 ----
/** [US-015] 레시피 평점 집계(평균·평가수). 0건이면 average=null. */
function ratingFor(recipeId: string): RecipeRating {
  const scores = store.ratings.filter((r) => r.recipe_id === recipeId).map((r) => r.score);
  if (scores.length === 0) return { average: null, count: 0 };
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return { average: Math.round(avg * 10) / 10, count: scores.length };
}

/**
 * [US-012/013/020] 재고 대비 재료 충족 판정 (동일 단위 비교, 유통기한·보관위치 미반영).
 * 로그인 + 해당 회원 재고가 있을 때만 계산. 미로그인/재고 0 이면 null.
 */
function computeAvailability(
  recipe: RecipeDetail,
): { statuses: Map<string, RecipeIngredient['status']>; missing_count: number } | null {
  if (!store.currentUser) return null;
  const inv = store.inventory.filter((i) => i.owner_id === store.currentUser!.id);
  if (inv.length === 0) return null;
  const statuses = new Map<string, RecipeIngredient['status']>();
  let missing = 0;
  for (const ing of recipe.ingredients) {
    const held = inv.find((i) => i.ingredient_id === ing.ingredient_id);
    if (held && held.quantity >= ing.quantity) {
      statuses.set(ing.ingredient_id, 'sufficient');
    } else if (held) {
      statuses.set(ing.ingredient_id, 'insufficient');
      missing += 1;
    } else {
      statuses.set(ing.ingredient_id, 'missing');
      missing += 1;
    }
  }
  return { statuses, missing_count: missing };
}

function errorBody(code: string, message: string, details: Array<{ field?: string; reason?: string }> = []) {
  return { error: { code, message, details } };
}

function unauthorized() {
  return HttpResponse.json(errorBody('AUTH_REQUIRED', '로그인이 필요합니다.'), { status: 401 });
}

function authResponse(user: User): AuthResponse {
  return { user };
}

function toListItem(r: RecipeDetail): RecipeListItem {
  const avail = computeAvailability(r);
  return {
    id: r.id,
    title: r.title,
    category: r.category ?? null,
    photo_url: r.photo_url ?? null,
    ingredient_count: r.ingredients.length,
    missing_count: avail ? avail.missing_count : undefined,
    cook_time_minutes: r.cook_time_minutes ?? null,
    rating: ratingFor(r.id),
    owner_id: r.owner_id,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

function withOwnerFlag(r: RecipeDetail): RecipeDetail {
  const avail = computeAvailability(r);
  const ingredients = r.ingredients.map((ing) => ({
    ...ing,
    status: avail ? avail.statuses.get(ing.ingredient_id) : ing.status,
  }));
  let ingredient_availability: IngredientAvailability | undefined;
  if (avail) {
    const missing_ingredients = r.ingredients
      .filter((ing) => avail.statuses.get(ing.ingredient_id) !== 'sufficient')
      .map((ing) => ({
        ingredient_id: ing.ingredient_id,
        name: ing.name,
        required_quantity: ing.quantity,
        unit: ing.unit ?? null,
      }));
    ingredient_availability = {
      status: avail.missing_count === 0 ? 'sufficient' : 'insufficient',
      missing_count: avail.missing_count,
      missing_ingredients,
    };
  }
  return {
    ...r,
    ingredients,
    ingredient_availability,
    rating: ratingFor(r.id),
    is_owner: store.currentUser?.id === r.owner_id,
  };
}

export const handlers = [
  // ---- 인증 ----
  http.post(`${BASE}/auth/signup`, async ({ request }) => {
    const body = (await request.json()) as SignupRequest;
    if (!body.email || !body.password || body.password.length < 8) {
      return HttpResponse.json(
        errorBody('VALIDATION_ERROR', '입력값을 확인해주세요.', [{ field: 'password', reason: 'min_length' }]),
        { status: 400 },
      );
    }
    if (store.users.some((u) => u.email === body.email)) {
      return HttpResponse.json(
        errorBody('EMAIL_ALREADY_EXISTS', '이미 가입된 이메일입니다.', [{ field: 'email', reason: 'duplicate' }]),
        { status: 409 },
      );
    }
    const user: User = {
      id: nextId('usr'),
      email: body.email,
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    store.users.push({ ...user, password: body.password });
    store.currentUser = user;
    return HttpResponse.json(authResponse(user), { status: 201 });
  }),

  http.post(`${BASE}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as LoginRequest;
    const found = store.users.find((u) => u.email === body.email && u.password === body.password);
    if (!found) {
      return HttpResponse.json(
        errorBody('INVALID_CREDENTIALS', '이메일 또는 비밀번호가 올바르지 않습니다.'),
        { status: 401 },
      );
    }
    const { password: _pw, ...user } = found;
    store.currentUser = user;
    return HttpResponse.json(authResponse(user), { status: 200 });
  }),

  http.post(`${BASE}/auth/logout`, () => {
    store.currentUser = null;
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(`${BASE}/auth/me`, () => {
    if (!store.currentUser) return unauthorized();
    return HttpResponse.json(authResponse(store.currentUser), { status: 200 });
  }),

  // ---- 레시피 ----
  http.get(`${BASE}/recipes`, ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get('q')?.toLowerCase();
    const category = url.searchParams.get('category');
    const ingredientIds = url.searchParams.getAll('ingredient_id');

    const availableOnly = url.searchParams.get('available_only') === 'true';
    const sort = url.searchParams.get('sort') ?? 'recent';

    let data = store.recipes.slice();
    if (q) data = data.filter((r) => r.title.toLowerCase().includes(q));
    if (category) data = data.filter((r) => r.category === category);
    if (ingredientIds.length)
      data = data.filter((r) =>
        ingredientIds.every((id) => r.ingredients.some((ing) => ing.ingredient_id === id)),
      );

    let items = data.map(toListItem);

    // [US-013] 추천 모드: 매칭 100%(부족 0)만. 재고 미계산(undefined)은 제외.
    if (availableOnly) items = items.filter((i) => i.missing_count === 0);

    // 정렬 (값 없는 항목은 항상 뒤로)
    if (sort === 'missing_asc') {
      items.sort((a, b) => (a.missing_count ?? Infinity) - (b.missing_count ?? Infinity));
    } else if (sort === 'cook_time_asc') {
      items.sort(
        (a, b) => (a.cook_time_minutes ?? Infinity) - (b.cook_time_minutes ?? Infinity),
      );
    } else if (sort === 'rating_desc') {
      items.sort((a, b) => (b.rating?.average ?? -Infinity) - (a.rating?.average ?? -Infinity));
    }

    const payload: Paginated<RecipeListItem> = {
      data: items,
      next_cursor: null,
      has_more: false,
    };
    return HttpResponse.json(payload, { status: 200 });
  }),

  http.post(`${BASE}/recipes`, async ({ request }) => {
    if (!store.currentUser) return unauthorized();
    const body = (await request.json()) as RecipeWriteRequest;
    if (!body.title || !body.title.trim()) {
      return HttpResponse.json(
        errorBody('VALIDATION_ERROR', '입력값을 확인해주세요.', [{ field: 'title', reason: 'required' }]),
        { status: 400 },
      );
    }
    const recipe: RecipeDetail = {
      id: nextId('rcp'),
      title: body.title,
      category: body.category ?? null,
      description: body.description ?? null,
      photo_url: body.photo_url ?? null,
      steps: body.steps ?? [],
      cook_time_minutes: body.cook_time_minutes ?? null,
      ingredients: (body.ingredients ?? []).map((i) => ({
        ingredient_id: i.ingredient_id,
        name: store.ingredients.find((x) => x.id === i.ingredient_id)?.name,
        quantity: i.quantity,
        unit: i.unit ?? null,
      })),
      owner_id: store.currentUser.id,
      is_owner: true,
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    store.recipes.unshift(recipe);
    return HttpResponse.json(withOwnerFlag(recipe), { status: 201 });
  }),

  http.get(`${BASE}/recipes/:id`, ({ params }) => {
    const recipe = store.recipes.find((r) => r.id === params.id);
    if (!recipe) {
      return HttpResponse.json(
        errorBody('RESOURCE_NOT_FOUND', '요청한 리소스를 찾을 수 없습니다.'),
        { status: 404 },
      );
    }
    return HttpResponse.json(withOwnerFlag(recipe), { status: 200 });
  }),

  http.put(`${BASE}/recipes/:id`, async ({ request, params }) => {
    if (!store.currentUser) return unauthorized();
    const recipe = store.recipes.find((r) => r.id === params.id);
    if (!recipe) {
      return HttpResponse.json(errorBody('RESOURCE_NOT_FOUND', '요청한 리소스를 찾을 수 없습니다.'), {
        status: 404,
      });
    }
    if (recipe.owner_id !== store.currentUser.id) {
      return HttpResponse.json(errorBody('FORBIDDEN', '이 리소스에 대한 권한이 없습니다.'), { status: 403 });
    }
    const body = (await request.json()) as RecipeWriteRequest;
    if (!body.title || !body.title.trim()) {
      return HttpResponse.json(
        errorBody('VALIDATION_ERROR', '입력값을 확인해주세요.', [{ field: 'title', reason: 'required' }]),
        { status: 400 },
      );
    }
    recipe.title = body.title;
    recipe.category = body.category ?? null;
    recipe.description = body.description ?? null;
    recipe.photo_url = body.photo_url ?? null;
    recipe.cook_time_minutes = body.cook_time_minutes ?? null;
    recipe.steps = body.steps ?? [];
    recipe.ingredients = (body.ingredients ?? []).map((i) => ({
      ingredient_id: i.ingredient_id,
      name: store.ingredients.find((x) => x.id === i.ingredient_id)?.name,
      quantity: i.quantity,
      unit: i.unit ?? null,
    }));
    recipe.updated_at = nowIso();
    return HttpResponse.json(withOwnerFlag(recipe), { status: 200 });
  }),

  http.delete(`${BASE}/recipes/:id`, ({ params }) => {
    if (!store.currentUser) return unauthorized();
    const recipe = store.recipes.find((r) => r.id === params.id);
    if (!recipe) {
      return HttpResponse.json(errorBody('RESOURCE_NOT_FOUND', '요청한 리소스를 찾을 수 없습니다.'), {
        status: 404,
      });
    }
    if (recipe.owner_id !== store.currentUser.id) {
      return HttpResponse.json(errorBody('FORBIDDEN', '이 리소스에 대한 권한이 없습니다.'), { status: 403 });
    }
    store.recipes = store.recipes.filter((r) => r.id !== params.id);
    return new HttpResponse(null, { status: 204 });
  }),

  // ---- 식재료 마스터 ----
  http.get(`${BASE}/ingredients`, ({ request }) => {
    if (!store.currentUser) return unauthorized();
    const url = new URL(request.url);
    const q = url.searchParams.get('q')?.toLowerCase();
    const category = url.searchParams.get('category');
    let data = store.ingredients.filter((i) => i.owner_id === store.currentUser!.id);
    if (q)
      data = data.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          // [US-016] 별칭(aliases)도 매칭
          (i.aliases ?? []).some((a) => a.toLowerCase().includes(q)),
      );
    if (category) data = data.filter((i) => i.category === category);
    const payload: Paginated<Ingredient> = { data, next_cursor: null, has_more: false };
    return HttpResponse.json(payload, { status: 200 });
  }),

  http.post(`${BASE}/ingredients`, async ({ request }) => {
    if (!store.currentUser) return unauthorized();
    const body = (await request.json()) as IngredientWriteRequest;
    if (!body.name || !body.name.trim()) {
      return HttpResponse.json(
        errorBody('VALIDATION_ERROR', '입력값을 확인해주세요.', [{ field: 'name', reason: 'required' }]),
        { status: 400 },
      );
    }
    if (
      store.ingredients.some(
        (i) => i.owner_id === store.currentUser!.id && i.name === body.name.trim(),
      )
    ) {
      return HttpResponse.json(
        errorBody('INGREDIENT_NAME_EXISTS', '이미 등록된 식재료입니다.', [{ field: 'name', reason: 'duplicate' }]),
        { status: 409 },
      );
    }
    const ingredient: Ingredient = {
      id: nextId('ing'),
      name: body.name.trim(),
      category: body.category ?? null,
      default_unit: body.default_unit ?? null,
      aliases: body.aliases ?? [],
      kcal_per_100g: body.kcal_per_100g ?? null,
      default_storage: body.default_storage ?? null,
      memo: body.memo ?? null,
      owner_id: store.currentUser.id,
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    store.ingredients.push(ingredient);
    return HttpResponse.json(ingredient, { status: 201 });
  }),

  http.get(`${BASE}/ingredients/:id`, ({ params }) => {
    if (!store.currentUser) return unauthorized();
    const ing = store.ingredients.find((i) => i.id === params.id);
    if (!ing)
      return HttpResponse.json(errorBody('RESOURCE_NOT_FOUND', '요청한 리소스를 찾을 수 없습니다.'), {
        status: 404,
      });
    return HttpResponse.json(ing, { status: 200 });
  }),

  http.put(`${BASE}/ingredients/:id`, async ({ request, params }) => {
    if (!store.currentUser) return unauthorized();
    const ing = store.ingredients.find((i) => i.id === params.id);
    if (!ing)
      return HttpResponse.json(errorBody('RESOURCE_NOT_FOUND', '요청한 리소스를 찾을 수 없습니다.'), {
        status: 404,
      });
    if (ing.owner_id !== store.currentUser.id)
      return HttpResponse.json(errorBody('FORBIDDEN', '이 리소스에 대한 권한이 없습니다.'), { status: 403 });
    const body = (await request.json()) as IngredientWriteRequest;
    if (
      body.name &&
      store.ingredients.some(
        (i) => i.id !== ing.id && i.owner_id === store.currentUser!.id && i.name === body.name.trim(),
      )
    ) {
      return HttpResponse.json(errorBody('INGREDIENT_NAME_EXISTS', '이미 등록된 식재료입니다.'), {
        status: 409,
      });
    }
    ing.name = body.name?.trim() ?? ing.name;
    ing.category = body.category ?? null;
    ing.default_unit = body.default_unit ?? null;
    ing.aliases = body.aliases ?? [];
    ing.kcal_per_100g = body.kcal_per_100g ?? null;
    ing.default_storage = body.default_storage ?? null;
    ing.memo = body.memo ?? null;
    ing.updated_at = nowIso();
    return HttpResponse.json(ing, { status: 200 });
  }),

  http.delete(`${BASE}/ingredients/:id`, ({ request, params }) => {
    if (!store.currentUser) return unauthorized();
    const ing = store.ingredients.find((i) => i.id === params.id);
    if (!ing)
      return HttpResponse.json(errorBody('RESOURCE_NOT_FOUND', '요청한 리소스를 찾을 수 없습니다.'), {
        status: 404,
      });
    if (ing.owner_id !== store.currentUser.id)
      return HttpResponse.json(errorBody('FORBIDDEN', '이 리소스에 대한 권한이 없습니다.'), { status: 403 });

    const force = new URL(request.url).searchParams.get('force') === 'true';
    const refCount = store.recipes.filter((r) =>
      r.ingredients.some((x) => x.ingredient_id === ing.id),
    ).length;
    if (refCount > 0 && !force) {
      return HttpResponse.json(
        errorBody(
          'INGREDIENT_IN_USE',
          '레시피에서 참조 중인 식재료입니다. 강제 삭제하려면 force=true 를 사용하세요.',
          [{ field: 'recipes', reason: `referenced_by_${refCount}` }],
        ),
        { status: 409 },
      );
    }
    store.ingredients = store.ingredients.filter((i) => i.id !== ing.id);
    return new HttpResponse(null, { status: 204 });
  }),

  // ---- 별점 (US-015) ----
  http.put(`${BASE}/recipes/:id/rating`, async ({ request, params }) => {
    if (!store.currentUser) return unauthorized();
    const recipe = store.recipes.find((r) => r.id === params.id);
    if (!recipe)
      return HttpResponse.json(errorBody('RESOURCE_NOT_FOUND', '요청한 리소스를 찾을 수 없습니다.'), {
        status: 404,
      });
    const body = (await request.json()) as RatingWriteRequest;
    if (!Number.isInteger(body.score) || body.score < 1 || body.score > 5) {
      return HttpResponse.json(
        errorBody('VALIDATION_ERROR', '입력값을 확인해주세요.', [{ field: 'score', reason: 'range' }]),
        { status: 400 },
      );
    }
    const existing = store.ratings.find(
      (r) => r.recipe_id === recipe.id && r.user_id === store.currentUser!.id,
    );
    if (existing) existing.score = body.score;
    else store.ratings.push({ recipe_id: recipe.id, user_id: store.currentUser.id, score: body.score });
    return HttpResponse.json(
      { recipe_id: recipe.id, rating: ratingFor(recipe.id), my_score: body.score },
      { status: 200 },
    );
  }),

  http.delete(`${BASE}/recipes/:id/rating`, ({ params }) => {
    if (!store.currentUser) return unauthorized();
    const idx = store.ratings.findIndex(
      (r) => r.recipe_id === params.id && r.user_id === store.currentUser!.id,
    );
    if (idx < 0)
      return HttpResponse.json(errorBody('RESOURCE_NOT_FOUND', '취소할 평점이 없습니다.'), {
        status: 404,
      });
    store.ratings.splice(idx, 1);
    return HttpResponse.json(
      { recipe_id: params.id as string, rating: ratingFor(params.id as string), my_score: null },
      { status: 200 },
    );
  }),

  // ---- 재고 (US-011, US-017) ----
  http.get(`${BASE}/inventory`, () => {
    if (!store.currentUser) return unauthorized();
    const data = store.inventory.filter((i) => i.owner_id === store.currentUser!.id);
    const payload: Paginated<InventoryItem> = { data, next_cursor: null, has_more: false };
    return HttpResponse.json(payload, { status: 200 });
  }),

  http.post(`${BASE}/inventory`, async ({ request }) => {
    if (!store.currentUser) return unauthorized();
    const body = (await request.json()) as InventoryWriteRequest;
    const item: InventoryItem = {
      id: nextId('inv'),
      ingredient_id: body.ingredient_id,
      ingredient_name: store.ingredients.find((x) => x.id === body.ingredient_id)?.name,
      quantity: body.quantity,
      unit: body.unit ?? null,
      expires_at: body.expires_at ?? null,
      storage_location: body.storage_location ?? null,
      owner_id: store.currentUser.id,
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    store.inventory.push(item);
    return HttpResponse.json(item, { status: 201 });
  }),

  http.put(`${BASE}/inventory/:id`, async ({ request, params }) => {
    if (!store.currentUser) return unauthorized();
    const item = store.inventory.find((i) => i.id === params.id);
    if (!item)
      return HttpResponse.json(errorBody('RESOURCE_NOT_FOUND', '요청한 리소스를 찾을 수 없습니다.'), {
        status: 404,
      });
    if (item.owner_id !== store.currentUser.id)
      return HttpResponse.json(errorBody('FORBIDDEN', '이 리소스에 대한 권한이 없습니다.'), { status: 403 });
    const body = (await request.json()) as InventoryWriteRequest;
    item.quantity = body.quantity;
    item.unit = body.unit ?? null;
    item.expires_at = body.expires_at ?? null;
    item.storage_location = body.storage_location ?? null;
    item.updated_at = nowIso();
    return HttpResponse.json(item, { status: 200 });
  }),

  http.delete(`${BASE}/inventory/:id`, ({ params }) => {
    if (!store.currentUser) return unauthorized();
    store.inventory = store.inventory.filter((i) => i.id !== params.id);
    return new HttpResponse(null, { status: 204 });
  }),

  // ---- 홈 대시보드 (US-018) ----
  http.get(`${BASE}/dashboard`, () => {
    if (!store.currentUser) return unauthorized();
    const uid = store.currentUser.id;
    const myRecipes = store.recipes.slice();
    const items = myRecipes.map(toListItem);
    const makeable = items.filter((i) => (i.missing_count ?? 1) === 0);
    const inv = store.inventory.filter((i) => i.owner_id === uid);

    const MS = 86_400_000;
    const today = new Date();
    const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const expiring = inv.filter((i) => {
      if (!i.expires_at) return false;
      const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(i.expires_at);
      if (!m) return false;
      const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).getTime();
      const daysLeft = Math.round((d - startToday) / MS);
      return daysLeft <= 3;
    });

    const dist = new Map<string | null, number>();
    for (const r of myRecipes) {
      const key = r.category ?? null;
      dist.set(key, (dist.get(key) ?? 0) + 1);
    }

    const recent = [...items].sort((a, b) => (a.created_at < b.created_at ? 1 : -1)).slice(0, 5);

    const payload: DashboardSummary = {
      registered_recipe_count: myRecipes.length,
      makeable_recipe_count: makeable.length,
      inventory_ingredient_count: inv.length,
      expiring_soon_count: expiring.length,
      category_distribution: [...dist.entries()].map(([category, count]) => ({ category, count })),
      makeable_recipes: makeable,
      expiring_ingredients: expiring,
      recent_recipes: recent,
    };
    return HttpResponse.json(payload, { status: 200 });
  }),

  // ---- 업로드 ----
  http.post(`${BASE}/uploads/images`, () => {
    if (!store.currentUser) return unauthorized();
    const res: UploadResponse = { url: `https://cdn.example.com/u/${nextId('img')}.jpg` };
    return HttpResponse.json(res, { status: 201 });
  }),
];
