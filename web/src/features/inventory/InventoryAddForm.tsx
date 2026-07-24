import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { Ingredient } from '../../api/types';
import type { InventoryWriteRequest } from '../../api/inventory';
import { Alert, Button, Select, TextField } from '../../components';
import type { SelectOption } from '../../components';

export interface InventoryAddFormProps {
  masterOptions: Ingredient[];
  /** 이미 재고에 있는 재료 id (중복 안내용). */
  existingIngredientIds: string[];
  submitting: boolean;
  /** 서버/네트워크 에러 메시지 (부모가 관리). */
  formError?: string | null;
  /** 성공 시 resolve, 실패 시 reject → 실패하면 폼 값을 유지한다. */
  onSubmit: (body: InventoryWriteRequest) => Promise<void>;
}

/** US-011 AC1 재고 추가 폼 (마스터 선택 + 수량 + 유통기한). */
export function InventoryAddForm({
  masterOptions,
  existingIngredientIds,
  submitting,
  formError,
  onSubmit,
}: InventoryAddFormProps) {
  const [ingredientId, setIngredientId] = useState('');
  const [qty, setQty] = useState('');
  const [expiry, setExpiry] = useState('');
  const [ingError, setIngError] = useState<string | null>(null);
  const [qtyError, setQtyError] = useState<string | null>(null);

  const selected = useMemo(
    () => masterOptions.find((m) => m.id === ingredientId),
    [masterOptions, ingredientId],
  );
  const unit = selected?.default_unit ?? '';
  const isDuplicate = ingredientId !== '' && existingIngredientIds.includes(ingredientId);

  const options: SelectOption[] = useMemo(
    () => [
      { value: '', label: '마스터에서 선택…' },
      ...masterOptions.map((m) => {
        const meta = [m.category, m.default_unit].filter(Boolean).join(' · ');
        return { value: m.id, label: meta ? `${m.name} (${meta})` : m.name };
      }),
    ],
    [masterOptions],
  );

  // 상태 C — 마스터에 재료가 없음: 추가 대신 마스터 등록 안내.
  if (masterOptions.length === 0) {
    return (
      <div className="inv-card">
        <Alert variant="info">
          재고에 추가하려면 먼저 식재료 마스터에 재료가 있어야 해요.{' '}
          <Link to="/ingredients">마스터에서 등록하기 →</Link>
        </Alert>
      </div>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIngError(null);
    setQtyError(null);

    let valid = true;
    if (!ingredientId) {
      setIngError('재료를 선택해 주세요.');
      valid = false;
    }
    const quantity = Number(qty);
    if (qty.trim() === '') {
      setQtyError('수량을 입력해 주세요.');
      valid = false;
    } else if (Number.isNaN(quantity) || quantity < 0) {
      setQtyError('0 이상의 수량을 입력해 주세요.');
      valid = false;
    }
    if (!valid) return;

    try {
      await onSubmit({
        ingredient_id: ingredientId,
        quantity,
        unit: unit || null,
        expires_at: expiry || null,
      });
      setIngredientId('');
      setQty('');
      setExpiry('');
    } catch {
      // 실패 메시지는 formError 로 표시되며 입력값은 유지한다.
    }
  }

  return (
    <form className="inv-card" onSubmit={handleSubmit} noValidate aria-label="재고 추가">
      <p className="inv-card__title" id="inv-add-h">
        재고 추가
      </p>
      {formError && (
        <Alert variant="error" className="inv-add__alert">
          {formError}
        </Alert>
      )}
      {isDuplicate && (
        <Alert variant="warning" className="inv-add__alert">
          이미 재고에 있는 재료예요. 아래 목록에서 기존 항목의 수량을 수정해 주세요.
        </Alert>
      )}
      <div className="inv-add-grid">
        <Select
          label="재료"
          required
          options={options}
          value={ingredientId}
          onChange={(e) => setIngredientId(e.target.value)}
          hint="찾는 재료가 없나요? 식재료 마스터에서 먼저 등록하세요."
          error={ingError ?? undefined}
        />
        <TextField
          label="수량"
          required
          type="number"
          inputMode="decimal"
          min={0}
          step="0.1"
          placeholder="예: 6"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          error={qtyError ?? undefined}
        />
        <TextField
          label="단위"
          value={unit}
          readOnly
          hint="마스터 기본 단위"
          placeholder="—"
        />
        <TextField
          label="유통기한"
          optional
          type="date"
          value={expiry}
          onChange={(e) => setExpiry(e.target.value)}
        />
        <Button type="submit" fullWidth loading={submitting} className="inv-add__submit">
          추가
        </Button>
      </div>
    </form>
  );
}
