// mocks/server.ts — 테스트(node)용 MSW 서버.
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
