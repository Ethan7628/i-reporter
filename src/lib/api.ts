// Simple fetch wrapper for the backend API
const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

function getToken() {
  try {
    return localStorage.getItem('ireporter_token');
  } catch {
    return null;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string> || {},
  };

  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(API_BASE + path, {
    ...options,
    headers,
  });

  const text = await res.text();
  const body = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message = body?.error || body?.message || res.statusText || 'API error';
    throw new Error(message);
  }

  return body as T;
}

export async function post<T, U = any>(path: string, data?: U): Promise<T> {
  return request<T>(path, { method: 'POST', body: data ? JSON.stringify(data) : undefined });
}

export async function get<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'GET' });
}

export async function put<T, U = any>(path: string, data?: U): Promise<T> {
  return request<T>(path, { method: 'PUT', body: data ? JSON.stringify(data) : undefined });
}

export async function del<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'DELETE' });
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem('ireporter_token', token);
  else localStorage.removeItem('ireporter_token');
}

export default { get, post, put, del, setToken };
