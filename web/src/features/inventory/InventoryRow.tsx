import { useState } from 'react';
import type { InventoryItem } from '../../api/inventory';
import { Button, TextField } from '../../components';
import { ExpiryBadge } from './ExpiryBadge';

export interface InventoryEditValues {
  quantity: number;
  expires_at: string | null;
}

export interface InventoryRowProps {
  item: InventoryItem;
  /** 마스터에서 조인한 분류 (재고 응답에는 없음). */
  category?: string | null;
  editing: boolean;
  saving: boolean;
  today?: Date;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: (values: InventoryEditValues) => void;
  onDeplete: () => void;
}

/** US-011 재고 테이블 1행 (기본 표시 / 인라인 편집: 수량·유통기한만). */
export function InventoryRow({
  item,
  category,
  editing,
  saving,
  today,
  onStartEdit,
  onCancelEdit,
  onSave,
  onDeplete,
}: InventoryRowProps) {
  const name = item.ingredient_name ?? item.ingredient_id;
  const unit = item.unit ?? '';
  const [qty, setQty] = useState(String(item.quantity));
  const [expiry, setExpiry] = useState(item.expires_at ?? '');

  if (editing) {
    return (
      <tr>
        <td data-th="재료명">
          <TextField label="재료명" hideLabel value={name} readOnly />
        </td>
        <td data-th="분류">{category ? <span className="inv-pill">{category}</span> : '—'}</td>
        <td data-th="수량">
          <div className="inv-qty-edit">
            <TextField
              label="수량"
              hideLabel
              type="number"
              inputMode="decimal"
              min={0}
              step="0.1"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
            <span className="inv-qty-edit__unit">{unit}</span>
          </div>
        </td>
        <td data-th="유통기한">
          <TextField
            label="유통기한"
            hideLabel
            type="date"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
          />
        </td>
        <td data-th="작업">
          <div className="inv-row-actions">
            <Button
              size="sm"
              loading={saving}
              onClick={() =>
                onSave({ quantity: Number(qty), expires_at: expiry ? expiry : null })
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
        <span className="inv-name">{name}</span>
      </td>
      <td data-th="분류">{category ? <span className="inv-pill">{category}</span> : '—'}</td>
      <td data-th="보유 수량">
        <span className="inv-qty">{item.quantity}</span>
        {unit ? ` ${unit}` : ''}
      </td>
      <td data-th="유통기한">
        {item.expires_at ? (
          <>
            {item.expires_at} <ExpiryBadge expiresAt={item.expires_at} today={today} />
          </>
        ) : (
          <ExpiryBadge expiresAt={null} today={today} />
        )}
      </td>
      <td data-th="작업">
        <div className="inv-row-actions">
          <Button
            size="sm"
            variant="ghost"
            onClick={onStartEdit}
            aria-label={`${name} 수정`}
          >
            수정
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={onDeplete}
            aria-label={`${name} 소진 처리`}
          >
            소진
          </Button>
        </div>
      </td>
    </tr>
  );
}
