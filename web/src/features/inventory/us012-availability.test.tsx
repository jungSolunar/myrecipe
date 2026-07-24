// US-012 확인용 테스트 — RecipeDetailPage 는 기존 코드(수정하지 않음).
// 재고 대조 결과(status)가 응답에 포함되면 상세에서 보유/부족 배지가 뜨는지만 확인한다.
import { beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../mocks/server';
import { resetStore, store } from '../../mocks/data';
import { renderWithProviders } from '../../test/test-utils';
import { RecipeDetailPage } from '../recipes/RecipeDetailPage';

const BASE = '/api/v1';

beforeEach(() => {
  resetStore();
  store.currentUser = store.users[0];
});

describe('US-012 부족재료 표시 (RecipeDetailPage 기존 배지 동작 확인)', () => {
  it('재고 대조 status 가 오면 재료별 보유/부족 배지를 표시한다', async () => {
    server.use(
      http.get(`${BASE}/recipes/:id`, () =>
        HttpResponse.json({
          id: 'rcp_x',
          title: '테스트 레시피',
          category: '한식',
          description: null,
          photo_url: null,
          steps: ['끓인다.'],
          ingredients: [
            { ingredient_id: 'ing_egg', name: '계란', quantity: 2, unit: '개', status: 'sufficient' },
            { ingredient_id: 'ing_pork', name: '돼지고기', quantity: 200, unit: 'g', status: 'missing' },
          ],
          ingredient_availability: {
            status: 'insufficient',
            missing_count: 1,
            missing_ingredients: [
              { ingredient_id: 'ing_pork', name: '돼지고기', required_quantity: 200, unit: 'g' },
            ],
          },
          owner_id: store.users[0].id,
          is_owner: false,
          created_at: '2026-07-25T00:00:00Z',
          updated_at: '2026-07-25T00:00:00Z',
        }),
      ),
    );

    renderWithProviders(<RecipeDetailPage />, {
      route: '/recipes/rcp_x',
      path: '/recipes/:recipeId',
    });

    expect(await screen.findByRole('heading', { name: '테스트 레시피' })).toBeInTheDocument();
    expect(screen.getByText(/보유/)).toBeInTheDocument();
    expect(screen.getByText('부족')).toBeInTheDocument();
  });
});
