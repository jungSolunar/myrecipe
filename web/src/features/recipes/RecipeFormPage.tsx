import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError } from '../../api';
import type { RecipeWriteRequest } from '../../api/types';
import { Alert, Button, Select, TextField } from '../../components';
import { RECIPE_CATEGORY_OPTIONS } from '../ingredients/constants';
import { IngredientPicker } from './IngredientPicker';
import type { LinkedIngredient } from './IngredientPicker';
import { PhotoUploader } from './PhotoUploader';
import { StepList } from './StepList';
import { useCreateRecipe, useRecipeDetail, useUpdateRecipe } from './useRecipes';
import './recipes.css';

/** US-004 등록 / US-006 수정 공용 폼. 제목 필수 검증, 재료 마스터 연결(US-009). */
export function RecipeFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const { recipeId } = useParams<{ recipeId: string }>();
  const navigate = useNavigate();
  const isEdit = mode === 'edit';

  const detail = useRecipeDetail(isEdit ? recipeId : undefined);
  const createMut = useCreateRecipe();
  const updateMut = useUpdateRecipe();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<LinkedIngredient[]>([]);
  const [steps, setSteps] = useState<string[]>(['']);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [prefilled, setPrefilled] = useState(false);

  // 수정 모드: 기존 값 프리필 (최초 1회)
  useEffect(() => {
    if (!isEdit || prefilled || !detail.data) return;
    const r = detail.data;
    setTitle(r.title);
    setCategory(r.category ?? '');
    setPhotoUrl(r.photo_url ?? null);
    setIngredients(
      r.ingredients.map((ing) => ({
        ingredient_id: ing.ingredient_id,
        name: ing.name ?? ing.ingredient_id,
        quantity: String(ing.quantity),
        unit: ing.unit ?? '',
      })),
    );
    setSteps(r.steps.length ? r.steps : ['']);
    setPrefilled(true);
  }, [isEdit, prefilled, detail.data]);

  const notOwner = isEdit && detail.data?.is_owner === false;
  const saving = createMut.isPending || updateMut.isPending;

  const heading = isEdit ? '레시피 수정' : '새 레시피 등록';
  const submitLabel = isEdit ? '변경 저장' : '저장';

  const invalidQuantity = useMemo(
    () => ingredients.some((i) => i.quantity.trim() === '' || Number.isNaN(Number(i.quantity))),
    [ingredients],
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setTitleError(null);

    if (!title.trim()) {
      setTitleError('제목은 필수입니다.');
      return;
    }
    if (invalidQuantity) {
      setFormError('재료 수량을 숫자로 입력해 주세요.');
      return;
    }

    const body: RecipeWriteRequest = {
      title: title.trim(),
      category: category || null,
      photo_url: photoUrl,
      steps: steps.map((s) => s.trim()).filter(Boolean),
      ingredients: ingredients.map((i) => ({
        ingredient_id: i.ingredient_id,
        quantity: Number(i.quantity),
        unit: i.unit.trim() || null,
      })),
    };

    try {
      const result = isEdit
        ? await updateMut.mutateAsync({ id: recipeId as string, body })
        : await createMut.mutateAsync(body);
      navigate(`/recipes/${result.id}`, {
        replace: true,
        state: { toast: isEdit ? '레시피를 수정했어요.' : '레시피를 등록했어요.' },
      });
    } catch (err) {
      if (err instanceof ApiError && err.code === 'FORBIDDEN') {
        setFormError('본인이 등록한 레시피만 수정할 수 있습니다.');
      } else if (err instanceof ApiError && err.code === 'AUTH_REQUIRED') {
        navigate(`/login?returnTo=${encodeURIComponent(location.pathname)}`);
      } else if (err instanceof ApiError && err.code === 'VALIDATION_ERROR') {
        const t = err.detailFor('title');
        if (t) setTitleError('제목은 필수입니다.');
        else setFormError(err.message);
      } else {
        setFormError('저장에 실패했어요. 다시 시도해 주세요.');
      }
    }
  }

  if (isEdit && detail.isLoading) {
    return (
      <main id="main" className="recipes-container recipes-container--form">
        <div className="state-box" role="status">
          레시피를 불러오는 중…
        </div>
      </main>
    );
  }

  if (notOwner) {
    return (
      <main id="main" className="recipes-container recipes-container--form">
        <h1 style={{ marginBottom: 'var(--s-4)' }}>레시피 수정</h1>
        <Alert variant="error">
          본인이 등록한 레시피만 수정할 수 있습니다.{' '}
          <Link to={`/recipes/${recipeId}`}>레시피로 돌아가기</Link>
        </Alert>
      </main>
    );
  }

  return (
    <main id="main" className="recipes-container recipes-container--form">
      <h1 style={{ marginBottom: 'var(--s-6)' }}>{heading}</h1>

      {formError && (
        <Alert variant="error" role="alert" className="form-card__error">
          {formError}
        </Alert>
      )}

      <form onSubmit={onSubmit} noValidate>
        <div className="form-card">
          <TextField
            label="제목"
            required
            placeholder="예: 기본 계란말이"
            hint="필수 항목입니다."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={titleError ?? undefined}
          />
          <Select
            label="카테고리"
            options={RECIPE_CATEGORY_OPTIONS}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <div className="field">
            <span className="field__label">
              대표 사진 <span className="field__opt">(선택)</span>
            </span>
            <PhotoUploader value={photoUrl} onChange={setPhotoUrl} />
          </div>
        </div>

        <div className="form-card">
          <span className="field__label">재료 (식재료 마스터에서 선택)</span>
          <p className="field__hint" style={{ marginBottom: 'var(--s-3)' }}>
            마스터에 있는 재료를 검색해 선택하고 수량을 입력하세요. 없으면 새로 만들 수 있어요.
          </p>
          <IngredientPicker value={ingredients} onChange={setIngredients} />
        </div>

        <div className="form-card">
          <span className="field__label">조리 단계</span>
          <StepList steps={steps} onChange={setSteps} />
        </div>

        <div className="form-actions">
          <Link
            className="btn btn--ghost"
            to={isEdit && recipeId ? `/recipes/${recipeId}` : '/'}
          >
            취소
          </Link>
          <Button type="submit" loading={saving}>
            {saving ? '저장 중…' : submitLabel}
          </Button>
        </div>
      </form>
    </main>
  );
}
