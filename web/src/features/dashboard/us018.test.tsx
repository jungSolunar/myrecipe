import { beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import { resetStore, store } from '../../mocks/data';
import { renderWithProviders } from '../../test/test-utils';
import { createQueryClient } from '../../lib/queryClient';
import { AuthProvider } from '../auth/AuthProvider';
import { App } from '../../App';
import { DashboardPage } from './DashboardPage';

describe('US-018 홈 대시보드', () => {
  beforeEach(() => {
    resetStore();
    store.currentUser = store.users[0];
  });

  it('KPI 4종과 패널 3종을 표시한다', async () => {
    renderWithProviders(<DashboardPage />, { route: '/home' });

    expect(await screen.findByText('등록 레시피')).toBeInTheDocument();
    expect(screen.getByText('내 재고')).toBeInTheDocument();
    expect(screen.getByText(/임박 재료/)).toBeInTheDocument();
    // 패널 헤드(고유 텍스트)
    expect(screen.getByText('유통기한 임박')).toBeInTheDocument();
    expect(screen.getByText('최근 추가한 레시피')).toBeInTheDocument();
  });

  it('비로그인은 홈 접근 시 로그인으로 게이트된다', async () => {
    resetStore(); // currentUser = null
    const queryClient = createQueryClient();
    function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/home']}>
            <AuthProvider>{children}</AuthProvider>
          </MemoryRouter>
        </QueryClientProvider>
      );
    }
    render(<App />, { wrapper: Wrapper });
    // RequireAuth → 로그인 화면
    expect(await screen.findByRole('button', { name: '로그인' })).toBeInTheDocument();
  });
});
