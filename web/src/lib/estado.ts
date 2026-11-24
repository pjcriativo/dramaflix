"use client";

import type { Drama } from "@/data/catalogo";
import { apagarTudo, criarArmazenamento } from "./armazenamento";

// ---------- Minha lista ----------
const lista = criarArmazenamento<{ ids: string[] }>("drama:minha-lista-v2", { ids: [] });

export const useMinhaLista = lista.useValor;

/** Adiciona ou remove; devolve true se o título ficou na lista. */
export function alternarLista(id: string): boolean {
  const { ids } = lista.ler();
  const estava = ids.includes(id);
  lista.gravar({ ids: estava ? ids.filter((x) => x !== id) : [id, ...ids] });

  // Sincroniza em segundo plano com o banco se o usuário estiver logado
  if (typeof window !== "undefined") {
    fetch("/api/usuario/favoritos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dramaId: id }),
    }).catch(() => {});
  }

  return !estava;
}

// ---------- Carteira (moedas, VIP, episódios desbloqueados, curtidas) ----------
export interface Carteira {
  saldo: number;
  vip: boolean;
  /** plano VIP ativo (semanal, mensal, anual) */
  plano: string | null;
  desbloqueados: Record<string, number[]>;
  curtidas: string[];
}

const SALDO_INICIAL = 120;

const carteira = criarArmazenamento<Carteira>("drama:carteira", {
  saldo: SALDO_INICIAL,
  vip: false,
  plano: null,
  desbloqueados: {},
  curtidas: [],
});

export const useCarteira = carteira.useValor;

export function temAcesso(c: Carteira, d: Drama, ep: number): boolean {
  return ep <= d.gratisAte || c.vip || (c.desbloqueados[d.id]?.includes(ep) ?? false);
}

export function desbloquear(d: Drama, ep: number): "ok" | "ja" | "sem-saldo" {
  const c = carteira.ler();
  if (temAcesso(c, d, ep)) return "ja";
  if (c.saldo < d.moedasPorEpisodio) return "sem-saldo";

  const novosDesbloqueados = {
    ...c.desbloqueados,
    [d.id]: [...(c.desbloqueados[d.id] ?? []), ep],
  };

  carteira.gravar({
    ...c,
    saldo: c.saldo - d.moedasPorEpisodio,
    desbloqueados: novosDesbloqueados,
  });

  // Sincroniza com o banco de dados (desconto real de moedas e registro de transação)
  if (typeof window !== "undefined") {
    fetch("/api/usuario/desbloquear", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dramaId: d.id, numeroEpisodio: ep }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.novoSaldo !== undefined) {
          const atual = carteira.ler();
          carteira.gravar({ ...atual, saldo: data.novoSaldo });
        }
      })
      .catch(() => {});
  }

  return "ok";
}

/** Simulação e persistência: adiciona moedas e sincroniza com o banco se logado. */
export function adicionarMoedas(quantidade: number, valor?: number) {
  const c = carteira.ler();
  carteira.gravar({ ...c, saldo: c.saldo + quantidade });

  if (typeof window !== "undefined") {
    fetch("/api/usuario/moedas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo: "RECARGA", quantidade, valor: valor || 0 }),
    }).catch(() => {});
  }
}

/** Define VIP e sincroniza com o banco se logado. `null` cancela o VIP. */
export function definirVip(plano: string | null) {
  carteira.gravar({ ...carteira.ler(), vip: plano !== null, plano });

  if (typeof window !== "undefined" && plano !== null) {
    fetch("/api/usuario/moedas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo: "VIP", plano }),
    }).catch(() => {});
  }
}

// ---------- Perfil (nome de exibição) ----------
const perfil = criarArmazenamento<{ nome: string }>("drama:perfil", { nome: "" });

export const usePerfil = perfil.useValor;

export function definirNome(nome: string) {
  perfil.gravar({ nome: nome.trim().slice(0, 24) });
}

/** Apaga dados locais neste aparelho. */
export function recomecar() {
  apagarTudo();
  try {
    Object.keys(window.localStorage)
      .filter((k) => k.startsWith("drama:"))
      .forEach((k) => window.localStorage.removeItem(k));
  } catch {
    /* armazenamento indisponível */
  }
}

export function alternarCurtida(id: string): boolean {
  const c = carteira.ler();
  const curtiu = c.curtidas.includes(id);
  carteira.gravar({
    ...c,
    curtidas: curtiu ? c.curtidas.filter((x) => x !== id) : [...c.curtidas, id],
  });
  return !curtiu;
}
