import { beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { resetStore, store } from '../../mocks/data';
import { renderWithProviders } from '../../test/test-utils';
import { InventoryPage } from './InventoryPage';

// 전역 MSW 핸들러(store.inventory 기반)를 사용한다.
beforeEach(() => {
  resetStore();
  store.currentUser = store.users[0];
});

describe('US-017 재고 보관위치', () => {
  it('보관위치를 선택해 추가하면 목록에 표시된다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<InventoryPage />, { route: '/inventory' });
    await screen.findByRole('option', { name: /계란/ });

    await user.selectOptions(screen.getByLabelText(/재료/), 'ing_egg');
    await user.type(screen.getByLabelText(/수량/), '6');
    await user.selectOptions(screen.getByLabelText('보관위치'), '냉장실');
    await user.click(screen.getByRole('button', { name: '추가' }));

    expect(await screen.findByText('계란', { exact: true })).toBeInTheDocument();
    // 표 셀(inv-pill)에 보관위치가 표시된다 (Select option 과 구분해 pill 로 조회)
    const pill = document.querySelector('.inv-table [data-th="보관위치"] .inv-pill');
    expect(pill?.textContent).toBe('냉장실');
  });
});

describe('US-021 역탐색 링크', () => {
  it('재고 행에 "이 재료로 만들 수 있는 레시피" 링크가 있다', async () => {
    store.inventory.push({
      id: 'inv_x',
      ingredient_id: 'ing_egg',
      ingredient_name: '계란',
      quantity: 6,
      unit: '개',
      expires_at: null,
      storage_location: '냉장실',
      owner_id: store.users[0].id,
      created_at: '2026-07-25T00:00:00Z',
      updated_at: '2026-07-25T00:00:00Z',
    });
    renderWithProviders(<InventoryPage />, { route: '/inventory' });

    const link = await screen.findByRole('link', { name: /계란로 만들 수 있는 레시피 찾기/ });
    expect(link.getAttribute('href')).toContain('ingredient_id=ing_egg');
  });
});

describe('US-022 재고 추가 위저드', () => {
  it('위저드 단계를 거쳐 재고를 추가하고 완료 안내를 본다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<InventoryPage />, { route: '/inventory?wizard=1' });

    expect(await screen.findByText('단계별 재고 추가')).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('재료'), 'ing_egg');
    await user.click(screen.getByRole('button', { name: '다음' }));

    await user.type(screen.getByLabelText(/수량/), '3');
    await user.click(screen.getByRole('button', { name: '다음' }));

    await user.click(screen.getByRole('button', { name: '재고 추가' }));

    // 완료 단계 도달 (완료 버튼 노출)
    expect(await screen.findByRole('button', { name: '완료' })).toBeInTheDocument();
    expect(screen.getAllByText(/재고에 추가했어요/).length).toBeGreaterThanOrEqual(1);
  });
});
