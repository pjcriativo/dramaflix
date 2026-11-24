"use client";

import { existeDrama, getDrama, type Progresso } from "@/data/catalogo";
import { criarArmazenamento } from "./armazenamento";

/** Onde a pessoa parou em cada drama (só neste navegador). */
export interface PontoVisto {
  ep: number;
  /** segundos assistidos do episódio */
  t: number;
  /** duração do episódio em segundos (0 = ainda não começou) */
  dur: number;
  quando: number;
}

export type Historico = Record<string, PontoVisto>;

const historico = criarArmazenamento<Historico>("drama:historico", {});

export const useHistorico = historico.useValor;
export const lerHistorico = historico.ler;

/** Guarda a posição. Episódio terminado vira "próximo episódio, do começo". */
export function salvarPosicao(id: string, ep: number, t: number, dur: number) {
  if (!existeDrama(id) || !Number.isFinite(dur) || dur <= 0) return;
  const total = getDrama(id).episodios;
  const terminou = t >= dur - 1;
  const ponto: PontoVisto = terminou && ep < total ? { ep: ep + 1, t: 0, dur: 0, quando: Date.now() } : { ep, t: Math.max(0, t), dur, quando: Date.now() };
  historico.gravar({ ...historico.ler(), [id]: ponto });

  // Sincroniza em segundo plano com o banco de dados
  if (typeof window !== "undefined") {
    fetch("/api/usuario/historico", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dramaId: id,
        numeroEpisodio: ponto.ep,
        segundos: ponto.t,
      }),
    }).catch(() => {});
  }
}

/** Onde a pessoa parou num drama (só o que ela assistiu de verdade neste navegador). */
export function progressoDoHistorico(h: Historico, id: string): Progresso | undefined {
  const p = h[id];
  return p ? { id, episodio: p.ep, andamento: p.dur > 0 ? Math.min(1, p.t / p.dur) : 0 } : undefined;
}

/** Fileira "Continuar": o que foi visto, do mais recente para o mais antigo. */
export function continuarDoHistorico(h: Historico): string[] {
  return Object.entries(h)
    .filter(([id]) => existeDrama(id))
    .sort((a, b) => b[1].quando - a[1].quando)
    .map(([id]) => id);
}

export function useProgresso(id: string): Progresso | undefined {
  return progressoDoHistorico(useHistorico(), id);
}
