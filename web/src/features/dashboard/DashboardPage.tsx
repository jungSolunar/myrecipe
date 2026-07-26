import { Link } from 'react-router-dom';
import type { RecipeListItem } from '../../api/types';
import type { InventoryItem } from '../../api/inventory';
import { EmptyState, ErrorState, Icon, RatingStars } from '../../components';
import { ExpiryBadge } from '../inventory/ExpiryBadge';
import { useDashboard } from './useDashboard';
import './dashboard.css';

function RecipePanelRow({ recipe, showMatch }: { recipe: RecipeListItem; showMatch?: boolean }) {
  return (
    <Link className="dash-panelrow" to={`/recipes/${recipe.id}`}>
      <span className="dash-pname">{recipe.title}</span>
      <span className="dash-pmeta">
        {typeof recipe.cook_time_minutes === 'number' && <span>{recipe.cook_time_minutes}분</span>}
        {recipe.rating && <RatingStars rating={recipe.rating} />}
        {showMatch && (
          <span className="badge badge--success" aria-label="지금 만들 수 있음">
            <Icon name="check" size={12} /> 지금 가능
          </span>
        )}
      </span>
    </Link>
  );
}

function ExpiringRow({ item }: { item: InventoryItem }) {
  return (
    <div className="dash-panelrow">
      <span className="dash-pname">{item.ingredient_name ?? item.ingredient_id}</span>
      <span className="dash-pmeta">
        {item.storage_location && <span className="inv-pill">{item.storage_location}</span>}
        <ExpiryBadge expiresAt={item.expires_at} />
      </span>
    </div>
  );
}

/** [US-018] 홈 대시보드 — KPI 4종 + 패널 3종. 로딩/빈/오류 3상태. */
export function DashboardPage() {
  const dash = useDashboard();

  if (dash.isLoading) {
    return (
      <main id="main" className="dash-page">
        <h1 className="dash-title">홈</h1>
        <div className="dash-kpigrid" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <div className="card dash-kpicard" key={i}>
              <div className="dash-skel" style={{ width: '50%' }} />
              <div className="dash-skel dash-skel--lg" />
            </div>
          ))}
        </div>
      </main>
    );
  }

  if (dash.isError) {
    return (
      <main id="main" className="dash-page">
        <h1 className="dash-title">홈</h1>
        <ErrorState title="대시보드를 불러오지 못했어요" onRetry={() => void dash.refetch()} />
      </main>
    );
  }

  const d = dash.data;
  if (!d) return null;

  const isFirstVisit =
    d.registered_recipe_count === 0 && d.inventory_ingredient_count === 0;

  if (isFirstVisit) {
    return (
      <main id="main" className="dash-page">
        <h1 className="dash-title">홈</h1>
        <EmptyState
          icon={<Icon name="cooking" size={32} />}
          title="레시피와 재고를 등록해 현황을 채워보세요"
          description="레시피를 등록하고 재고를 추가하면 지금 만들 수 있는 요리와 임박 재료를 한눈에 볼 수 있어요."
          actions={
            <>
              <Link className="btn btn--primary" to="/recipes/new">
                + 새 레시피
              </Link>
              <Link className="btn btn--ghost" to="/inventory">
                재고 등록
              </Link>
            </>
          }
        />
      </main>
    );
  }

  return (
    <main id="main" className="dash-page">
      <h1 className="dash-title">홈</h1>
      <p className="dash-sub">내 레시피와 재고 현황을 한눈에 확인하세요.</p>

      {/* KPI 4종 */}
      <section className="dash-kpigrid" aria-label="요약 지표">
        <div className="card dash-kpicard">
          <span className="dash-klabel">등록 레시피</span>
          <span className="dash-kvalue">
            {d.registered_recipe_count}
            <span className="dash-kunit">개</span>
          </span>
          {d.category_distribution && d.category_distribution.length > 0 && (
            <span className="dash-kfoot">
              {d.category_distribution
                .slice(0, 3)
                .map((c) => `${c.category ?? '미분류'} ${c.count}`)
                .join(' · ')}
            </span>
          )}
        </div>
        <div className="card dash-kpicard">
          <span className="dash-klabel">지금 만들 수 있는 레시피</span>
          <span className="dash-kvalue dash-kvalue--success">
            {d.makeable_recipe_count}
            <span className="dash-kunit">개</span>
          </span>
          <span className="dash-kfoot">매칭률 100%</span>
        </div>
        <div className="card dash-kpicard">
          <span className="dash-klabel">내 재고</span>
          <span className="dash-kvalue">
            {d.inventory_ingredient_count}
            <span className="dash-kunit">종</span>
          </span>
        </div>
        <div className="card dash-kpicard">
          <span className="dash-klabel">임박 재료 (D-3)</span>
          <span className="dash-kvalue dash-kvalue--warning">
            {d.expiring_soon_count}
            <span className="dash-kunit">종</span>
          </span>
          <span className="dash-kfoot">유통기한 D-day ≤ 3</span>
        </div>
      </section>

      {/* 패널 3종 */}
      <div className="dash-grid">
        <section className="card dash-panel" aria-label="지금 만들 수 있는 레시피">
          <div className="dash-panelhead">지금 만들 수 있는 레시피</div>
          {d.makeable_recipes.length === 0 ? (
            <p className="dash-panelempty">
              아직 매칭률 100% 레시피가 없어요. 재고를 더 등록해 보세요.
            </p>
          ) : (
            d.makeable_recipes.map((r) => <RecipePanelRow key={r.id} recipe={r} showMatch />)
          )}
        </section>

        <div className="dash-panelstack">
          <section className="card dash-panel" aria-label="유통기한 임박">
            <div className="dash-panelhead">유통기한 임박</div>
            {d.expiring_ingredients.length === 0 ? (
              <p className="dash-panelempty">임박한 재료가 없어요.</p>
            ) : (
              d.expiring_ingredients.map((it) => <ExpiringRow key={it.id} item={it} />)
            )}
          </section>

          <section className="card dash-panel" aria-label="최근 추가한 레시피">
            <div className="dash-panelhead">최근 추가한 레시피</div>
            {d.recent_recipes.length === 0 ? (
              <p className="dash-panelempty">최근 추가한 레시피가 없어요.</p>
            ) : (
              d.recent_recipes.map((r) => <RecipePanelRow key={r.id} recipe={r} />)
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
