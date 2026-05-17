"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  clearAdminToken,
  getAdminToken,
  setAdminToken as persistAdminToken,
  subscribeAdminSession,
} from "@/lib/adminSession";

type AdminSessionContextValue = {
  token: string | null;
  ready: boolean;
  setToken: (token: string) => void;
  clearToken: () => void;
};

const AdminSessionContext = createContext<AdminSessionContextValue | null>(
  null,
);

function getTokenSnapshot() {
  return getAdminToken();
}

function getReadySnapshot() {
  return true;
}

export function AdminSessionProvider({ children }: { children: ReactNode }) {
  const token = useSyncExternalStore(
    subscribeAdminSession,
    getTokenSnapshot,
    () => null,
  );
  const ready = useSyncExternalStore(
    subscribeAdminSession,
    getReadySnapshot,
    () => false,
  );

  const setToken = useCallback((value: string) => {
    persistAdminToken(value);
  }, []);

  const clearToken = useCallback(() => {
    clearAdminToken();
  }, []);

  const value = useMemo(
    () => ({ token, ready, setToken, clearToken }),
    [token, ready, setToken, clearToken],
  );

  return (
    <AdminSessionContext.Provider value={value}>
      {children}
    </AdminSessionContext.Provider>
  );
}

export function useAdminSession() {
  const ctx = useContext(AdminSessionContext);
  if (!ctx) {
    throw new Error("useAdminSession must be used within AdminSessionProvider");
  }
  return ctx;
}
