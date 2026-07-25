import { useEffect, useState } from 'react';
import { ApiError } from '../../api';
import { Icon, TextField } from '../../components';
import { useCreateIngredient, useIngredientList } from '../ingredients/useIngredients';

/** 레시피 폼에서 다루는 연결 재료 (계약 RecipeWriteIngredient + 표시용 name). */
export interface LinkedIngredient {
  ingredient_id: string;
  name: string;
  /** 문자열로 보관하고 제출 시 number 로 변환 */
  quantity: string;
  unit: string;
}

export interface IngredientPickerProps {
  value: LinkedIngredient[];
  onChange: (next: LinkedIngredient[]) => void;
}

/**
 * US-009 재료 마스터 검색·선택·연결.
 * 계약: quantity 는 number, unit 은 문자열. (와이어프레임의 자유 텍스트 수량과 달리 수치+단위로 분리)
 * 마스터에 없으면 "새 재료 만들기" → POST /ingredients 후 연결(US-009 AC2).
 */
export function IngredientPicker({ value, onChange }: IngredientPickerProps) {
  const [term, setTerm] = useState('');
  const [debounced, setDebounced] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const createMut = useCreateIngredient();

  useEffect(() => {
    const t = setTimeout(() => setDebounced(term.trim()), 250);
    return () => clearTimeout(t);
  }, [term]);

  const results = useIngredientList(debounced ? { q: debounced } : {});
  const options = debounced ? (results.data?.data ?? []) : [];
  const linkedIds = new Set(value.map((v) => v.ingredient_id));
  const filtered = options.filter((o) => !linkedIds.has(o.id));
  const exactMatch = options.some((o) => o.name === debounced);

  function addLinked(id: string, name: string, unit: string) {
    onChange([...value, { ingredient_id: id, name, quantity: '', unit }]);
    setTerm('');
    setDebounced('');
  }

  async function createAndAdd() {
    setCreateError(null);
    try {
      const created = await createMut.mutateAsync({ name: debounced });
      addLinked(created.id, created.name, created.default_unit ?? '');
    } catch (err) {
      if (err instanceof ApiError && err.code === 'INGREDIENT_NAME_EXISTS') {
        setCreateError('이미 있는 재료예요. 검색 결과에서 선택해 주세요.');
      } else {
        setCreateError('새 재료를 만들지 못했어요.');
      }
    }
  }

  function updateRow(index: number, patch: Partial<LinkedIngredient>) {
    onChange(value.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }
  function removeRow(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div>
      {value.length > 0 && (
        <div>
          {value.map((row, i) => (
            <div className="ing-row" key={row.ingredient_id}>
              <span className="ing-row__name">{row.name}</span>
              <TextField
                label={`${row.name} 수량`}
                hideLabel
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                placeholder="수량"
                value={row.quantity}
                onChange={(e) => updateRow(i, { quantity: e.target.value })}
              />
              <TextField
                label={`${row.name} 단위`}
                hideLabel
                placeholder="단위"
                value={row.unit}
                onChange={(e) => updateRow(i, { unit: e.target.value })}
              />
              <button
                type="button"
                className="ing-row__del"
                aria-label={`${row.name} 재료 삭제`}
                onClick={() => removeRow(i)}
              >
                <Icon name="close" size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="picker">
        <TextField
          label="재료 추가"
          type="search"
          placeholder="재료명 검색 (예: 두부)"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          aria-expanded={debounced.length > 0}
          aria-controls="ing-results"
        />
        {debounced.length > 0 && (
          <div id="ing-results" className="picker-list" role="listbox" aria-label="마스터 재료 검색 결과">
            {filtered.map((opt) => (
              <button
                key={opt.id}
                type="button"
                role="option"
                aria-selected={false}
                className="picker-list__option"
                onClick={() => addLinked(opt.id, opt.name, opt.default_unit ?? '')}
              >
                <span>{opt.name}</span>
                <span className="picker-list__meta">
                  {[opt.category, opt.default_unit].filter(Boolean).join(' · ') || '—'}
                </span>
              </button>
            ))}
            {!exactMatch && (
              <button
                type="button"
                role="option"
                aria-selected={false}
                className="picker-list__option picker-list__option--new"
                onClick={() => void createAndAdd()}
                disabled={createMut.isPending}
              >
                <span>+ “{debounced}”(으)로 새 재료 만들기</span>
                <span className="picker-list__meta">마스터에 등록 후 연결</span>
              </button>
            )}
            {results.isError && (
              <p className="picker-list__meta" style={{ padding: 'var(--s-2) var(--s-3)' }}>
                재료를 검색하지 못했어요.
              </p>
            )}
          </div>
        )}
      </div>
      {createError && (
        <p className="field__error" role="alert" style={{ marginTop: 'var(--s-2)' }}>
          <Icon name="warning" size={14} /> {createError}
        </p>
      )}
    </div>
  );
}
