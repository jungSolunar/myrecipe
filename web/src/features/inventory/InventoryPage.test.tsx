import { beforeEach, describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../mocks/server';
import { resetStore, store } from '../../mocks/data';
import { renderWithProviders } from '../../test/test-utils';
import type { InventoryItem } from '../../api/inventory';
import { InventoryPage } from './InventoryPage';

const BASE = '/api/v1';

// 재고는 계약(openapi /inventory)만 사용하는 런타임 MSW 목으로 시뮬레이션한다.
// (기존 mocks/handlers.ts 는 보호 파일이라 수정하지 않고 server.use 로 주입)
let inventory: InventoryItem[] = [];
let invSeq = 0;

function nameFor(ingredientId: string): string | undefined {
  return store.ingredients.find((i) => i.id === ingredientId)?.name;
}

function inventoryHandlers() {
  return [
    http.get(`${BASE}/inventory`, () => {
      if (!store.currentUser) {
        return HttpResponse.json({ error: { code: 'AUTH_REQUIRED', message: '로그인이 필요합니다.' } }, { status: 401 });
      }
      return HttpResponse.json({ data: inventory, next_cursor: null, has_more: false });
    }),
    http.post(`${BASE}/inventory`, async ({ request }) => {
      const body = (await request.json()) as Partial<InventoryItem>;
      const item: InventoryItem = {
        id: `inv_${(invSeq += 1)}`,
        ingredient_id: body.ingredient_id as string,
        ingredient_name: nameFor(body.ingredient_id as string),
        quantity: body.quantity as number,
        unit: body.unit ?? null,
        expires_at: body.expires_at ?? null,
        owner_id: store.currentUser!.id,
        created_at: '2026-07-25T00:00:00Z',
        updated_at: '2026-07-25T00:00:00Z',
      };
      inventory.push(item);
      return HttpResponse.json(item, { status: 201 });
    }),
    http.put(`${BASE}/inventory/:id`, async ({ request, params }) => {
      const body = (await request.json()) as Partial<InventoryItem>;
      const found = inventory.find((i) => i.id === params.id);
      if (!found) {
        return HttpResponse.json({ error: { code: 'RESOURCE_NOT_FOUND', message: '없음' } }, { status: 404 });
      }
      found.quantity = body.quantity as number;
      found.unit = body.unit ?? null;
      found.expires_at = body.expires_at ?? null;
      return HttpResponse.json(found, { status: 200 });
    }),
    http.delete(`${BASE}/inventory/:id`, ({ params }) => {
      inventory = inventory.filter((i) => i.id !== params.id);
      return new HttpResponse(null, { status: 204 });
    }),
  ];
}

function seedItem(over: Partial<InventoryItem> = {}): InventoryItem {
  const item: InventoryItem = {
    id: `inv_${(invSeq += 1)}`,
    ingredient_id: 'ing_egg',
    ingredient_name: '계란',
    quantity: 6,
    unit: '개',
    expires_at: '2026-08-10',
    owner_id: store.users[0].id,
    created_at: '2026-07-25T00:00:00Z',
    updated_at: '2026-07-25T00:00:00Z',
    ...over,
  };
  inventory.push(item);
  return item;
}

beforeEach(() => {
  resetStore();
  store.currentUser = store.users[0]; // 시드 소유자 로그인 상태
  inventory = [];
  invSeq = 0;
  server.use(...inventoryHandlers());
});

describe('재고 관리 화면 (US-011)', () => {
  it('재고가 없으면 빈 상태를 보여준다', async () => {
    renderWithProviders(<InventoryPage />, { route: '/inventory' });
    expect(await screen.findByText('아직 등록한 재고가 없어요')).toBeInTheDocument();
  });

  it('마스터에서 재료를 선택해 재고를 추가하면 목록에 나타난다 (AC1)', async () => {
    const user = userEvent.setup();
    renderWithProviders(<InventoryPage />, { route: '/inventory' });

    // 마스터 옵션 로딩 대기 (계란 옵션 존재)
    await screen.findByRole('option', { name: /계란/ });

    await user.selectOptions(screen.getByLabelText(/재료/), 'ing_egg');
    await user.type(screen.getByLabelText(/수량/), '6');
    await user.click(screen.getByRole('button', { name: '추가' }));

    // 테이블 셀에 재료명(정확히 '계란')과 수량이 표시된다
    expect(await screen.findByText('계란', { exact: true })).toBeInTheDocument();
    expect(screen.getByText('6', { exact: true })).toBeInTheDocument();
  });

  it('인라인으로 수량을 수정할 수 있다 (AC2)', async () => {
    const user = userEvent.setup();
    seedItem({ quantity: 6 });
    renderWithProviders(<InventoryPage />, { route: '/inventory' });

    await user.click(await screen.findByRole('button', { name: '계란 수정' }));

    const qtyInput = screen.getByLabelText('수량'); // 편집행 입력(접근명 '수량', 추가폼은 '수량 필수')
    await user.clear(qtyInput);
    await user.type(qtyInput, '10');
    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(await screen.findByText('10', { exact: true })).toBeInTheDocument();
  });

  it('수량 0으로 저장하면 소진 처리 확인이 뜬다 (AC2)', async () => {
    const user = userEvent.setup();
    seedItem({ quantity: 6 });
    renderWithProviders(<InventoryPage />, { route: '/inventory' });

    await user.click(await screen.findByRole('button', { name: '계란 수정' }));
    const qtyInput = screen.getByLabelText('수량');
    await user.clear(qtyInput);
    await user.type(qtyInput, '0');
    await user.click(screen.getByRole('button', { name: '저장' }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/재고에서 제거할까요/)).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: '소진 처리' })).toBeInTheDocument();
  });

  it('소진 버튼 → 확인하면 목록에서 제거된다 (AC2)', async () => {
    const user = userEvent.setup();
    seedItem({ quantity: 6 });
    renderWithProviders(<InventoryPage />, { route: '/inventory' });

    await user.click(await screen.findByRole('button', { name: '계란 소진 처리' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: '소진 처리' }));

    await waitFor(() =>
      expect(screen.queryByText('계란', { exact: true })).not.toBeInTheDocument(),
    );
    expect(await screen.findByText('아직 등록한 재고가 없어요')).toBeInTheDocument();
  });

  it('목록 로드 실패 시 에러 상태와 다시 시도를 보여준다', async () => {
    server.use(
      http.get(`${BASE}/inventory`, () =>
        HttpResponse.json({ error: { code: 'UNKNOWN', message: '서버 오류' } }, { status: 500 }),
      ),
    );
    renderWithProviders(<InventoryPage />, { route: '/inventory' });

    expect(
      await screen.findByText('재고 목록을 불러오지 못했어요', undefined, { timeout: 4000 }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다시 시도' })).toBeInTheDocument();
  });

  it('마스터가 비어 있으면 마스터 등록 안내를 보여준다 (상태 C)', async () => {
    server.use(
      http.get(`${BASE}/ingredients`, () =>
        HttpResponse.json({ data: [], next_cursor: null, has_more: false }),
      ),
    );
    renderWithProviders(<InventoryPage />, { route: '/inventory' });

    expect(await screen.findByText(/마스터에서 등록하기/)).toBeInTheDocument();
  });
});
