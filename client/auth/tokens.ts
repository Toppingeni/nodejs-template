import { jwtDecode } from "jwt-decode";
import type { DecodedUser } from "../../shared/types/index";

const TOKEN_KEY = "auth_token";
const STORAGE_HINT_KEY = "auth_storage_hint";

export function saveToken(token: string, remember: boolean): void {
  if (remember) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(STORAGE_HINT_KEY, "local");
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(STORAGE_HINT_KEY);
  } else {
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(STORAGE_HINT_KEY, "session");
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(STORAGE_HINT_KEY);
  }
}

export function getToken(): string | null {
  const hint =
    localStorage.getItem(STORAGE_HINT_KEY) ||
    sessionStorage.getItem(STORAGE_HINT_KEY);

  if (hint === "local") {
    return localStorage.getItem(TOKEN_KEY);
  }

  if (hint === "session") {
    return sessionStorage.getItem(TOKEN_KEY);
  }

  // Fallback: check both storages
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(STORAGE_HINT_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(STORAGE_HINT_KEY);
}

export function decodeToken(token: string): DecodedUser | null {
  try {
    return jwtDecode<DecodedUser>(token);
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwtDecode<{ exp?: number }>(token);
    if (!decoded.exp) return false;
    return Date.now() >= decoded.exp * 1000;
  } catch {
    return true;
  }
}
