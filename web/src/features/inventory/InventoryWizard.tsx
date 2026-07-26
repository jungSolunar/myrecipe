import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { recipesApi } from '../../api';
import type { Ingredient, RecipeListItem, StorageLocation } from '../../api/types';
import { Alert, Button, Icon, Select, TextField } from '../../components';
import type { SelectOption } from '../../components';
import { STORAGE_LOCATION_OPTIONS } from '../ingredients/constants';
import { useCreateInventory } from './useInventory';

export interface InventoryWizardProps {
  masterOptions: Ingredient[];
  /** [US-019 연계] 부족 재료 프리필 (첫 재료 id). */
  prefillIngredientId?: string;
  onClose: () => void;
  onCreated: (name: string) => void;
}

const STEPS = ['재료 선택', '수량·단위', '유통기한·보관위치', '완료'];

/**
 * [US-022] 재고 추가 다단계 위저드. 완료 후 "이제 이런 레시피를 만들 수 있어요"로
 * 새로 매칭률 100% 가 된 레시피를 안내한다(없으면 추천 섹션 생략).
 */
export function InventoryWizard({
  masterOptions,
  prefillIngredientId,
  onClose,
  onCreated,
}: InventoryWizardProps) {
  const createMut = useCreateInventory();
  const [step, setStep] = useState(1);
  const [ingredientId, setIngredientId] = useState(prefillIngredientId ?? '');
  const [qty, setQty] = useState('');
  const [expiry, setExpiry] = useState('');
  const [storage, setStorage] = useState('');
  const [error, setError] = useState<string | null>(null);

  // 추가 전 매칭 100% 레시피 id 기준선(새로 가능해진 레시피 판정용)
  const [baselineIds, setBaselineIds] = useState<string[] | null>(null);
  const [newlyMakeable, setNewlyMakeable] = useState<RecipeListItem[]>([]);

  useEffect(() => {
    let alive = true;
    recipesApi
      .listRecipes({ available_only: true })
      .then((res) => {
        if (alive) setBaselineIds(res.data.map((r) => r.id));
      })
      .catch(() => {
        if (alive) setBaselineIds([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  const selected = useMemo(
    () => masterOptions.find((m) => m.id === ingredientId),
    [masterOptions, ingredientId],
  );
  const unit = selected?.default_unit ?? '';

  const options: SelectOption[] = useMemo(
    () => [
      { value: '', label: '마스터에서 선택…' },
      ...masterOptions.map((m) => ({ value: m.id, label: m.name })),
    ],
    [masterOptions],
  );

  function next() {
    setError(null);
    if (step === 1 && !ingredientId) {
      setError('재료를 선택해 주세요.');
      return;
    }
    if (step === 2) {
      const n = Number(qty);
      if (qty.trim() === '' || Number.isNaN(n) || n < 0) {
        setError('0 이상의 수량을 입력해 주세요.');
        return;
      }
    }
    setStep((s) => Math.min(4, s + 1));
  }

  function back() {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
  }

  async function finish() {
    setError(null);
    try {
      await createMut.mutateAsync({
        ingredient_id: ingredientId,
        quantity: Number(qty),
        unit: unit || null,
        expires_at: expiry || null,
        storage_location: (storage || null) as StorageLocation | null,
      });
      onCreated(selected?.name ?? '재료');
      // 새로 매칭 100% 가 된 레시피 계산
      try {
        const after = await recipesApi.listRecipes({ available_only: true });
        const before = new Set(baselineIds ?? []);
        setNewlyMakeable(after.data.filter((r) => !before.has(r.id)));
      } catch {
        setNewlyMakeable([]);
      }
      setStep(4);
    } catch {
      setError('재고 추가에 실패했어요. 다시 시도해 주세요.');
    }
  }

  return (
    <section className="inv-card inv-wizard" aria-label="재고 추가 위저드">
      <div className="inv-wizard__head">
        <p className="inv-card__title">단계별 재고 추가</p>
        <Button variant="ghost" size="sm" onClick={onClose}>
          닫기
        </Button>
      </div>

      {/* 스텝퍼 */}
      <ol className="stepper" aria-label="진행 단계">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const state = n < step ? 'done' : n === step ? 'active' : 'todo';
          return (
            <li key={label} className={`stepnode stepnode--${state}`} aria-current={n === step ? 'step' : undefined}>
              <span className="stepdot">{state === 'done' ? <Icon name="check" size={14} /> : n}</span>
              <span className="steplabel">{label}</span>
            </li>
          );
        })}
      </ol>

      {error && <Alert variant="error">{error}</Alert>}

      {step === 1 && (
        <Select
          label="재료"
          options={options}
          value={ingredientId}
          onChange={(e) => setIngredientId(e.target.value)}
        />
      )}

      {step === 2 && (
        <div className="inv-wizard__row">
          <TextField
            label="수량"
            required
            type="number"
            inputMode="decimal"
            min={0}
            step="0.1"
            placeholder="예: 3"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
          />
          <TextField label="단위" value={unit} readOnly hint="마스터 기본 단위" placeholder="—" />
        </div>
      )}

      {step === 3 && (
        <div className="inv-wizard__row">
          <TextField
            label="유통기한"
            optional
            type="date"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
          />
          <Select
            label="보관위치"
            options={STORAGE_LOCATION_OPTIONS}
            value={storage}
            onChange={(e) => setStorage(e.target.value)}
          />
        </div>
      )}

      {step === 4 && (
        <div className="inv-wizard__done">
          <span className="inv-wizard__check" aria-hidden="true">
            <Icon name="check" size={22} />
          </span>
          <p className="inv-wizard__done-title">
            “{selected?.name ?? '재료'}”을(를) 재고에 추가했어요.
          </p>
          {newlyMakeable.length > 0 ? (
            <div className="inv-wizard__reco">
              <p className="inv-wizard__reco-title">이제 이런 레시피를 만들 수 있어요</p>
              <ul className="inv-wizard__reco-list">
                {newlyMakeable.map((r) => (
                  <li key={r.id}>
                    <Link to={`/recipes/${r.id}`}>{r.title}</Link>
                    {typeof r.cook_time_minutes === 'number' && (
                      <span className="inv-wizard__reco-meta"> · {r.cook_time_minutes}분</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="note">새로 만들 수 있게 된 레시피는 아직 없어요.</p>
          )}
        </div>
      )}

      {/* 하단 액션 */}
      <div className="wizfoot">
        {step > 1 && step < 4 ? (
          <Button variant="ghost" onClick={back}>
            이전
          </Button>
        ) : (
          <span />
        )}
        {step < 3 && <Button onClick={next}>다음</Button>}
        {step === 3 && (
          <Button onClick={() => void finish()} loading={createMut.isPending}>
            재고 추가
          </Button>
        )}
        {step === 4 && <Button onClick={onClose}>완료</Button>}
      </div>
    </section>
  );
}
