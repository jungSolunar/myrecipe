import type { ReactElement, ReactNode } from 'react';
import { render } from '@testing-library/react';
import type { RenderOptions } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../features/auth/AuthProvider';
import { createQueryClient } from '../lib/queryClient';

export interface RenderAppOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string;
  /** path 를 지정하면 해당 라우트 패턴으로 렌더(useParams 등 지원) */
  path?: string;
}

/** QueryClient + Router + Auth 컨텍스트를 감싼 렌더 헬퍼. */
export function renderWithProviders(ui: ReactElement, options: RenderAppOptions = {}) {
  const { route = '/', path, ...rest } = options;
  const queryClient = createQueryClient();

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[route]}>
          <AuthProvider>
            {path ? (
              <Routes>
                <Route path={path} element={children} />
                <Route path="*" element={children} />
              </Routes>
            ) : (
              children
            )}
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...rest });
}
