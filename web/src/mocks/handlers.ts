/*
 * mocks/handlers.ts — openapi.yaml(v1.0.0) 기반 MSW 핸들러.
 * 세션은 목 단순화를 위해 인메모리(store.currentUser)로 표현한다.
 */
import { http, HttpResponse } from 'msw';
import type {
  AuthResponse,
  Ingredient,
  IngredientWriteRequest,
  LoginRequest,
  Paginated,
  RecipeDetail,
  RecipeListItem,
  RecipeWriteRequest,
  SignupRequest,
  UploadResponse,
  User,
} from '../api/types';
import { nextId, nowIso, store } from './data';

const BASE = '/api/v1';

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
  return {
    id: r.id,
    title: r.title,
    category: r.category ?? null,
    photo_url: r.photo_url ?? null,
    ingredient_count: r.ingredients.length,
    owner_id: r.owner_id,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

function withOwnerFlag(r: RecipeDetail): RecipeDetail {
  return { ...r, is_owner: store.currentUser?.id === r.owner_id };
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

    let data = store.recipes.slice();
    if (q) data = data.filter((r) => r.title.toLowerCase().includes(q));
    if (category) data = data.filter((r) => r.category === category);
    if (ingredientIds.length)
      data = data.filter((r) =>
        ingredientIds.every((id) => r.ingredients.some((ing) => ing.ingredient_id === id)),
      );

    const payload: Paginated<RecipeListItem> = {
      data: data.map(toListItem),
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
    return HttpResponse.json(recipe, { status: 201 });
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
    if (q) data = data.filter((i) => i.name.toLowerCase().includes(q));
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

  // ---- 업로드 ----
  http.post(`${BASE}/uploads/images`, () => {
    if (!store.currentUser) return unauthorized();
    const res: UploadResponse = { url: `https://cdn.example.com/u/${nextId('img')}.jpg` };
    return HttpResponse.json(res, { status: 201 });
  }),
];
