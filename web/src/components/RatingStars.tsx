import type { RecipeRating } from '../api/types';
import './RatingStars.css';

/** 별 1개 라인 SVG (채움/빈). design-notes: 채움=status-warning, 빈=gray-8 stroke. */
function Star({ filled, size }: { filled: boolean; size: number }) {
  return (
    <svg
      className="star"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={
        filled
          ? { fill: 'var(--status-warning)', stroke: 'none' }
          : { fill: 'none', stroke: 'var(--gray-8)', strokeWidth: 1.6 }
      }
    >
      <path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.2l5.9-.9L12 3Z" />
    </svg>
  );
}

export interface RatingStarsProps {
  rating?: RecipeRating;
  size?: number;
}

/**
 * [US-015] 평균 평점 표시. 색만으로 전달하지 않도록 별 아이콘 옆에 숫자 평균 + 평가 수를 항상 병기한다.
 * 별 묶음은 aria-hidden, 수치 텍스트가 접근성 소스. 평가 0건은 "평가 없음".
 */
export function RatingStars({ rating, size = 14 }: RatingStarsProps) {
  const average = rating?.average ?? null;
  const count = rating?.count ?? 0;

  if (average === null || count === 0) {
    return (
      <span className="rating">
        <span className="ratingnone">평가 없음</span>
      </span>
    );
  }

  const filled = Math.round(average);
  return (
    <span className="rating">
      <span className="stars" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star key={n} filled={n <= filled} size={size} />
        ))}
      </span>
      <span className="ratingval">{average.toFixed(1)}</span>
      <span className="ratingcount">평가 {count}명</span>
    </span>
  );
}
