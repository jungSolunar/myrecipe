import type { SelectOption } from '../../components';

// 와이어프레임 기준 분류/단위 옵션. 계약상 자유 문자열이므로 UI 제안 목록으로만 사용.
export const CATEGORY_OPTIONS: SelectOption[] = [
  { value: '채소', label: '채소' },
  { value: '육류', label: '육류' },
  { value: '수산물', label: '수산물' },
  { value: '가공식품', label: '가공식품' },
  { value: '양념', label: '양념' },
  { value: '기타', label: '기타' },
];

export const UNIT_OPTIONS: SelectOption[] = [
  { value: '개', label: '개' },
  { value: '모', label: '모' },
  { value: 'g', label: 'g' },
  { value: 'ml', label: 'ml' },
  { value: '큰술', label: '큰술' },
  { value: '약간', label: '약간' },
];

export const RECIPE_CATEGORY_OPTIONS: SelectOption[] = [
  { value: '', label: '선택 안 함' },
  { value: '한식', label: '한식' },
  { value: '양식', label: '양식' },
  { value: '일식', label: '일식' },
  { value: '디저트', label: '디저트' },
];

/** [v2.3.0/US-016] 마스터 기본 보관방법 — 냉장/냉동/실온 3종 고정(계약 enum). */
export const MASTER_STORAGE_OPTIONS: SelectOption[] = [
  { value: '', label: '선택 안 함' },
  { value: '냉장', label: '냉장' },
  { value: '냉동', label: '냉동' },
  { value: '실온', label: '실온' },
];

/** [v2.3.0/US-017] 재고 보관위치 — 냉장실/냉동실/실온 3종 고정(계약 enum, 마스터 보관방법과 값이 다름). */
export const STORAGE_LOCATION_OPTIONS: SelectOption[] = [
  { value: '', label: '선택 안 함' },
  { value: '냉장실', label: '냉장실' },
  { value: '냉동실', label: '냉동실' },
  { value: '실온', label: '실온' },
];
