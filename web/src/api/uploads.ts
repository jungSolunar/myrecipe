// api/uploads.ts — 이미지 업로드 (US-004 사진 선택). 계약: /uploads/images
import { apiRequest } from './client';
import type { UploadResponse } from './types';

export function uploadImage(file: File): Promise<UploadResponse> {
  const form = new FormData();
  form.append('file', file);
  return apiRequest<UploadResponse>('/uploads/images', { method: 'POST', body: form });
}
