"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { destaques, getDrama } from "@/data/catalogo";
import { useMinhaLista } from "@/lib/estado";
import { cx } from "@/lib/marca";
import { rotaAssistir } from "@/lib/rotas";
import { useApp } from "./AppProvider";
import { Botao, BotaoIcone } from "./Botao";
import { Meta } from "./Meta";
import { IconCheck, IconGift, IconInfo, IconPlay, IconPlus } from "./icons";
import { useReducedMotion } from "./useReducedMotion";
import styles from "./Billboard.module.css";

const DURACAO_MS = 9000;

/**
 * Destaque da home (billboard), no modelo Netflix.
 * Desktop: banner 16:9 de fundo, com o texto na área livre da esquerda.
 * Tablet: banner 16:9 em cima e o texto embaixo.
 * Celular: foto 3:4 com o logo por cima e as ações embaixo.
 */
export function Billboard() {
  const { setDestaqueId, abrirModal, modal, alternarLista } = useApp();
  const { ids: lista } = useMinhaLista();
  const itens = destaques.map(getDrama);
  const [atual, setAtual] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [ciclo, setCiclo] = useState(0);
  const reduz = useReducedMotion();
  // só carrega a arte que está na tela e a próxima; as outras entram quando chega a vez
  const [carregados, setCarregados] = useState(() => new Set([0, 1 % itens.length]));
  const proximo = (atual + 1) % itens.length;
  if (!carregados.has(atual) || !carregados.has(proximo)) {
    // ajuste durante a renderização (sem efeito): marca a atual e a próxima como carregadas
    setCarregados(new Set([...carregados, atual, proximo]));
  }
  const carregar = (i: number) => carregados.has(i);
  const d = itens[atual];
  const rodando = !pausado && !modal && !reduz;
  const naLista = lista.includes(d.id);

  useEffect(() => {
    setDestaqueId(d.id);
  }, [d.id, setDestaqueId]);


  useEffect(() => {
    if (!rodando) return;
    const t = window.setTimeout(() => setAtual((x) => (x + 1) % itens.length), DURACAO_MS);
    return () => window.clearTimeout(t);
  }, [atual, rodando, itens.length, ciclo]);

  const irPara = (i: number) => {
    setAtual(i);
    setCiclo((c) => c + 1);
  };

  return (
    <section
      className={styles.billboard}
      aria-roledescription="carrossel"
      aria-label="Destaques"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => {
        setPausado(false);
        setCiclo((c) => c + 1);
      }}
    >
      {/* banner 16:9 (tablet e desktop) */}
      <div className={styles.banner} aria-hidden="true">
        {itens.map((x, i) => (
          <div key={x.id} className={cx(styles.camada, i === atual && styles.on)}>
            {carregar(i) && (
              <Image
                src={x.banner}
                alt=""
                fill
                sizes="(min-width: 960px) calc(100vw - 92px), 100vw"
                preload={i === 0}
                className={styles.bannerImg}
              />
            )}
          </div>
        ))}
        <div className={styles.veu} />
        {itens.map((x, i) => (
          <span key={`l-${x.id}`} className={cx(styles.logoBanner, i === atual && styles.on)}>
            {carregar(i) && <Image src={x.logo.src} alt="" width={x.logo.w} height={x.logo.h} sizes="40vw" />}
          </span>
        ))}
      </div>

      {/* foto 3:4 (celular) */}
      <div className={styles.foto} aria-hidden="true">
        {itens.map((x, i) => (
          <div key={x.id} className={cx(styles.camada, i === atual && styles.on)} style={{ backgroundColor: x.cor }}>
            {carregar(i) && <Image src={x.foto} alt="" fill sizes="100vw" className={styles.fotoImg} />}
          </div>
        ))}
        {itens.map((x, i) => (
          <span key={`l-${x.id}`} className={cx(styles.logoFoto, i === atual && styles.on)}>
            {carregar(i) && <Image src={x.logo.src} alt="" width={x.logo.w} height={x.logo.h} sizes="84vw" />}
          </span>
        ))}
      </div>

      {/* texto */}
      <div className={styles.palco}>
        <div className={styles.texto}>
          <div className={styles.anim} key={d.id}>
            {d.emAlta <= 10 && (
              <p className={styles.rank}>
                <span className={styles.top} aria-hidden="true">
                  <small>TOP</small>10
                </span>
                Nº {d.emAlta} hoje
              </p>
            )}

            <h1 className={styles.titulo}>
              <Image src={d.logo.src} alt={d.titulo} width={d.logo.w} height={d.logo.h} sizes="(min-width: 960px) 460px, 1px" className={styles.tituloLogo} />
            </h1>

            <div className={styles.meta}>
              <Meta drama={d} genero />
            </div>

            <p className={styles.sinopse}>{d.gancho}</p>

            <div className={styles.acoes}>
              <Botao href={rotaAssistir(d.id, 1)} variante="destaque" tamanho="g" icone={<IconPlay size={22} />} className={styles.bb}>
                Assistir Agora
              </Botao>
              <Botao variante="neutro" tamanho="g" icone={<IconInfo size={22} />} onClick={() => abrirModal(d.id)} className={styles.bb}>
                Detalhes
              </Botao>
              <BotaoIcone
                tamanho="g"
                rotulo={naLista ? "Remover da Minha lista" : "Adicionar à Minha lista"}
                ativo={naLista}
                onClick={() => alternarLista(d.id)}
                className={styles.bbRedondo}
              >
                {naLista ? <IconCheck size={22} /> : <IconPlus size={22} />}
              </BotaoIcone>
            </div>

            {/* celular: Minha lista · Assistir · Detalhes */}
            <div className={styles.acoesCel}>
              <button className={styles.lateral} onClick={() => alternarLista(d.id)} aria-pressed={naLista}>
                {naLista ? <IconCheck size={26} /> : <IconPlus size={26} />}
                <span>Minha lista</span>
              </button>
              <Botao href={rotaAssistir(d.id, 1)} variante="destaque" tamanho="m" icone={<IconPlay size={20} />}>
                Assistir
              </Botao>
              <button className={styles.lateral} onClick={() => abrirModal(d.id)}>
                <IconInfo size={26} />
                <span>Detalhes</span>
              </button>
            </div>

            <p className={styles.gratis}>
              <IconGift size={20} />
              {d.gratisAte} ep. grátis
            </p>
          </div>

          <div className={styles.pontos} role="tablist" aria-label="Escolher destaque">
            {itens.map((x, i) => (
              <button
                key={x.id}
                role="tab"
                aria-selected={i === atual}
                aria-label={x.titulo}
                className={cx(styles.ponto, i === atual && styles.pontoOn)}
                onClick={() => irPara(i)}
              >
                {i === atual && <span key={`${atual}-${ciclo}`} className={cx(styles.preenche, !rodando && styles.parado)} />}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
