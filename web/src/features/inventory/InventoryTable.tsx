import type { InventoryItem } from '../../api/inventory';
import { InventoryRow } from './InventoryRow';
import type { InventoryEditValues } from './InventoryRow';

export type InventoryRowData = InventoryItem & { category?: string | null };

export interface InventoryTableProps {
  rows: InventoryRowData[];
  editingId: string | null;
  savingId: string | null;
  today?: Date;
  onStartEdit: (id: string) => void;
  onCancelEdit: () => void;
  onSave: (item: InventoryItem, values: InventoryEditValues) => void;
  onDeplete: (item: InventoryItem) => void;
}

/** US-011 재고 목록 테이블 (유통기한 임박순 · 모바일 카드 전환). */
export function InventoryTable({
  rows,
  editingId,
  savingId,
  today,
  onStartEdit,
  onCancelEdit,
  onSave,
  onDeplete,
}: InventoryTableProps) {
  return (
    <table className="inv-table">
      <caption>내 재고 {rows.length}건 · 유통기한 임박순</caption>
      <thead>
        <tr>
          <th scope="col">재료명</th>
          <th scope="col">분류</th>
          <th scope="col">보유 수량</th>
          <th scope="col">유통기한</th>
          <th scope="col">
            <span className="sr-only">작업</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <InventoryRow
            key={row.id}
            item={row}
            category={row.category}
            editing={editingId === row.id}
            saving={savingId === row.id}
            today={today}
            onStartEdit={() => onStartEdit(row.id)}
            onCancelEdit={onCancelEdit}
            onSave={(values) => onSave(row, values)}
            onDeplete={() => onDeplete(row)}
          />
        ))}
      </tbody>
    </table>
  );
}
