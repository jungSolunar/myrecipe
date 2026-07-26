import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError } from '../../api';
import type { RecipeIngredient } from '../../api/types';
import {
  Alert,
  Badge,
  Button,
  ConfirmDialog,
  ErrorState,
  Icon,
  RatingStars,
  Toast,
} from '../../components';
import { useAuth } from '../auth/useAuth';
import { MatchProgress } from './MatchProgress';
import { RatingInput } from './RatingInput';
import { useDeleteRating, useDeleteRecipe, useRecipeDetail, useSetRating } from './useRecipes';
import './recipes.css';

function statusBadge(status: RecipeIngredient['status']) {
  if (status === 'sufficient') return <Badge tone="success">보유</Badge>;
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
  const setRatingMut = useSetRating(recipeId);
  const deleteRatingMut = useDeleteRating(recipeId);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [heroFailed, setHeroFailed] = useState(false);
  const [myScore, setMyScore] = useState(0);
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [ratingSaved, setRatingSaved] = useState(false);
  const [cooking, setCooking] = useState(false);

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
  const isAuthed = authStatus === 'authed';

  // [US-020] 매칭 진행바 — 로그인 + 재고 대조 결과가 있을 때만(비로그인/재고0은 숨김, US-012 게이트 승계).
  const availability = recipe.ingredient_availability;
  const totalIng = recipe.ingredients.length;
  const missingCount = availability?.missing_count ?? 0;
  const showMatch = isAuthed && Boolean(availability) && totalIng > 0;
  const missingIds = availability?.missing_ingredients?.map((m) => m.ingredient_id) ?? [];

  async function onSaveRating() {
    if (myScore < 1) {
      setRatingError('별점을 선택해 주세요.');
      return;
    }
    setRatingError(null);
    setRatingSaved(false);
    try {
      const res = await setRatingMut.mutateAsync(myScore);
      setMyScore(res.my_score ?? myScore);
      setRatingSaved(true);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'AUTH_REQUIRED') {
        navigate(`/login?returnTo=${encodeURIComponent(`/recipes/${recipeId}`)}`);
      } else {
        setRatingError('평점 저장에 실패했어요. 다시 시도해 주세요.');
      }
    }
  }

  async function onClearRating() {
    setRatingError(null);
    try {
      await deleteRatingMut.mutateAsync();
      setMyScore(0);
      setRatingSaved(false);
    } catch {
      setRatingError('평점 취소에 실패했어요.');
    }
  }

  function goAddMissing() {
    navigate(`/inventory?wizard=1&prefill=${encodeURIComponent(missingIds.join(','))}`);
  }

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
    <main id="main" className="recipes-container recipe-detail">
      <p className="recipe-crumb">
        <Link to="/">레시피</Link> › {recipe.title}
      </p>

      {/* §3.3 상세형: 좌 미디어+제목+조리 순서 / 우 sticky 요약·액션 패널 */}
      <div className="recipe-detail__grid">
        <div className="recipe-detail__main">
          <div className="recipe-hero">
            {showHeroImage ? (
              <img
                src={recipe.photo_url ?? ''}
                alt={`${recipe.title} 완성 사진`}
                onError={() => setHeroFailed(true)}
              />
            ) : (
              <span className="recipe-hero__empty" aria-hidden="true">
                <Icon name="image" size={32} /> 사진 없음
              </span>
            )}
          </div>

          <h1 className="recipe-detail__title">{recipe.title}</h1>
          <div className="recipe-detail__meta">
            {recipe.category ? <Badge>{recipe.category}</Badge> : null}
            <Badge>재료 {recipe.ingredients.length}개</Badge>
            {typeof recipe.cook_time_minutes === 'number' ? (
              <span className="recipe-detail__cooktime">{recipe.cook_time_minutes}분</span>
            ) : null}
            {recipe.rating ? <RatingStars rating={recipe.rating} /> : null}
          </div>

          {recipe.description ? <p className="recipe-desc">{recipe.description}</p> : null}

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

          {/* [US-015] 평점 카드 — 평균은 공개, 입력은 로그인 필수 */}
          <section className="recipe-section rating-card" aria-labelledby="rating-h">
            <h2 id="rating-h">평점</h2>
            <div className="rating-card__avg">
              <RatingStars rating={recipe.rating} size={18} />
            </div>
            {isAuthed ? (
              <div className="rating-card__input">
                <RatingInput value={myScore} onChange={setMyScore} disabled={setRatingMut.isPending} />
                <div className="rating-card__actions">
                  <Button
                    variant="ghost"
                    onClick={() => void onSaveRating()}
                    loading={setRatingMut.isPending}
                  >
                    평점 저장
                  </Button>
                  {myScore > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void onClearRating()}
                      loading={deleteRatingMut.isPending}
                    >
                      평점 취소
                    </Button>
                  )}
                </div>
                <p className="note">1인 1평점 · 재저장 시 갱신됩니다.</p>
                {ratingSaved && !ratingError && (
                  <Alert variant="success">평점을 저장했어요.</Alert>
                )}
                {ratingError && <Alert variant="error">{ratingError}</Alert>}
              </div>
            ) : (
              <p className="note">
                별점을 남기려면{' '}
                <Link to={`/login?returnTo=${encodeURIComponent(`/recipes/${recipe.id}`)}`}>
                  로그인
                </Link>
                이 필요해요.
              </p>
            )}
          </section>
        </div>

        <aside className="recipe-detail__side">
          {isOwner && (
            <div className="recipe-side-card owner-actions">
              <Link className="btn btn--ghost" to={`/recipes/${recipe.id}/edit`}>
                수정
              </Link>
              <button
                type="button"
                className="btn btn--danger"
                onClick={() => {
                  setDeleteError(null);
                  setConfirmOpen(true);
                }}
              >
                삭제
              </button>
            </div>
          )}

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
            {authStatus === 'guest' && (
              <p className="note" style={{ marginTop: 'var(--s-4)' }}>
                로그인하면 내 재고 대비 부족한 재료를 확인할 수 있어요.
              </p>
            )}
          </section>

          {/* [US-019/020] 요리 준비 — 로그인 회원. 매칭 진행바 + 요리 시작 + 부족 재료 추가 */}
          {isAuthed && (
            <div className="recipe-side-card cook-prep">
              {showMatch && (
                <>
                  <h2 className="cook-prep__title">재료 준비 상태</h2>
                  <MatchProgress total={totalIng} missing={missingCount} />
                </>
              )}
              {cooking && (
                <Alert variant="success">요리를 시작했어요. 아래 조리 단계를 따라 진행하세요.</Alert>
              )}
              <div className="cook-prep__actions">
                <Button onClick={() => setCooking(true)}>요리 시작</Button>
                {missingCount > 0 && (
                  <Button variant="ghost" onClick={goAddMissing}>
                    부족한 재료 추가하기
                  </Button>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>

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
