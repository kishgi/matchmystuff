export const ADMIN_TOKEN_KEY = "matchmystuff_admin_token";

const listeners = new Set<() => void>();

export function subscribeAdminSession(onChange: () => void) {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

export function notifyAdminSessionChange() {
  for (const listener of listeners) {
    listener();
  }
}

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token: string) {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
  notifyAdminSessionChange();
}

export function clearAdminToken() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  notifyAdminSessionChange();
}
