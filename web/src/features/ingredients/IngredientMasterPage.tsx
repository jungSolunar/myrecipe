import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { ApiError } from '../../api';
import type { Ingredient } from '../../api/types';
import {
  Alert,
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Icon,
  Select,
  TextField,
  Toast,
} from '../../components';
import { CATEGORY_OPTIONS, UNIT_OPTIONS } from './constants';
import { IngredientRow } from './IngredientRow';
import {
  useCreateIngredient,
  useDeleteIngredient,
  useIngredientList,
  useUpdateIngredient,
} from './useIngredients';
import './ingredients.css';

/** US-008 식재료 개인 마스터 관리 (등록/수정/삭제 + 검색 + 3상태). */
export function IngredientMasterPage() {
  const [query, setQuery] = useState('');
  const list = useIngredientList(query ? { q: query } : {});
  const createMut = useCreateIngredient();
  const updateMut = useUpdateIngredient();
  const deleteMut = useDeleteIngredient();

  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0].value);
  const [unit, setUnit] = useState(UNIT_OPTIONS[0].value);
  const [addError, setAddError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Ingredient | null>(null);
  const [deleteImpact, setDeleteImpact] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const items = list.data?.data ?? [];
  const isEmpty = list.isSuccess && items.length === 0;

  async function onAdd(e: FormEvent) {
    e.preventDefault();
    setAddError(null);
    if (!name.trim()) {
      setAddError('재료명을 입력해 주세요.');
      return;
    }
    try {
      await createMut.mutateAsync({ name: name.trim(), category, default_unit: unit });
      setName('');
      setToast(`“${name.trim()}”을(를) 추가했어요.`);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'INGREDIENT_NAME_EXISTS') {
        setAddError(`“${name.trim()}”은(는) 이미 마스터에 있습니다. 이름을 바꿔주세요.`);
      } else if (err instanceof ApiError) {
        setAddError(err.message);
      } else {
        setAddError('추가에 실패했어요. 다시 시도해 주세요.');
      }
    }
  }

  async function onSaveEdit(
    id: string,
    values: { name: string; category: string; default_unit: string },
  ) {
    try {
      await updateMut.mutateAsync({
        id,
        body: {
          name: values.name.trim(),
          category: values.category || null,
          default_unit: values.default_unit || null,
        },
      });
      setEditingId(null);
      setToast('수정했어요.');
    } catch (err) {
      const msg =
        err instanceof ApiError && err.code === 'INGREDIENT_NAME_EXISTS'
          ? '같은 이름의 재료가 이미 있습니다.'
          : '수정에 실패했어요.';
      setToast(msg);
    }
  }

  async function confirmDelete(force: boolean) {
    if (!deleteTarget) return;
    try {
      await deleteMut.mutateAsync({ id: deleteTarget.id, force });
      const name = deleteTarget.name;
      setDeleteTarget(null);
      setDeleteImpact(null);
      setToast(`“${name}”을(를) 삭제했어요.`);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'INGREDIENT_IN_USE') {
        // 참조 중 → 영향 안내 후 강제 삭제 유도 (US-008 AC3)
        const parts = err.details
          .map((d) => {
            const n = d.reason?.match(/referenced_by_(\d+)/)?.[1];
            if (!n) return null;
            if (d.field === 'recipes') return `레시피 ${n}개`;
            if (d.field === 'inventory') return `재고 ${n}건`;
            return `${d.field} ${n}`;
          })
          .filter(Boolean);
        setDeleteImpact(
          parts.length
            ? `${parts.join(', ')}에서 사용 중입니다. 삭제하면 해당 연결이 끊어집니다.`
            : '다른 항목에서 사용 중입니다. 삭제하면 연결이 끊어집니다.',
        );
      } else {
        setToast('삭제에 실패했어요.');
      }
    }
  }

  const caption = useMemo(
    () => (list.isSuccess ? `식재료 마스터 ${items.length}건` : '식재료 마스터'),
    [list.isSuccess, items.length],
  );

  return (
    <main id="main" className="page">
      <h1 className="page__title">식재료 마스터</h1>
      <p className="page__sub">
        내가 자주 쓰는 재료를 미리 등록해 두면 레시피에서 재사용해 오타와 중복을 막을 수 있어요.
        (개인별 마스터)
      </p>

      {/* 재료 추가 (US-008 AC1) */}
      <form className="card" onSubmit={onAdd} noValidate aria-label="새 식재료 추가">
        {addError && (
          <Alert variant="error" className="add-grid__error">
            {addError}
          </Alert>
        )}
        <div className="add-grid" style={{ marginTop: addError ? 'var(--s-3)' : 0 }}>
          <TextField
            label="재료명"
            required
            placeholder="예: 두부"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Select
            label="분류"
            options={CATEGORY_OPTIONS}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <Select
            label="기본 단위"
            options={UNIT_OPTIONS}
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
          />
          <Button type="submit" fullWidth loading={createMut.isPending} className="add-grid__submit">
            추가
          </Button>
        </div>
      </form>

      {/* 마스터 목록 */}
      <div className="card">
        <div className="searchbar">
          <TextField
            label="재료 검색"
            hideLabel
            type="search"
            placeholder="재료명으로 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {list.isLoading ? (
          <p role="status">목록을 불러오는 중…</p>
        ) : list.isError ? (
          <ErrorState
            title="목록을 불러오지 못했어요"
            onRetry={() => void list.refetch()}
          />
        ) : isEmpty ? (
          <EmptyState
            icon={<Icon name="box" size={32} />}
            title={query ? `“${query}”와 일치하는 재료가 없어요` : '아직 등록한 식재료가 없어요'}
            description="위 ‘새 식재료 추가’로 자주 쓰는 재료부터 등록해 보세요."
          />
        ) : (
          <table className="ing-table">
            <caption>{caption}</caption>
            <thead>
              <tr>
                <th scope="col">재료명</th>
                <th scope="col">분류</th>
                <th scope="col">기본 단위</th>
                <th scope="col">등록일</th>
                <th scope="col">
                  <span className="sr-only">작업</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((ing) => (
                <IngredientRow
                  key={ing.id}
                  ingredient={ing}
                  editing={editingId === ing.id}
                  saving={updateMut.isPending && editingId === ing.id}
                  onStartEdit={() => setEditingId(ing.id)}
                  onCancelEdit={() => setEditingId(null)}
                  onSave={(values) => void onSaveEdit(ing.id, values)}
                  onDelete={() => {
                    setDeleteImpact(null);
                    setDeleteTarget(ing);
                  }}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="식재료를 삭제할까요?"
        description={
          deleteTarget ? (
            <>
              <span className="name">“{deleteTarget.name}”</span> 을(를) 마스터에서 삭제합니다.
            </>
          ) : undefined
        }
        confirmLabel={deleteImpact ? '연결 확인 후 삭제' : '삭제'}
        loading={deleteMut.isPending}
        banner={deleteImpact ? <Alert variant="warning">{deleteImpact}</Alert> : undefined}
        onCancel={() => {
          setDeleteTarget(null);
          setDeleteImpact(null);
        }}
        onConfirm={() => void confirmDelete(deleteImpact !== null)}
      />

      {toast && <Toast onDismiss={() => setToast(null)}>{toast}</Toast>}
    </main>
  );
}
