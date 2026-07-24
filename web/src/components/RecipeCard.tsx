import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { RecipeListItem } from '../api/types';
import { Badge } from './Badge';
import './RecipeCard.css';

/**
 * design/components.md: RecipeCard (US-005).
 * 계약(RecipeListItem)에 없는 조리시간(cookTime)은 표시하지 않는다 — 계약 준수.
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
            <span aria-hidden="true">🍳 사진 없음</span>
          )}
        </div>
        <div className="rcard__body">
          <h3 className="rcard__title">{recipe.title}</h3>
          <div className="rcard__meta">
            {recipe.category ? <Badge>{recipe.category}</Badge> : null}
            {typeof recipe.ingredient_count === 'number' ? (
              <span>재료 {recipe.ingredient_count}개</span>
            ) : null}
          </div>
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
