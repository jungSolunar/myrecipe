import { beforeEach, describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { resetStore, store } from '../../mocks/data';
import { renderWithProviders } from '../../test/test-utils';
import { IngredientMasterPage } from './IngredientMasterPage';

beforeEach(() => {
  resetStore();
  store.currentUser = store.users[0];
});

describe('US-016 식재료 마스터 확장', () => {
  it('별칭·kcal·기본 보관방법을 입력해 등록하면 목록에 표시된다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<IngredientMasterPage />, { route: '/ingredients' });
    await screen.findByText('계란');

    await user.type(screen.getByLabelText(/재료명/), '고등어');
    await user.type(screen.getByPlaceholderText(/Enter로 추가/), '삼치{Enter}');
    await user.type(screen.getByLabelText(/100g당 칼로리/), '200');
    await user.selectOptions(screen.getByLabelText('기본 보관방법'), '냉장');
    await user.click(screen.getByRole('button', { name: '추가' }));

    expect(await screen.findByText('고등어')).toBeInTheDocument();
    // 별칭 셀에 삼치, kcal 200 표시
    expect(screen.getByText(/삼치/)).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
  });

  it('별칭으로 검색하면 해당 재료가 매칭된다 (계란의 별칭 달걀)', async () => {
    const user = userEvent.setup();
    renderWithProviders(<IngredientMasterPage />, { route: '/ingredients' });
    await screen.findByText('계란');

    await user.type(screen.getByPlaceholderText('재료명 또는 별칭으로 검색'), '달걀');

    await waitFor(() => expect(screen.getByText('계란')).toBeInTheDocument());
    // 별칭이 다른 재료(대파)는 제외된다
    await waitFor(() => expect(screen.queryByText('대파')).not.toBeInTheDocument());
  });
});
