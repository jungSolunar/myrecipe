// mocks/browser.ts — dev 브라우저용 MSW 워커.
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);

export async function startMockWorker() {
  await worker.start({ onUnhandledRequest: 'bypass' });
  console.info('[mock] MSW 목 서버 활성화 (백엔드 미연결 데모 모드)');
}
