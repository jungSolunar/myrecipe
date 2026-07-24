// api/inventory.ts — 보유 재고 CRUD (US-011 [Should]). 계약: /inventory, /inventory/{inventoryId}
// openapi.yaml v1.0.0 의 InventoryItem / InventoryWriteRequest / InventoryListResponse 스키마를 따른다.
// 계약에 없는 필드는 추가하지 않는다.
import { apiRequest } from './client';
import type { Paginated } from './types';

/** [US-011] 보유 재고 1건 (openapi: InventoryItem). */
export interface InventoryItem {
  id: string;
  ingredient_id: string;
  ingredient_name?: string;
  quantity: number;
  unit?: string | null;
  /** 유통기한(YYYY-MM-DD, 선택) */
  expires_at?: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

/** [US-011] 재고 생성/수정 공통 본문 (openapi: InventoryWriteRequest). */
export interface InventoryWriteRequest {
  ingredient_id: string;
  quantity: number;
  unit?: string | null;
  expires_at?: string | null;
}

export interface InventoryListParams {
  cursor?: string;
  limit?: number;
}

/** GET /inventory — 내 재고 목록 */
export function listInventory(
  params: InventoryListParams = {},
): Promise<Paginated<InventoryItem>> {
  return apiRequest<Paginated<InventoryItem>>('/inventory', {
    query: { cursor: params.cursor, limit: params.limit },
  });
}

/** POST /inventory — 재고 등록 */
export function createInventory(body: InventoryWriteRequest): Promise<InventoryItem> {
  return apiRequest<InventoryItem>('/inventory', { method: 'POST', body });
}

/** PUT /inventory/{inventoryId} — 재고 수정 */
export function updateInventory(
  inventoryId: string,
  body: InventoryWriteRequest,
): Promise<InventoryItem> {
  return apiRequest<InventoryItem>(`/inventory/${encodeURIComponent(inventoryId)}`, {
    method: 'PUT',
    body,
  });
}

/** DELETE /inventory/{inventoryId} — 재고 소진(삭제) */
export function deleteInventory(inventoryId: string): Promise<void> {
  return apiRequest<void>(`/inventory/${encodeURIComponent(inventoryId)}`, {
    method: 'DELETE',
  });
}
