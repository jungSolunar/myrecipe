/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 세션 쿠키(HttpOnly) 인증 + /api/v1 경로. dev에서 백엔드가 있으면 프록시로 연결.
// VITE_API_TARGET 미설정 시 MSW(브라우저 목)로 동작한다(개발/데모용).
export default defineConfig(() => {
  const apiTarget = process.env.VITE_API_TARGET;
  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: apiTarget
        ? { '/api': { target: apiTarget, changeOrigin: true } }
        : undefined,
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      css: false,
      restoreMocks: true,
    },
  };
});
