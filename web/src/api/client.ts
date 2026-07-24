/*
 * api/client.ts — 유일한 네트워크 호출 지점(fetch 래퍼).
 * - 베이스 경로: /api/v1 (경로 버저닝)
 * - 세션 쿠키(HttpOnly) 인증: credentials: 'include'
 * - 에러 포맷 { error: { code, message, details } } 을 ApiError 로 정규화한다.
 */
import type { ApiErrorBody, ErrorDetail } from './types';

export const API_BASE = '/api/v1';

/** 계약의 표준 에러 코드 (FE 분기용) */
export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'AUTH_REQUIRED'
  | 'FORBIDDEN'
  | 'RESOURCE_NOT_FOUND'
  | 'EMAIL_ALREADY_EXISTS'
  | 'INVALID_CREDENTIALS'
  | 'INGREDIENT_NAME_EXISTS'
  | 'INGREDIENT_IN_USE'
  | 'NETWORK_ERROR'
  | 'UNKNOWN';

export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode | string;
  readonly details: ErrorDetail[];

  constructor(status: number, code: string, message: string, details: ErrorDetail[] = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  /** 특정 필드의 검증 사유를 찾는다(폼 인라인 에러 매핑용). */
  detailFor(field: string): ErrorDetail | undefined {
    return this.details.find((d) => d.field === field);
  }
}

export interface RequestOptions {
  method?: string;
  /** JSON 본문. FormData 를 넘기면 그대로 전송한다. */
  body?: unknown;
  /** 쿼리 파라미터. 배열 값은 반복 파라미터로 직렬화(explode). */
  query?: Record<string, string | number | boolean | string[] | undefined>;
  signal?: AbortSignal;
}

function buildQuery(query?: RequestOptions['query']): string {
  if (!query) return '';
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === '') continue;
    if (Array.isArray(value)) {
      for (const v of value) sp.append(key, v);
    } else {
      sp.append(key, String(value));
    }
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, signal } = options;
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  const headers: Record<string, string> = {};
  if (body !== undefined && !isFormData) headers['Content-Type'] = 'application/json';

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}${buildQuery(query)}`, {
      method,
      credentials: 'include',
      headers,
      body: body === undefined ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
      signal,
    });
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
    throw new ApiError(0, 'NETWORK_ERROR', '네트워크 오류가 발생했어요. 연결을 확인해 주세요.');
  }

  if (res.status === 204) return undefined as T;

  let payload: unknown = undefined;
  const text = await res.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = undefined;
    }
  }

  if (!res.ok) {
    const errBody = payload as ApiErrorBody | undefined;
    const err = errBody?.error;
    throw new ApiError(
      res.status,
      err?.code ?? 'UNKNOWN',
      err?.message ?? '요청을 처리하지 못했어요.',
      err?.details ?? [],
    );
  }

  return payload as T;
}
