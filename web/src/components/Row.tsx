"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { type Fileira, getDrama } from "@/data/catalogo";
import { continuarDoHistorico, type Historico, progressoDoHistorico, useHistorico } from "@/lib/historico";
import { cx } from "@/lib/marca";
import { IconChevronLeft, IconChevronRight } from "./icons";
import { iconeDe } from "./iconesCategoria";
import { PosterCard } from "./PosterCard";
import styles from "./Row.module.css";

/**
 * Fileira horizontal. As capas são dimensionadas pela largura da fileira (container query),
 * sempre mostrando um pedaço da próxima para indicar que dá para rolar.
 * Setas ficam no cabeçalho, nunca por cima das capas.
 * Fileiras abaixo da dobra entram em cascata quando aparecem na tela (uma vez só).
 */
export function Row({ fileira }: { fileira: Fileira }) {
  const historico = useHistorico();
  // "Continuar" mostra só o que foi assistido de verdade neste navegador; vazia, a fileira some
  const itens = fileira.tipo === "continuar" ? continuarDoHistorico(historico) : fileira.itens;
  if (itens.length === 0) return null;
  return <Trilho fileira={fileira} itens={itens} historico={historico} />;
}

function Trilho({ fileira, itens, historico }: { fileira: Fileira; itens: string[]; historico: Historico }) {
  const secaoRef = useRef<HTMLElement>(null);
  const trilhoRef = useRef<HTMLUListElement>(null);
  const [podeEsq, setPodeEsq] = useState(false);
  const [podeDir, setPodeDir] = useState(false);

  const atualizar = useCallback(() => {
    const el = trilhoRef.current;
    if (!el) return;
    setPodeEsq(el.scrollLeft > 4);
    setPodeDir(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = trilhoRef.current;
    atualizar();
    el?.addEventListener("scroll", atualizar, { passive: true });
    window.addEventListener("resize", atualizar);
    return () => {
      el?.removeEventListener("scroll", atualizar);
      window.removeEventListener("resize", atualizar);
    };
  }, [atualizar]);

  // entrada em cascata: só para fileiras que ainda não estão na tela; sem JS, tudo aparece normal
  useEffect(() => {
    const el = secaoRef.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight) return;
    el.dataset.revelar = "espera";
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        el.dataset.revelar = "sim";
        io.disconnect();
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const rolar = (sentido: 1 | -1) => {
    const el = trilhoRef.current;
    if (!el) return;
    el.scrollBy({ left: sentido * el.clientWidth * 0.85, behavior: "smooth" });
  };

  const tituloId = `fileira-${fileira.id}`;
  const top = fileira.tipo === "top";
  const Icone = iconeDe[fileira.id];

  const subtitulos: Record<string, string> = {
    novos: "HAND-PICKED BY OUR EDITORS",
    "em-alta": "TOP TRENDING SHORT DRAMAS",
    dinheiro: "POWER, MONEY & CEO REVENGE",
    vinganca: "REVENGE & DRAMATIC COMEBACKS",
    suspense: "THRILLER, ACTION & MYSTERY",
    leve: "SWEET ROMANCE & COMEDY",
    maratonar: "BINGE-WORTHY COMPLETE SERIES",
  };

  return (
    <section ref={secaoRef} className={styles.row} id={fileira.id} aria-labelledby={tituloId}>
      <div className={styles.cab}>
        <div className={styles.tituloBloco}>
          <h2 id={tituloId} className={styles.titulo}>
            {Icone && <Icone size={24} className={styles.iconeTitulo} />}
            <span>{fileira.titulo}</span>
          </h2>
          {subtitulos[fileira.id] && (
            <span className={styles.subtitulo}>{subtitulos[fileira.id]}</span>
          )}
        </div>
        <div className={styles.ferramentas}>
          {fileira.verTudo && (
            <Link href={fileira.verTudo} className={styles.verTudo}>
              Ver tudo
              <IconChevronRight size={16} />
            </Link>
          )}
          <div className={styles.setas}>
            <button className={styles.seta} onClick={() => rolar(-1)} disabled={!podeEsq} aria-label={`Voltar em ${fileira.titulo}`}>
              <IconChevronLeft size={20} />
            </button>
            <button className={styles.seta} onClick={() => rolar(1)} disabled={!podeDir} aria-label={`Ver mais em ${fileira.titulo}`}>
              <IconChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      <ul ref={trilhoRef} className={cx(styles.trilho, top && styles.trilhoTop)}>
        {itens.map((id, i) => {
          const d = getDrama(id);
          return (
            <li key={id} className={top ? styles.rankItem : undefined} style={{ "--i": i } as React.CSSProperties}>
              {top && (
                <span className={styles.numero} aria-hidden="true">
                  {i + 1}
                </span>
              )}
              {fileira.tipo === "continuar" ? (
                <PosterCard drama={d} variante="continuar" progresso={progressoDoHistorico(historico, id)} />
              ) : (
                <PosterCard drama={d} mostrarTop={!top && d.emAlta <= 3} />
              )}
            </li>
          );
        })}
        <li className={styles.fim} aria-hidden="true" />
      </ul>
    </section>
  );
}
