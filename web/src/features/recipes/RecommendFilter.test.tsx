import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { renderWithProviders } from '../../test/test-utils';
import { server } from '../../mocks/server';
import { resetStore, store } from '../../mocks/data';
import type { Paginated, RecipeListItem } from '../../api/types';
import { RecipeListPage } from './RecipeListPage';

const BASE = '/api/v1';

/** 시드 소유자로 로그인 상태를 구성한다(재고=마스터 재료 5건 보유). */
function loginAsSeedOwner() {
  resetStore();
  store.currentUser = store.users[0];
}

/** GET /recipes 를 추천 응답으로 오버라이드하고, 마지막 요청 URL 을 캡처한다. */
function stubRecommendRecipes(items: RecipeListItem[]) {
  const captured: { url?: URL } = {};
  server.use(
    http.get(`${BASE}/recipes`, ({ request }) => {
      captured.url = new URL(request.url);
      const payload: Paginated<RecipeListItem> = {
        data: items,
        next_cursor: null,
        has_more: false,
      };
      return HttpResponse.json(payload, { status: 200 });
    }),
  );
  return captured;
}

function item(overrides: Partial<RecipeListItem>): RecipeListItem {
  return {
    id: 'rcp_x',
    title: '레시피',
    category: '한식',
    photo_url: null,
    ingredient_count: 4,
    owner_id: 'usr_seed',
    created_at: '2026-07-24T10:00:00Z',
    updated_at: '2026-07-24T10:00:00Z',
    ...overrides,
  };
}

describe('US-013 추천 필터 토글 (비로그인 게이트)', () => {
  it('비로그인은 토글이 비활성화되고 로그인 유도 hint 를 항상 보여준다', async () => {
    resetStore(); // currentUser = null → guest
    renderWithProviders(<RecipeListPage />, { route: '/' });

    const toggle = await screen.findByRole('switch', { name: /만들 수 있는 레시피만/ });
    expect(toggle).toBeDisabled();
    expect(toggle).not.toBeChecked();

    // 툴팁 + 항상 보이는 hint 이중 안내(같은 문구가 2곳: bubble + 본문)
    expect(
      screen.getAllByText(/로그인하면 내 재료로 만들 수 있는 레시피를 골라줘요/).length,
    ).toBeGreaterThanOrEqual(2);
    // 로그인 링크는 returnTo 로 원화면 복귀
    const loginLinks = screen.getAllByRole('link', { name: '로그인' });
    expect(loginLinks.some((a) => a.getAttribute('href')?.includes('returnTo'))).toBe(true);
  });
});

describe('US-013 추천 필터 (부족순 + 배지 + 결과 헤더)', () => {
  it('토글 ON 시 available_only=true & sort=missing_asc 를 전달하고 부족 배지를 렌더한다', async () => {
    loginAsSeedOwner();
    const captured = stubRecommendRecipes([
      item({ id: 'rcp_a', title: '기본 계란말이', missing_count: 0 }),
      item({ id: 'rcp_b', title: '두부 계란찜', missing_count: 2 }),
    ]);

    renderWithProviders(<RecipeListPage />, { route: '/?available=1' });

    // 결과 헤더: 추천 문구 + 부족 적은 순
    expect(await screen.findByText(/만들 수 있는 레시피 2건/)).toBeInTheDocument();
    expect(screen.getByText(/부족 적은 순/)).toBeInTheDocument();

    // 배지: 충족(부족 0) + 부족 2개, 색이 아닌 텍스트/aria 로 구분
    expect(
      screen.getByLabelText('모든 재료 보유, 지금 만들 수 있음'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('부족한 재료 2개')).toBeInTheDocument();
    expect(screen.getByText('부족 2개')).toBeInTheDocument();

    // 계약 파라미터 전달 확인
    await waitFor(() => expect(captured.url).toBeDefined());
    expect(captured.url?.searchParams.get('available_only')).toBe('true');
    expect(captured.url?.searchParams.get('sort')).toBe('missing_asc');
  });

  it('추천 결과가 없으면 전용 빈 상태(필터 끄기/재고 등록)를 보여준다', async () => {
    loginAsSeedOwner();
    stubRecommendRecipes([]);

    renderWithProviders(<RecipeListPage />, { route: '/?available=1' });

    expect(
      await screen.findByText(/보유 재료로 만들 수 있는 레시피가 아직 없어요/),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '필터 끄기' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '재고 등록' })).toBeInTheDocument();
  });
});

describe('US-013 기본 동작 회귀 (토글 OFF)', () => {
  it('토글 OFF 기본 목록은 부족 배지 없이 기존 결과 문구를 유지한다', async () => {
    loginAsSeedOwner();
    renderWithProviders(<RecipeListPage />, { route: '/' });

    // 기존 시드 레시피 노출
    expect(await screen.findByRole('heading', { name: '기본 계란말이' })).toBeInTheDocument();
    // 기존 결과 문구 유지, 추천 문구/배지 없음
    expect(screen.getByText(/검색 결과/)).toBeInTheDocument();
    expect(screen.queryByText(/부족 적은 순/)).not.toBeInTheDocument();
    expect(screen.queryByText(/지금 만들 수 있어요/)).not.toBeInTheDocument();
  });

  it('로그인 회원이 토글을 켜면 추천 모드로 전환된다', async () => {
    loginAsSeedOwner();
    const captured = stubRecommendRecipes([
      item({ id: 'rcp_a', title: '기본 계란말이', missing_count: 1 }),
    ]);

    renderWithProviders(<RecipeListPage />, { route: '/' });

    const toggle = await screen.findByRole('switch', { name: /만들 수 있는 레시피만/ });
    await waitFor(() => expect(toggle).toBeEnabled());
    await userEvent.click(toggle);

    expect(await screen.findByText(/만들 수 있는 레시피 1건/)).toBeInTheDocument();
    expect(screen.getByLabelText('부족한 재료 1개')).toBeInTheDocument();
    await waitFor(() =>
      expect(captured.url?.searchParams.get('available_only')).toBe('true'),
    );
  });
});
