import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RecipeCard } from './RecipeCard';
import type { RecipeListItem } from '../api/types';

const base: RecipeListItem = {
  id: 'rcp_1',
  title: '김치찌개',
  category: '한식',
  photo_url: null,
  ingredient_count: 5,
  owner_id: 'usr_1',
  created_at: '2026-07-24T10:00:00Z',
  updated_at: '2026-07-24T10:00:00Z',
};

function renderCard(recipe: RecipeListItem) {
  return render(
    <MemoryRouter>
      <RecipeCard recipe={recipe} />
    </MemoryRouter>,
  );
}

describe('RecipeCard', () => {
  it('제목/카테고리/재료 수를 표시한다', () => {
    renderCard(base);
    expect(screen.getByRole('heading', { name: '김치찌개' })).toBeInTheDocument();
    expect(screen.getByText('한식')).toBeInTheDocument();
    expect(screen.getByText('재료 5개')).toBeInTheDocument();
  });

  it('사진이 없으면 플레이스홀더를 보여준다', () => {
    renderCard(base);
    expect(screen.getByText(/사진 없음/)).toBeInTheDocument();
  });

  it('계약에 없는 조리시간(분)은 렌더하지 않는다', () => {
    renderCard(base);
    expect(screen.queryByText(/분/)).not.toBeInTheDocument();
  });

  it('카드 전체가 상세 링크다', () => {
    renderCard(base);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/recipes/rcp_1');
  });
});
