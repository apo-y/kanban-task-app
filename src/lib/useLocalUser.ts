"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { User } from "./types";

const STORAGE_KEY = "kanban_current_user";
const listeners = new Set<() => void>();

function notifyListeners() {
  for (const listener of listeners) listener();
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

function getSnapshot() {
  return window.localStorage.getItem(STORAGE_KEY);
}

function getServerSnapshot() {
  return null;
}

function parseUser(raw: string | null): User | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function useLocalUser() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const login = useCallback((user: User) => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    notifyListeners();
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    notifyListeners();
  }, []);

  return { user: parseUser(raw), login, logout };
}
