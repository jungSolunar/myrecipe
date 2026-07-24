import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { AuthProvider } from './features/auth/AuthProvider';
import { createQueryClient } from './lib/queryClient';
import './styles/tokens.css';
import './styles/global.css';

const queryClient = createQueryClient();

async function bootstrap() {
  // 백엔드가 없으면(VITE_API_TARGET 미설정) MSW 브라우저 목으로 동작 — 개발/데모용.
  if (import.meta.env.DEV && !import.meta.env.VITE_API_TARGET) {
    const { startMockWorker } = await import('./mocks/browser');
    await startMockWorker();
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </StrictMode>,
  );
}

void bootstrap();
