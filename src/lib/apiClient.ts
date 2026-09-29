export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const rawSession = window.localStorage.getItem('hms-auth-session');
  let accessToken: string | undefined;
  try {
    accessToken = rawSession ? (JSON.parse(rawSession) as { accessToken?: string }).accessToken : undefined;
  } catch {
    accessToken = undefined;
  }
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...init?.headers,
    },
    credentials: 'include',
  });

  if (response.status === 401) {
    throw new Error('SESSION_EXPIRED');
  }

  if (response.status === 403) {
    throw new Error('FORBIDDEN');
  }

  if (!response.ok) {
    throw new Error('NETWORK_ERROR');
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
};
