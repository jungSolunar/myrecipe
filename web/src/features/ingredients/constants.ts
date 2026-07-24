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
