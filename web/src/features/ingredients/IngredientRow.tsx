import { useState } from 'react';
import type { Ingredient } from '../../api/types';
import { Button, Select, TextField } from '../../components';
import { CATEGORY_OPTIONS, UNIT_OPTIONS } from './constants';

export interface IngredientRowProps {
  ingredient: Ingredient;
  editing: boolean;
  saving: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: (values: { name: string; category: string; default_unit: string }) => void;
  onDelete: () => void;
}

/** US-008 마스터 테이블 1행 (기본 표시 / 인라인 편집). */
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

  if (editing) {
    return (
      <tr>
        <td data-th="재료명">
          <TextField
            label="재료명"
            hideLabel
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
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
        <td data-th="등록일" aria-hidden="true" />
        <td data-th="작업">
          <div className="row-actions">
            <Button
              size="sm"
              loading={saving}
              onClick={() => onSave({ name, category, default_unit: unit })}
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
      <td data-th="분류">
        {ingredient.category ? <span className="pill">{ingredient.category}</span> : '—'}
      </td>
      <td data-th="단위">{ingredient.default_unit ?? '—'}</td>
      <td data-th="등록일">
        {new Date(ingredient.created_at).toLocaleDateString('ko-KR')}
      </td>
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
