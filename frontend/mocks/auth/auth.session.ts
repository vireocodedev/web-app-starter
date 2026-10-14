import { mockAuthUser } from "./auth.fixtures";
import type { AppAuthUser } from "@/app/auth/models/AppAuthUser";

const storageKey = "rgo-template.mock-auth-user-id";
let user: AppAuthUser | null = null;

function readStoredUserId(): string | null {
  try {
    return window.sessionStorage.getItem(storageKey);
  } catch {
    return null;
  }
}

function removeStoredUserId() {
  try {
    window.sessionStorage.removeItem(storageKey);
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }
}

function storeUserId(userId: string) {
  try {
    window.sessionStorage.setItem(storageKey, userId);
  } catch {
    // The in-memory mock session remains usable for the current page.
  }
}

/** Owns the mock-only tab session; only the fixture identity may be persisted. */
export const mockAuthSessionStore = {
  current() {
    return user;
  },
  expire() {
    user = null;
    if (typeof window !== "undefined") removeStoredUserId();
  },
  reset() {
    this.expire();
  },
  restore() {
    if (typeof window !== "undefined" && readStoredUserId() === mockAuthUser.id) user = mockAuthUser;
  },
  start() {
    user = mockAuthUser;
    if (typeof window !== "undefined") storeUserId(mockAuthUser.id);
  },
} as const;
