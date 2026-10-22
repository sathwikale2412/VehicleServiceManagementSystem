import type { AppStatus, User } from './types';

let csrfToken: string | null = null;

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function responseData<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T;
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(body.error ?? 'The request could not be completed.', response.status);
  return body as T;
}

export async function get<T>(path: string): Promise<T> {
  const response = await fetch(`/api${path}`, { credentials: 'include', headers: { Accept: 'application/json' } });
  return responseData<T>(response);
}

async function getCsrf() {
  if (csrfToken) return csrfToken;
  const response = await fetch('/api/csrf', { credentials: 'include', headers: { Accept: 'application/json' } });
  const result = await responseData<{ token: string }>(response);
  csrfToken = result.token;
  return csrfToken;
}

export function setCsrfToken(token: string | null) {
  csrfToken = token;
}

export async function send<T>(path: string, body?: unknown, method = 'POST'): Promise<T> {
  const token = await getCsrf();
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const response = await fetch(`/api${path}`, {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-Token': token, 'X-Client-Time-Zone': timeZone },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return responseData<T>(response);
}

export async function uploadDocument(file: File, metadata: { vehicleId: string; name: string; kind: string; expiryDate?: string }) {
  const token = await getCsrf();
  const response = await fetch('/api/documents/upload', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': file.type,
      'X-CSRF-Token': token,
      'X-File-Name': encodeURIComponent(file.name),
      'X-Document-Name': encodeURIComponent(metadata.name),
      'X-Document-Kind': metadata.kind,
      'X-Expiry-Date': metadata.expiryDate ?? '',
      'X-Vehicle-Id': metadata.vehicleId,
    },
    body: file,
  });
  return responseData<{ document: Record<string, unknown> }>(response);
}

export async function getStatus() {
  return get<AppStatus>('/status');
}

export type AuthResponse = { user: User; csrfToken?: string };
