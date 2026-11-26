import { Capacitor, CapacitorHttp, type HttpResponse } from '@capacitor/core';
import { auth } from '../firebase/firebaseApp';

const DEFAULT_NATIVE_API_BASE_URL = 'https://campus-connect-jqob.onrender.com';

const configuredApiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').trim().replace(/\/+$/, '');

export const API_BASE_URL =
  configuredApiBaseUrl || (Capacitor.isNativePlatform() ? DEFAULT_NATIVE_API_BASE_URL : '');

export function buildCampusApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export async function getCampusAuthHeaders(
  extraHeaders?: Record<string, string>
): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(extraHeaders ?? {}),
  };

  const currentUser = auth.currentUser;
  if (currentUser) {
    try {
      const token = await currentUser.getIdToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Proceed without token if unavailable
    }
  }

  return headers;
}

function parseJsonObject(raw: unknown): Record<string, unknown> | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return null;
    }
  }
  return null;
}

function extractApiError(parsed: Record<string, unknown> | null, status: number, fallbackLabel: string): string {
  if (parsed && typeof parsed.error === 'string' && parsed.error.trim().length > 0) {
    return parsed.error;
  }
  return `${fallbackLabel} (${status})`;
}

export interface CampusApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  errorLabel?: string;
}

/**
 * Performs an HTTP request to the CollegeConnect backend.
 * On Capacitor Android/iOS, routes through native CapacitorHttp to bypass
 * WebView CORS restrictions cleanly and handle Render cold-start latency.
 */
export async function requestCampusApi<T>(
  path: string,
  options: CampusApiRequestOptions = {}
): Promise<T> {
  const url = buildCampusApiUrl(path);
  const method = options.method ?? 'GET';
  const headers = await getCampusAuthHeaders(options.headers);
  const errorLabel = options.errorLabel ?? 'Campus API request failed';

  if (Capacitor.isNativePlatform()) {
    const response: HttpResponse = await CapacitorHttp.request({
      url,
      method,
      headers,
      ...(options.body !== undefined ? { data: options.body } : {}),
      connectTimeout: 45000,
      readTimeout: 45000,
      responseType: 'json',
    });

    const parsed = parseJsonObject(response.data);
    if (response.status < 200 || response.status >= 300) {
      throw new Error(extractApiError(parsed, response.status, errorLabel));
    }
    return (parsed ?? ({} as Record<string, unknown>)) as T;
  }

  const res = await fetch(url, {
    method,
    headers,
    ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
  });

  const text = await res.text();
  const parsed = parseJsonObject(text);

  if (!res.ok) {
    throw new Error(extractApiError(parsed, res.status, errorLabel));
  }

  return (parsed ?? ({} as Record<string, unknown>)) as T;
}
