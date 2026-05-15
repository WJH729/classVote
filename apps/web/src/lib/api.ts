export function getApiBaseUrl(): string {
  return '/api';
}

export function getWallpaperUrl(): string {
  return '/wallpaper/image';
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit & { json?: unknown; accessToken?: string },
): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set('Accept', 'application/json');

  if (init?.json !== undefined) {
    headers.set('Content-Type', 'application/json');
  }
  if (init?.accessToken) {
    headers.set('Authorization', `Bearer ${init.accessToken}`);
  }

  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers,
    body: init?.json !== undefined ? JSON.stringify(init.json) : init?.body,
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${res.status} ${res.statusText}${text ? `: ${text}` : ''}`);
  }

  const contentType = res.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return (await res.json()) as T;
  }
  return (await res.text()) as T;
}
