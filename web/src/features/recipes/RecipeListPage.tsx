import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  EmptyState,
  ErrorState,
  GuestBanner,
  RecipeCard,
  RecipeCardSkeleton,
  Toast,
} from '../../components';
import { useAuth } from '../auth/useAuth';
import { useIngredientList } from '../ingredients/useIngredients';
import { SearchFilterBar } from './SearchFilterBar';
import type { RecipeFilters } from './SearchFilterBar';
import { useRecipeList } from './useRecipes';
import './recipes.css';

/** US-005 목록 + US-010 검색·필터 + US-003 비로그인 열람. 필터 상태는 URL 쿼리로 관리. */
export function RecipeListPage() {
  const { status } = useAuth();
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  // 삭제/저장 후 네비게이션 state 로 전달된 토스트 메시지 노출
  const [toast, setToast] = useState<string | null>(
    (location.state as { toast?: string } | null)?.toast ?? null,
  );
  useEffect(() => {
    if ((location.state as { toast?: string } | null)?.toast) {
      navigate(location.pathname + location.search, { replace: true, state: null });
    }
    // 최초 마운트 시 1회만 state 정리
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filters: RecipeFilters = {
    q: params.get('q') ?? '',
    category: params.get('category') ?? '',
    ingredientId: params.get('ingredient_id') ?? '',
  };

  const recipeList = useRecipeList({
    q: filters.q || undefined,
    category: filters.category || undefined,
    ingredient_id: filters.ingredientId ? [filters.ingredientId] : undefined,
  });

  // 재료 필터 옵션: 로그인 회원만 개인 마스터 조회 가능(계약상 /ingredients 는 인증 필요)
  const ingredientList = useIngredientList();
  const ingredientOptions =
    status === 'authed' ? (ingredientList.data?.data ?? []) : [];

  const items = recipeList.data?.data ?? [];
  const hasFilters = Boolean(filters.q || filters.category || filters.ingredientId);

  function applyFilters(next: RecipeFilters) {
    const sp = new URLSearchParams();
    if (next.q) sp.set('q', next.q);
    if (next.category) sp.set('category', next.category);
    if (next.ingredientId) sp.set('ingredient_id', next.ingredientId);
    setParams(sp);
  }

  function resetFilters() {
    setParams(new URLSearchParams());
  }

  const resultCount = recipeList.isSuccess ? items.length : undefined;

  const activeFilterLabel = useMemo(() => {
    if (filters.q) return filters.q;
    if (filters.category) return filters.category;
    return '조건';
  }, [filters.q, filters.category]);

  return (
    <main id="main" className="recipes-container">
      {status === 'guest' && <GuestBanner />}

      <div className="pagehead">
        <h1>레시피</h1>
        <Link className="btn btn--primary" to="/recipes/new">
          + 새 레시피
        </Link>
      </div>

      <SearchFilterBar
        filters={filters}
        ingredientOptions={ingredientOptions}
        resultCount={resultCount}
        onChange={applyFilters}
        onReset={resetFilters}
      />

      {recipeList.isLoading ? (
        <div className="recipe-grid" aria-hidden="true">
          <RecipeCardSkeleton />
          <RecipeCardSkeleton />
          <RecipeCardSkeleton />
        </div>
      ) : recipeList.isError ? (
        <ErrorState
          title="목록을 불러오지 못했어요"
          onRetry={() => void recipeList.refetch()}
        />
      ) : items.length === 0 ? (
        hasFilters ? (
          <EmptyState
            icon="🔍"
            title={`“${activeFilterLabel}”와 일치하는 레시피가 없어요`}
            description="검색어를 바꾸거나 필터를 초기화해 보세요."
            actions={
              <button type="button" className="btn btn--ghost" onClick={resetFilters}>
                필터 초기화
              </button>
            }
          />
        ) : (
          <EmptyState
            icon="🍳"
            title="아직 등록한 레시피가 없어요"
            description="첫 레시피를 등록해 보관을 시작하세요."
            actions={
              <Link className="btn btn--primary" to="/recipes/new">
                + 새 레시피
              </Link>
            }
          />
        )
      ) : (
        <div className="recipe-grid">
          {items.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}

      {toast && <Toast onDismiss={() => setToast(null)}>{toast}</Toast>}
    </main>
  );
}
