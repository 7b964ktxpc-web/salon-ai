const TOKEN_KEY = 'beauty_ai_access_token';

export function getAccessToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setAccessToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearAccessToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}

export function installAuthenticatedFetch(): void {
  const globalScope = globalThis as typeof globalThis & { __beautyAiFetchInstalled?: boolean };
  if (globalScope.__beautyAiFetchInstalled) return;

  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const token = getAccessToken();
    if (!token) return originalFetch(input, init);

    const headers = new Headers(init.headers || {});
    if (!headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
    return originalFetch(input, { ...init, headers });
  };

  globalScope.__beautyAiFetchInstalled = true;
}
