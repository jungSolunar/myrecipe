import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { InventoryItem } from '../../api/inventory';
import type { StorageLocation } from '../../api/types';
import { Button, Icon, Select, TextField } from '../../components';
import { STORAGE_LOCATION_OPTIONS } from '../ingredients/constants';
import { ExpiryBadge } from './ExpiryBadge';

export interface InventoryEditValues {
  quantity: number;
  expires_at: string | null;
  /** [US-017] 보관위치. */
  storage_location: StorageLocation | null;
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

/** US-011 재고 테이블 1행 (기본 표시 / 인라인 편집: 수량·유통기한·보관위치). US-021 역탐색 링크 포함. */
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
  const [storage, setStorage] = useState<string>(item.storage_location ?? '');

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
        <td data-th="보관위치">
          <Select
            label="보관위치"
            hideLabel
            options={STORAGE_LOCATION_OPTIONS}
            value={storage}
            onChange={(e) => setStorage(e.target.value)}
          />
        </td>
        <td data-th="작업">
          <div className="inv-row-actions">
            <Button
              size="sm"
              loading={saving}
              onClick={() =>
                onSave({
                  quantity: Number(qty),
                  expires_at: expiry ? expiry : null,
                  storage_location: (storage || null) as StorageLocation | null,
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
      <td data-th="보관위치">
        {item.storage_location ? <span className="inv-pill">{item.storage_location}</span> : '미입력'}
      </td>
      <td data-th="작업">
        <div className="inv-row-actions">
          {/* [US-021] 이 재료로 만들 수 있는 레시피 역탐색 */}
          <Link
            className="inv-reverse-link"
            to={`/?ingredient_id=${encodeURIComponent(item.ingredient_id)}`}
            aria-label={`${name}로 만들 수 있는 레시피 찾기`}
            title={`${name}로 만들 수 있는 레시피`}
          >
            <Icon name="search" size={16} />
          </Link>
          <Button size="sm" variant="ghost" onClick={onStartEdit} aria-label={`${name} 수정`}>
            수정
          </Button>
          <Button size="sm" variant="danger" onClick={onDeplete} aria-label={`${name} 소진 처리`}>
            소진
          </Button>
        </div>
      </td>
    </tr>
  );
}
