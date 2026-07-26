import { beforeEach, describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { resetStore, store } from '../../mocks/data';
import { renderWithProviders } from '../../test/test-utils';
import { RecipeListPage } from './RecipeListPage';
import { RecipeDetailPage } from './RecipeDetailPage';

beforeEach(() => {
  resetStore();
});

describe('US-014 조리시간 · US-015 평균 평점 (공개 표시)', () => {
  it('비로그인 목록에도 조리시간과 평균 평점이 공개된다', async () => {
    renderWithProviders(<RecipeListPage />, { route: '/' });
    // 계란말이 조리시간 15분
    expect(await screen.findByText('15분')).toBeInTheDocument();
    // 계란말이 평균 4.5(평가 2명)
    expect(screen.getByText('4.5')).toBeInTheDocument();
    expect(screen.getByText('평가 2명')).toBeInTheDocument();
    // 평가 없는 레시피는 "평가 없음"
    expect(screen.getByText('평가 없음')).toBeInTheDocument();
  });
});

describe('US-015 별점 입력', () => {
  it('로그인 회원은 별점을 선택해 저장할 수 있다', async () => {
    resetStore();
    store.currentUser = store.users[0];
    const user = userEvent.setup();
    renderWithProviders(<RecipeDetailPage />, {
      route: '/recipes/rcp_fried_rice',
      path: '/recipes/:recipeId',
    });
    expect(await screen.findByRole('heading', { name: '계란 볶음밥' })).toBeInTheDocument();

    const group = screen.getByRole('radiogroup', { name: '내 평점' });
    await user.click(within(group).getByRole('radio', { name: '별 5개' }));
    await user.click(screen.getByRole('button', { name: '평점 저장' }));

    expect(await screen.findByText('평점을 저장했어요.')).toBeInTheDocument();
  });

  it('비로그인은 별점 입력 대신 로그인 유도를 본다', async () => {
    renderWithProviders(<RecipeDetailPage />, {
      route: '/recipes/rcp_fried_rice',
      path: '/recipes/:recipeId',
    });
    expect(await screen.findByRole('heading', { name: '계란 볶음밥' })).toBeInTheDocument();
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
    expect(screen.getByText(/별점을 남기려면/)).toBeInTheDocument();
  });
});
