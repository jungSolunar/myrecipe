import { RecipeCard } from '../../components';
import type { RecipeListItem } from '../../api/types';
import './recommend.css';

/**
 * US-013 부족/충족 배지. design/components-recommendation.md 2.2.
 * - 부족 0: success 톤 "✓ 지금 만들 수 있어요"
 * - 부족 1+: warning 톤 "부족 N개"
 * 색 + 텍스트 병기, aria-label 로 의미 명시(색에만 의존하지 않음).
 * Badge 컴포넌트는 aria-label 을 받지 않으므로 동일한 .badge 토큰 스타일을 재사용해 직접 렌더한다.
 */
export function MissingBadge({ missingCount }: { missingCount: number }) {
  if (missingCount <= 0) {
    return (
      <span
        className="badge badge--success"
        aria-label="모든 재료 보유, 지금 만들 수 있음"
      >
        ✓ 지금 만들 수 있어요
      </span>
    );
  }
  return (
    <span className="badge badge--warning" aria-label={`부족한 재료 ${missingCount}개`}>
      부족 {missingCount}개
    </span>
  );
}

/**
 * 추천 모드용 카드. 기존 RecipeCard 를 수정하지 않고 배지를 오버레이로 합성(composition)한다.
 * missing_count 가 계약상 optional/nullable 이므로 값이 있을 때만 배지를 노출한다.
 */
export function RecommendRecipeCard({ recipe }: { recipe: RecipeListItem }) {
  const missing = recipe.missing_count;
  return (
    <div className="rec-card">
      {typeof missing === 'number' && (
        <div className="rec-card__badge">
          <MissingBadge missingCount={missing} />
        </div>
      )}
      <RecipeCard recipe={recipe} />
    </div>
  );
}
