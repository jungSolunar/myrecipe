import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Button, Select } from '../../components';
import type { Ingredient } from '../../api/types';
import { RECIPE_CATEGORY_OPTIONS } from '../ingredients/constants';

export interface RecipeFilters {
  q: string;
  category: string;
  ingredientId: string;
}

export interface SearchFilterBarProps {
  filters: RecipeFilters;
  /** 로그인 회원의 재료 마스터 (재료 필터 옵션). 비로그인은 빈 배열 → 재료 필터 숨김. */
  ingredientOptions: Ingredient[];
  resultCount?: number;
  onChange: (next: RecipeFilters) => void;
  onReset: () => void;
}

/** US-010 검색·필터 바. 검색 input + 카테고리/재료 Select + 활성 필터 칩 + 결과 수. */
export function SearchFilterBar({
  filters,
  ingredientOptions,
  resultCount,
  onChange,
  onReset,
}: SearchFilterBarProps) {
  const [queryInput, setQueryInput] = useState(filters.q);

  // 외부(뒤로가기 등)에서 q 가 바뀌면 입력창 동기화
  useEffect(() => {
    setQueryInput(filters.q);
  }, [filters.q]);

  function submitSearch(e: FormEvent) {
    e.preventDefault();
    onChange({ ...filters, q: queryInput.trim() });
  }

  const categoryOptions = [{ value: '', label: '전체' }, ...RECIPE_CATEGORY_OPTIONS.filter((o) => o.value !== '')];
  const ingredientSelectOptions = [
    { value: '', label: '전체' },
    ...ingredientOptions.map((i) => ({ value: i.id, label: i.name })),
  ];

  const selectedIngredient = ingredientOptions.find((i) => i.id === filters.ingredientId);
  const hasActive = Boolean(filters.q || filters.category || filters.ingredientId);

  return (
    <div className="search-filter">
      <form className="search-filter__search" role="search" onSubmit={submitSearch}>
        <label htmlFor="recipe-q" className="sr-only">
          레시피 검색
        </label>
        <input
          id="recipe-q"
          type="search"
          className="field__control"
          placeholder="레시피 이름으로 검색"
          value={queryInput}
          onChange={(e) => setQueryInput(e.target.value)}
        />
        <Button type="submit">검색</Button>
      </form>

      <div className="search-filter__filters">
        <div className="search-filter__select">
          <Select
            label="카테고리"
            options={categoryOptions}
            value={filters.category}
            onChange={(e) => onChange({ ...filters, category: e.target.value })}
          />
        </div>
        {ingredientOptions.length > 0 && (
          <div className="search-filter__select">
            <Select
              label="재료"
              options={ingredientSelectOptions}
              value={filters.ingredientId}
              onChange={(e) => onChange({ ...filters, ingredientId: e.target.value })}
            />
          </div>
        )}
      </div>

      {hasActive && (
        <div className="search-filter__chips" aria-label="적용된 필터">
          {filters.q && (
            <span className="chip">
              검색: “{filters.q}”
              <button
                type="button"
                aria-label="검색어 제거"
                onClick={() => onChange({ ...filters, q: '' })}
              >
                ✕
              </button>
            </span>
          )}
          {filters.category && (
            <span className="chip">
              {filters.category}
              <button
                type="button"
                aria-label={`${filters.category} 필터 제거`}
                onClick={() => onChange({ ...filters, category: '' })}
              >
                ✕
              </button>
            </span>
          )}
          {selectedIngredient && (
            <span className="chip">
              재료: {selectedIngredient.name}
              <button
                type="button"
                aria-label={`${selectedIngredient.name} 필터 제거`}
                onClick={() => onChange({ ...filters, ingredientId: '' })}
              >
                ✕
              </button>
            </span>
          )}
          <button type="button" className="search-filter__reset" onClick={onReset}>
            필터 초기화
          </button>
        </div>
      )}

      {typeof resultCount === 'number' && (
        <p className="search-filter__count" aria-live="polite">
          검색 결과 {resultCount}건
        </p>
      )}
    </div>
  );
}
