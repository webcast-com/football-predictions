"use client";

/**
 * Client-side session token helpers.
 *
 * Sessions are purely token-based: login/register return a session token
 * which we keep in sessionStorage and send on every request as
 * `Authorization: Bearer <token>`. No cookies are used, so authentication
 * works inside embedded previews and sandboxed iframes where cookies are
 * blocked.
 *
 * If sessionStorage is also unavailable (fully sandboxed iframe), the token
 * is kept in memory for the lifetime of the page instead.
 */

const TOKEN_KEY = "fp_session_token";

let memoryToken: string | null = null;

export function getSessionToken(): string | null {
  try {
    const stored = sessionStorage.getItem(TOKEN_KEY);
    if (stored !== null) return stored;
  } catch {
    // Fall through to the in-memory token.
  }
  return memoryToken;
}

export function setSessionToken(token: string): void {
  memoryToken = token;
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Storage unavailable — in-memory token covers the page lifetime.
  }
}

export function clearSessionToken(): void {
  memoryToken = null;
  try {
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // Nothing more to clear.
  }
}

/**
 * fetch wrapper that attaches the session token as an
 * `Authorization: Bearer` header on every request.
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
