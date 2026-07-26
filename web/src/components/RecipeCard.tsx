import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { RecipeListItem } from '../api/types';
import { Badge } from './Badge';
import { Icon } from './Icon';
import { RatingStars } from './RatingStars';
import './RecipeCard.css';

/**
 * design/components.md: RecipeCard (US-005).
 * [v2.3.0] 계약에 정식 반영된 조리시간(cook_time_minutes)·평점(rating)을 표시한다(공개 정보).
 * thumbnail 없으면 텍스트 플레이스홀더.
 */
export function RecipeCard({ recipe }: { recipe: RecipeListItem }) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = recipe.photo_url && !imgFailed;

  return (
    <article className="rcard">
      <Link className="rcard__link" to={`/recipes/${recipe.id}`}>
        <div className="rcard__thumb">
          {showImage ? (
            <img
              src={recipe.photo_url ?? ''}
              alt={`${recipe.title} 대표 사진`}
              onError={() => setImgFailed(true)}
            />
          ) : (
            <span className="rcard__thumb-empty" aria-hidden="true">
              <Icon name="image" size={24} /> 사진 없음
            </span>
          )}
        </div>
        <div className="rcard__body">
          <h3 className="rcard__title">{recipe.title}</h3>
          <div className="rcard__meta">
            {recipe.category ? <Badge>{recipe.category}</Badge> : null}
            {typeof recipe.ingredient_count === 'number' ? (
              <span>재료 {recipe.ingredient_count}개</span>
            ) : null}
            {typeof recipe.cook_time_minutes === 'number' ? (
              <span className="rcard__cooktime">{recipe.cook_time_minutes}분</span>
            ) : null}
          </div>
          {recipe.rating ? (
            <div className="rcard__rating">
              <RatingStars rating={recipe.rating} />
            </div>
          ) : null}
        </div>
      </Link>
    </article>
  );
}

/** 로딩 스켈레톤 카드 */
export function RecipeCardSkeleton() {
  return (
    <article className="rcard" aria-hidden="true">
      <div className="rcard__thumb skeleton" style={{ borderRadius: 0 }} />
      <div className="rcard__body">
        <div className="skeleton rcard__sk-line" style={{ width: '70%' }} />
        <div className="skeleton rcard__sk-line" style={{ width: '40%' }} />
      </div>
    </article>
  );
}
