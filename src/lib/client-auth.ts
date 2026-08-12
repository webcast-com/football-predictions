"use client";

/**
 * Client-side session token helpers.
 *
 * The server sets the session cookie on login, but embedded previews (the app
 * served inside a cross-site iframe) may block third-party cookies — even the
 * `SameSite=None; Secure; Partitioned` (CHIPS) variant is not supported by
 * every browser. When that happens the browser never echoes the cookie back,
 * so the app silently signs you out on the next request.
 *
 * To keep login working in those environments, the login/register response
 * also carries the raw session token. We keep it in sessionStorage and send
 * it on every request as `Authorization: Bearer <token>`; the server accepts
 * it wherever it accepts the cookie.
 *
 * Storage access is guarded with try/catch because a sandboxed iframe may
 * throw on any storage access — in that case we simply fall back to cookies.
 */

const TOKEN_KEY = "fp_session_token";

export function getSessionToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setSessionToken(token: string): void {
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Storage unavailable — rely on the cookie only.
  }
}

export function clearSessionToken(): void {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // Nothing to clear.
  }
}

/**
 * fetch wrapper that attaches the session token (when one is stored) as an
 * `Authorization: Bearer` header, so authenticated API calls keep working
 * even when the browser blocks the session cookie.
 */
export async function authFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const token = getSessionToken();
  const headers = new Headers(init?.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return fetch(input, { ...init, headers });
}
