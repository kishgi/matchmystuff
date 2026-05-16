"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  clearAdminToken,
  getAdminToken,
  setAdminToken as persistAdminToken,
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

export function AdminSessionProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setTokenState(getAdminToken());
    setReady(true);
  }, []);

  const setToken = useCallback((value: string) => {
    persistAdminToken(value);
    setTokenState(value);
  }, []);

  const clearToken = useCallback(() => {
    clearAdminToken();
    setTokenState(null);
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
