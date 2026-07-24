import { describe, expect, it } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { App } from './App';
import { AuthProvider } from './features/auth/AuthProvider';
import { createQueryClient } from './lib/queryClient';
import { resetStore, store } from './mocks/data';

/** 시드 소유자로 로그인 상태를 구성한다. */
function loginAsSeedOwner() {
  resetStore();
  store.currentUser = store.users[0];
}

function renderApp(route = '/') {
  const queryClient = createQueryClient();
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[route]}>
          <AuthProvider>{children}</AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );
  }
  return render(<App />, { wrapper: Wrapper });
}

describe('레시피 목록 (US-003 비로그인 열람, US-005)', () => {
  it('비로그인 방문자에게 목록과 로그인 유도 배너를 보여준다', async () => {
    renderApp('/');
    expect(await screen.findByRole('heading', { name: '기본 계란말이' })).toBeInTheDocument();
    // 게스트 배너 + 헤더 로그인 버튼 (배너/헤더 두 곳에 로그인 링크 존재)
    expect(screen.getByText(/로그인 없이 둘러보는 중/)).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: '로그인' }).length).toBeGreaterThanOrEqual(1);
  });

  it('일치하는 레시피가 없으면 빈 결과 상태를 보여준다 (US-010)', async () => {
    renderApp('/?q=없는레시피이름');
    expect(await screen.findByText(/일치하는 레시피가 없어요/)).toBeInTheDocument();
    // 칩 영역 + 빈 상태 두 곳에 초기화 버튼이 있을 수 있음
    expect(screen.getAllByRole('button', { name: '필터 초기화' }).length).toBeGreaterThanOrEqual(1);
  });
});

describe('로그인/로그아웃 (US-002)', () => {
  it('잘못된 자격증명은 오류를 안내한다', async () => {
    renderApp('/login');
    await userEvent.type(screen.getByLabelText(/이메일/), 'chef@example.com');
    await userEvent.type(screen.getByLabelText(/비밀번호/), 'wrongpass');
    await userEvent.click(screen.getByRole('button', { name: '로그인' }));
    expect(await screen.findByText(/이메일 또는 비밀번호가 올바르지 않습니다/)).toBeInTheDocument();
  });

  it('올바른 자격증명으로 로그인하면 목록으로 이동하고 인증 헤더가 보인다', async () => {
    renderApp('/login');
    await userEvent.type(screen.getByLabelText(/이메일/), 'chef@example.com');
    await userEvent.type(screen.getByLabelText(/비밀번호/), 'password1');
    await userEvent.click(screen.getByRole('button', { name: '로그인' }));
    // 목록 도착 + 로그아웃 버튼(authed 헤더)
    expect(await screen.findByRole('button', { name: '로그아웃' })).toBeInTheDocument();
  });
});

describe('로그인 게이트 (US-003)', () => {
  it('비로그인으로 등록 진입 시 로그인 화면으로 유도한다', async () => {
    renderApp('/recipes/new');
    expect(
      await screen.findByText(/레시피를 등록·수정하려면 로그인이 필요합니다/),
    ).toBeInTheDocument();
  });
});

describe('식재료 마스터 (US-008)', () => {
  it('로그인 회원이 식재료를 추가하면 목록에 나타난다', async () => {
    loginAsSeedOwner();
    renderApp('/ingredients');
    // 기존 시드 재료 표시
    expect(await screen.findByText('계란')).toBeInTheDocument();

    const nameInput = screen.getByLabelText(/재료명/);
    await userEvent.type(nameInput, '고등어');
    await userEvent.click(screen.getByRole('button', { name: '추가' }));

    expect(await screen.findByText('고등어')).toBeInTheDocument();
  });

  it('중복 이름 추가는 오류를 안내한다 (US-008 AC2)', async () => {
    loginAsSeedOwner();
    renderApp('/ingredients');
    await screen.findByText('계란');
    await userEvent.type(screen.getByLabelText(/재료명/), '계란');
    await userEvent.click(screen.getByRole('button', { name: '추가' }));
    expect(await screen.findByText(/이미 마스터에 있습니다/)).toBeInTheDocument();
  });
});

describe('레시피 상세 + 삭제 (US-005, US-007)', () => {
  it('소유자에게 수정/삭제 버튼을 보여주고 삭제 확인 후 목록으로 돌아간다', async () => {
    // 소유자로 로그인 상태 구성
    loginAsSeedOwner();
    renderApp('/recipes/rcp_egg_roll');

    expect(await screen.findByRole('heading', { name: '기본 계란말이' })).toBeInTheDocument();
    await userEvent.click(await screen.findByRole('button', { name: /삭제/ }));

    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: '삭제' }));

    // 목록으로 이동
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: '레시피' })).toBeInTheDocument(),
    );
  });
});
