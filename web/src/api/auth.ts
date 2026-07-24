// api/auth.ts — 인증 엔드포인트 (US-001~003). 계약: /auth/*
import { apiRequest } from './client';
import type { AuthResponse, LoginRequest, SignupRequest } from './types';

export function signup(body: SignupRequest): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/signup', { method: 'POST', body });
}

export function login(body: LoginRequest): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/login', { method: 'POST', body });
}

export function logout(): Promise<void> {
  return apiRequest<void>('/auth/logout', { method: 'POST' });
}

export function getMe(): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/me');
}
