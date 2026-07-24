import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listIngredients } from '../../api/ingredients';
import {
  createInventory,
  deleteInventory,
  listInventory,
  updateInventory,
} from '../../api/inventory';
import type { InventoryWriteRequest } from '../../api/inventory';

const KEY = 'inventory';

/** 내 재고 목록 (US-011). */
export function useInventoryList() {
  return useQuery({ queryKey: [KEY], queryFn: () => listInventory() });
}

/** 재고 추가 폼의 마스터 재료 선택지 (US-008 마스터 재사용). */
export function useMasterOptions() {
  return useQuery({
    queryKey: ['ingredients', 'inventory-options'],
    queryFn: () => listIngredients({ limit: 100 }),
  });
}

export function useCreateInventory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: InventoryWriteRequest) => createInventory(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateInventory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: InventoryWriteRequest }) =>
      updateInventory(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useDeleteInventory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteInventory(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
