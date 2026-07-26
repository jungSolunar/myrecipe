import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Alert,
  EmptyState,
  ErrorState,
  GuestBanner,
  Icon,
  RecipeCard,
  RecipeCardSkeleton,
  Toast,
} from '../../components';
import { useAuth } from '../auth/useAuth';
import { useIngredientList } from '../ingredients/useIngredients';
import { SearchFilterBar } from './SearchFilterBar';
import type { RecipeFilters } from './SearchFilterBar';
import type { RecommendDisabledReason } from './RecommendFilterToggle';
import { RecommendRecipeCard } from './RecommendRecipeCard';
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
    available: params.get('available') === '1',
    sort: params.get('sort') ?? '',
  };

  // 재료 필터 옵션: 로그인 회원만 개인 마스터 조회 가능(계약상 /ingredients 는 인증 필요)
  const ingredientList = useIngredientList();
  const ingredientOptions =
    status === 'authed' ? (ingredientList.data?.data ?? []) : [];

  // [US-013] 추천 토글 비활성 사유 판정(클라이언트, 추가 서버 호출 없음).
  // 비로그인 → guest. 로그인이지만 보유 재고(마스터) 0건 → no-inventory.
  const availableDisabledReason: RecommendDisabledReason =
    status !== 'authed'
      ? 'guest'
      : ingredientList.isSuccess && ingredientOptions.length === 0
        ? 'no-inventory'
        : null;
  // 비활성 상태에서는 필터가 켜져 있어도 추천 모드로 동작하지 않는다(기본 목록 유지).
  const recommendActive = filters.available && availableDisabledReason === null;

  const recipeList = useRecipeList({
    q: filters.q || undefined,
    category: filters.category || undefined,
    ingredient_id: filters.ingredientId ? [filters.ingredientId] : undefined,
    // 추천 모드에서만 available_only + 부족 적은 순 정렬을 전달(off 면 undefined → 기존 요청과 동일).
    available_only: recommendActive ? true : undefined,
    // 추천 모드는 부족 적은 순 고정, 그 외에는 사용자 선택 정렬(US-014/015). '' 이면 undefined(최신순).
    sort: recommendActive
      ? 'missing_asc'
      : (filters.sort as 'cook_time_asc' | 'rating_desc') || undefined,
  });

  const items = recipeList.data?.data ?? [];
  const hasFilters = Boolean(filters.q || filters.category || filters.ingredientId);

  function applyFilters(next: RecipeFilters) {
    const sp = new URLSearchParams();
    if (next.q) sp.set('q', next.q);
    if (next.category) sp.set('category', next.category);
    if (next.ingredientId) sp.set('ingredient_id', next.ingredientId);
    if (next.available) sp.set('available', '1');
    if (next.sort) sp.set('sort', next.sort);
    setParams(sp);
  }

  function resetFilters() {
    setParams(new URLSearchParams());
  }

  /** [US-013] 추천 필터만 끄기(다른 필터는 유지). */
  function turnOffRecommend() {
    applyFilters({ ...filters, available: false });
  }

  // [US-013] 추천 모드 결과 분포 → 상태 안내(F: 모두 충족 / G: 근접만).
  const missingCounts = items.map((r) => r.missing_count ?? 0);
  const allSufficient =
    recommendActive && items.length > 0 && missingCounts.every((n) => n === 0);
  const noneSufficient =
    recommendActive && items.length > 0 && missingCounts.every((n) => n > 0);

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
        availableDisabledReason={availableDisabledReason}
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
        recommendActive ? (
          <EmptyState
            icon={<Icon name="carrot" size={32} />}
            title="보유 재료로 만들 수 있는 레시피가 아직 없어요"
            description="재고를 더 등록하거나, 필터를 꺼서 전체 레시피를 보세요."
            actions={
              <>
                <button type="button" className="btn btn--ghost" onClick={turnOffRecommend}>
                  필터 끄기
                </button>
                <Link className="btn btn--primary" to="/inventory">
                  재고 등록
                </Link>
              </>
            }
          />
        ) : hasFilters ? (
          <EmptyState
            icon={<Icon name="search" size={32} />}
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
            icon={<Icon name="cooking" size={32} />}
            title="아직 등록한 레시피가 없어요"
            description="첫 레시피를 등록해 보관을 시작하세요."
            actions={
              <Link className="btn btn--primary" to="/recipes/new">
                + 새 레시피
              </Link>
            }
          />
        )
      ) : recommendActive ? (
        <>
          {allSufficient && (
            <Alert variant="success" className="rec-notice">
              지금 바로 만들 수 있는 레시피 {items.length}개예요.
            </Alert>
          )}
          {noneSufficient && (
            <Alert variant="info" className="rec-notice" icon={<Icon name="bulb" size={16} />}>
              딱 맞는 레시피는 없지만, 재료 1~2개만 더 있으면 만들 수 있어요.
            </Alert>
          )}
          <div className="recipe-grid">
            {items.map((recipe) => (
              <RecommendRecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        </>
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
