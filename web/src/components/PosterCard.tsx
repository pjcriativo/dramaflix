"use client";

import Image from "next/image";
import Link from "next/link";
import { type Drama, type Progresso, rotuloSelo } from "@/data/catalogo";
import { alternarLista, useMinhaLista } from "@/lib/estado";
import { cx } from "@/lib/marca";
import { rotaAssistir } from "@/lib/rotas";
import { useApp } from "./AppProvider";
import { IconBookmark, IconEpisodios, IconPlay } from "./icons";
import styles from "./PosterCard.module.css";

interface Props {
  drama: Drama;
  /** "continuar" leva direto ao player no episódio em que a pessoa parou */
  variante?: "padrao" | "continuar";
  progresso?: Progresso;
  /** selo TOP 10 no canto (fora do ranking) */
  mostrarTop?: boolean;
  /** "fileira" usa a largura calculada da fileira; "grade" ocupa a célula inteira */
  layout?: "fileira" | "grade";
  sizes?: string;
}

const SIZES = "(min-width: 1900px) 300px, (min-width: 960px) 24vw, (min-width: 560px) 32vw, 46vw";

/** Capa 3:4 SnapReels com VIP badge no canto superior esquerdo e botão de bookmark no canto superior direito. */
export function PosterCard({ drama: d, variante = "padrao", progresso, mostrarTop, layout = "fileira", sizes = SIZES }: Props) {
  const { abrirModal } = useApp();
  const { ids: lista } = useMinhaLista();
  const salvo = lista.includes(d.id);
  const continuar = variante === "continuar" && progresso;

  const arte = (
    <span className={styles.arte} style={{ backgroundColor: d.cor }}>
      <Image src={d.capa} alt="" fill sizes={sizes} className={styles.img} />
      <span className={styles.sombra} aria-hidden="true" />

      {/* Selo VIP SnapReels ou selo específico da série */}
      {!continuar && (
        <span className={styles.vipBadge}>
          {d.selo ? rotuloSelo[d.selo] : "VIP"}
        </span>
      )}

      {/* Botão de Salvar / Favorito no canto superior direito */}
      {!continuar && (
        <button
          type="button"
          className={cx(styles.bookmarkBtn, salvo && styles.bookmarkBtnSalvo)}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            alternarLista(d.id);
          }}
          aria-label={salvo ? "Remover dos favoritos" : "Salvar nos favoritos"}
          title={salvo ? "Salvo nos favoritos" : "Salvar nos favoritos"}
        >
          <IconBookmark size={15} />
        </button>
      )}

      {mostrarTop && d.emAlta <= 10 && (
        <span className={styles.top} aria-hidden="true">
          <small>TOP</small>10
        </span>
      )}

      {continuar ? (
        <>
          <span className={styles.ep}>
            <IconPlay size={13} />
            Ep. {progresso.episodio}
          </span>
          <span className={styles.barra} aria-hidden="true">
            <span style={{ width: `${Math.round(((progresso.episodio - 1 + progresso.andamento) / d.episodios) * 100)}%` }} />
          </span>
        </>
      ) : (
        <span className={styles.contador}>
          <IconEpisodios size={16} />
          {d.episodios} ep.
        </span>
      )}

      <span className={styles.play} aria-hidden="true">
        <IconPlay size={24} />
      </span>
    </span>
  );

  return (
    <div className={cx(styles.card, layout === "grade" && styles.grade)}>
      {continuar ? (
        <Link href={rotaAssistir(d.id, progresso.episodio)} className={styles.alvo} aria-label={`Continuar ${d.titulo}, episódio ${progresso.episodio}`}>
          {arte}
        </Link>
      ) : (
        <button type="button" className={styles.alvo} onClick={() => abrirModal(d.id)} aria-label={`${d.titulo}, ${d.episodios} episódios`}>
          {arte}
        </button>
      )}
      <h3 className={styles.tit}>{d.titulo}</h3>
    </div>
  );
}
