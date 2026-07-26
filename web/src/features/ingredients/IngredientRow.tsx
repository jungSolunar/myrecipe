import { useState } from 'react';
import type { Ingredient } from '../../api/types';
import { Button, Select, Textarea, TextField } from '../../components';
import { AliasInput } from './AliasInput';
import { CATEGORY_OPTIONS, MASTER_STORAGE_OPTIONS, UNIT_OPTIONS } from './constants';

/** [US-016] 인라인 편집이 반환하는 값(확장 필드 포함). */
export interface IngredientRowValues {
  name: string;
  category: string;
  default_unit: string;
  aliases: string[];
  kcal_per_100g: number | null;
  default_storage: string;
  memo: string;
}

export interface IngredientRowProps {
  ingredient: Ingredient;
  editing: boolean;
  saving: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: (values: IngredientRowValues) => void;
  onDelete: () => void;
}

/** US-008 마스터 테이블 1행 (기본 표시 / 인라인 편집). US-016 확장 필드 포함. */
export function IngredientRow({
  ingredient,
  editing,
  saving,
  onStartEdit,
  onCancelEdit,
  onSave,
  onDelete,
}: IngredientRowProps) {
  const [name, setName] = useState(ingredient.name);
  const [category, setCategory] = useState(ingredient.category ?? '');
  const [unit, setUnit] = useState(ingredient.default_unit ?? '');
  const [aliases, setAliases] = useState<string[]>(ingredient.aliases ?? []);
  const [kcal, setKcal] = useState(
    typeof ingredient.kcal_per_100g === 'number' ? String(ingredient.kcal_per_100g) : '',
  );
  const [storage, setStorage] = useState(ingredient.default_storage ?? '');
  const [memo, setMemo] = useState(ingredient.memo ?? '');

  if (editing) {
    return (
      <tr>
        <td data-th="재료명">
          <TextField label="재료명" hideLabel value={name} onChange={(e) => setName(e.target.value)} />
        </td>
        <td data-th="별칭">
          <AliasInput value={aliases} onChange={setAliases} label="별칭" hideLabel />
        </td>
        <td data-th="분류">
          <Select
            label="분류"
            hideLabel
            options={[{ value: '', label: '선택 안 함' }, ...CATEGORY_OPTIONS]}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </td>
        <td data-th="단위">
          <Select
            label="단위"
            hideLabel
            options={[{ value: '', label: '선택 안 함' }, ...UNIT_OPTIONS]}
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
          />
        </td>
        <td data-th="kcal">
          <TextField
            label="100g당 칼로리"
            hideLabel
            type="number"
            inputMode="decimal"
            min={0}
            step="0.1"
            value={kcal}
            onChange={(e) => setKcal(e.target.value)}
          />
        </td>
        <td data-th="기본 보관">
          <Select
            label="기본 보관방법"
            hideLabel
            options={MASTER_STORAGE_OPTIONS}
            value={storage}
            onChange={(e) => setStorage(e.target.value)}
          />
        </td>
        <td data-th="메모" colSpan={2}>
          <Textarea
            label="메모"
            hideLabel
            rows={1}
            placeholder="메모"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />
          <div className="row-actions">
            <Button
              size="sm"
              loading={saving}
              onClick={() =>
                onSave({
                  name,
                  category,
                  default_unit: unit,
                  aliases,
                  kcal_per_100g: kcal.trim() === '' ? null : Number(kcal),
                  default_storage: storage,
                  memo,
                })
              }
            >
              저장
            </Button>
            <Button size="sm" variant="ghost" onClick={onCancelEdit} disabled={saving}>
              취소
            </Button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td data-th="재료명">
        <span className="name">{ingredient.name}</span>
      </td>
      <td data-th="별칭">
        {ingredient.aliases && ingredient.aliases.length > 0
          ? ingredient.aliases.join(', ')
          : '별칭 없음'}
      </td>
      <td data-th="분류">
        {ingredient.category ? <span className="pill">{ingredient.category}</span> : '—'}
      </td>
      <td data-th="단위">{ingredient.default_unit ?? '—'}</td>
      <td data-th="kcal">
        {typeof ingredient.kcal_per_100g === 'number' ? ingredient.kcal_per_100g : '미입력'}
      </td>
      <td data-th="기본 보관">
        {ingredient.default_storage ? (
          <span className="pill">{ingredient.default_storage}</span>
        ) : (
          '미입력'
        )}
      </td>
      <td data-th="등록일">{new Date(ingredient.created_at).toLocaleDateString('ko-KR')}</td>
      <td data-th="작업">
        <div className="row-actions">
          <Button size="sm" variant="ghost" onClick={onStartEdit} aria-label={`${ingredient.name} 수정`}>
            수정
          </Button>
          <Button size="sm" variant="danger" onClick={onDelete} aria-label={`${ingredient.name} 삭제`}>
            삭제
          </Button>
        </div>
      </td>
    </tr>
  );
}
