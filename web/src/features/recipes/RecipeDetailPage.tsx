import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError } from '../../api';
import type { RecipeIngredient } from '../../api/types';
import { Alert, Badge, ConfirmDialog, ErrorState, Toast } from '../../components';
import { useAuth } from '../auth/useAuth';
import { useDeleteRecipe, useRecipeDetail } from './useRecipes';
import './recipes.css';

function statusBadge(status: RecipeIngredient['status']) {
  if (status === 'sufficient') return <Badge tone="success">✓ 보유</Badge>;
  if (status === 'insufficient' || status === 'missing') return <Badge tone="warning">부족</Badge>;
  return null;
}

/** US-005 상세, US-006/007 소유자 액션 진입, US-007 삭제 확인. */
export function RecipeDetailPage() {
  const { recipeId } = useParams<{ recipeId: string }>();
  const navigate = useNavigate();
  const { status: authStatus } = useAuth();
  const detail = useRecipeDetail(recipeId);
  const deleteMut = useDeleteRecipe();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [heroFailed, setHeroFailed] = useState(false);

  if (detail.isLoading) {
    return (
      <main id="main" className="recipes-container recipes-container--narrow">
        <div className="state-box" role="status">
          본문을 불러오는 중…
        </div>
      </main>
    );
  }

  if (detail.isError) {
    const err = detail.error;
    if (err instanceof ApiError && err.status === 404) {
      return (
        <main id="main" className="recipes-container recipes-container--narrow">
          <div className="state-box">
            <h2 className="state-box__title">레시피를 찾을 수 없어요</h2>
            <p>이미 삭제되었거나 잘못된 주소일 수 있습니다.</p>
            <div className="state-box__actions">
              <Link className="btn btn--primary" to="/">
                목록으로
              </Link>
            </div>
          </div>
        </main>
      );
    }
    return (
      <main id="main" className="recipes-container recipes-container--narrow">
        <ErrorState
          title="레시피를 불러오지 못했어요"
          onRetry={() => void detail.refetch()}
        />
      </main>
    );
  }

  const recipe = detail.data;
  if (!recipe) return null;
  const isOwner = recipe.is_owner === true;
  const showHeroImage = recipe.photo_url && !heroFailed;

  const onDelete = async () => {
    if (!recipeId) return;
    setDeleteError(null);
    try {
      await deleteMut.mutateAsync(recipeId);
      navigate('/', { replace: true, state: { toast: `“${recipe.title}”를 삭제했어요.` } });
    } catch (err) {
      if (err instanceof ApiError && err.code === 'FORBIDDEN') {
        setDeleteError('본인이 등록한 레시피만 삭제할 수 있습니다.');
      } else if (err instanceof ApiError && err.code === 'AUTH_REQUIRED') {
        navigate(`/login?returnTo=${encodeURIComponent(`/recipes/${recipeId}`)}`);
      } else {
        setDeleteError('삭제에 실패했어요. 다시 시도해 주세요.');
      }
    }
  };

  return (
    <main id="main" className="recipes-container recipes-container--narrow">
      <p className="recipe-crumb">
        <Link to="/">레시피</Link> › {recipe.title}
      </p>

      <div className="recipe-hero">
        {showHeroImage ? (
          <img
            src={recipe.photo_url ?? ''}
            alt={`${recipe.title} 완성 사진`}
            onError={() => setHeroFailed(true)}
          />
        ) : (
          <span aria-hidden="true">🍳 사진 없음</span>
        )}
      </div>

      <h1 className="recipe-detail__title">{recipe.title}</h1>
      <div className="recipe-detail__meta">
        {recipe.category ? <Badge>{recipe.category}</Badge> : null}
        <Badge>재료 {recipe.ingredients.length}개</Badge>
      </div>

      {isOwner && (
        <div className="owner-actions">
          <Link className="btn btn--ghost" to={`/recipes/${recipe.id}/edit`}>
            ✏ 수정
          </Link>
          <button
            type="button"
            className="btn btn--danger"
            onClick={() => {
              setDeleteError(null);
              setConfirmOpen(true);
            }}
          >
            🗑 삭제
          </button>
        </div>
      )}

      {recipe.description ? <p className="recipe-desc">{recipe.description}</p> : null}

      <section className="recipe-section" aria-labelledby="ing-h">
        <h2 id="ing-h">재료</h2>
        {recipe.ingredients.length === 0 ? (
          <p style={{ color: 'var(--c-n-600)' }}>등록된 재료가 없어요.</p>
        ) : (
          <ul className="ing-list">
            {recipe.ingredients.map((ing) => (
              <li key={ing.ingredient_id}>
                <span className="name">{ing.name ?? ing.ingredient_id}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-2)' }}>
                  {statusBadge(ing.status)}
                  <span className="qty">
                    {ing.quantity}
                    {ing.unit ?? ''}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
        {/* US-012(Should) placeholder: 재고 대조는 확장 범위 */}
        {authStatus === 'guest' && (
          <p className="note" style={{ marginTop: 'var(--s-4)' }}>
            로그인하면 내 재고 대비 부족한 재료를 확인할 수 있어요. (확장 예정)
          </p>
        )}
      </section>

      <section className="recipe-section" aria-labelledby="step-h">
        <h2 id="step-h">조리 단계</h2>
        {recipe.steps.length === 0 ? (
          <p style={{ color: 'var(--c-n-600)' }}>등록된 조리 단계가 없어요.</p>
        ) : (
          <ol className="steps">
            {recipe.steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        )}
      </section>

      <ConfirmDialog
        open={confirmOpen}
        title="레시피를 삭제할까요?"
        description={
          <>
            <span className="name">“{recipe.title}”</span> 레시피가 목록에서 영구 삭제됩니다. 이
            작업은 되돌릴 수 없습니다.
          </>
        }
        loading={deleteMut.isPending}
        banner={deleteError ? <Alert variant="error">{deleteError}</Alert> : undefined}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => void onDelete()}
      />

      {deleteError && !confirmOpen && (
        <Toast onDismiss={() => setDeleteError(null)}>{deleteError}</Toast>
      )}
    </main>
  );
}
