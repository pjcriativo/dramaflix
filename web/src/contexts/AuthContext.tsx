"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: "USER" | "ADMIN" | string;
  coinsBalance: number;
  isVip: boolean;
  vipPlan: string | null;
  createdAt?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  sincronizarDados: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  isAdmin: false,
  login: async () => ({ ok: false, error: "Não inicializado" }),
  register: async () => ({ ok: false, error: "Não inicializado" }),
  logout: async () => {},
  refreshUser: async () => {},
  sincronizarDados: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const sincronizarDados = useCallback(async () => {
    try {
      const res = await fetch("/api/usuario/dados", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (!data.autenticado) return;

      setUser(data.user);

      if (typeof window !== "undefined") {
        // 1. Sincroniza Carteira (saldo, vip, episódios desbloqueados e curtidas)
        const rawCarteira = window.localStorage.getItem("drama:carteira");
        const carteiraAtual = rawCarteira ? JSON.parse(rawCarteira) : {};
        const novaCarteira = {
          ...carteiraAtual,
          saldo: data.user.coinsBalance,
          vip: data.user.isVip,
          plano: data.user.vipPlan,
          desbloqueados: { ...carteiraAtual.desbloqueados, ...data.desbloqueados },
          curtidas: Array.from(new Set([...(carteiraAtual.curtidas || []), ...(data.curtidas || [])])),
        };
        window.localStorage.setItem("drama:carteira", JSON.stringify(novaCarteira));

        // 2. Sincroniza Minha Lista (favoritos)
        if (data.favoritos && data.favoritos.length > 0) {
          const rawLista = window.localStorage.getItem("drama:minha-lista-v2");
          const listaAtual = rawLista ? JSON.parse(rawLista) : { ids: [] };
          const novaLista = {
            ids: Array.from(new Set([...listaAtual.ids, ...data.favoritos])),
          };
          window.localStorage.setItem("drama:minha-lista-v2", JSON.stringify(novaLista));
        }

        // 3. Sincroniza Histórico de onde parou
        if (data.historico && Object.keys(data.historico).length > 0) {
          const rawHist = window.localStorage.getItem("drama:historico");
          const histAtual = rawHist ? JSON.parse(rawHist) : {};
          const novoHist = { ...histAtual };
          for (const [dramaId, ponto] of Object.entries(data.historico as Record<string, { ep: number; t: number }>)) {
            if (!novoHist[dramaId] || novoHist[dramaId].ep <= ponto.ep) {
              novoHist[dramaId] = {
                ep: ponto.ep,
                t: ponto.t,
                dur: 90,
                quando: Date.now(),
              };
            }
          }
          window.localStorage.setItem("drama:historico", JSON.stringify(novoHist));
        }

        // Notifica hooks locais do React
        window.dispatchEvent(new Event("storage"));
      }
    } catch (e) {
      console.error("Erro ao sincronizar dados em nuvem:", e);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        if (data.user) {
          await sincronizarDados();
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [sincronizarDados]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (res.ok && data.ok) {
          setUser(data.user);
          await sincronizarDados();
          return { ok: true };
        }
        return { ok: false, error: data.error || "Falha ao entrar." };
      } catch {
        return { ok: false, error: "Erro de conexão ao tentar fazer login." };
      }
    },
    [sincronizarDados]
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        const data = await res.json();
        if (res.ok && data.ok) {
          setUser(data.user);
          await sincronizarDados();
          return { ok: true };
        }
        return { ok: false, error: data.error || "Falha ao criar conta." };
      } catch {
        return { ok: false, error: "Erro de conexão ao tentar criar conta." };
      }
    },
    [sincronizarDados]
  );

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
    }
  }, []);

  const isAdmin = user?.role === "ADMIN";

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        login,
        register,
        logout,
        refreshUser,
        sincronizarDados,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
