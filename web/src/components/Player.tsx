"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { episodioSaiu, getDrama, lancadoAntes, videoDoEpisodio } from "@/data/catalogo";
import { alternarCurtida, desbloquear, temAcesso, useCarteira, useMinhaLista } from "@/lib/estado";
import { lerHistorico, salvarPosicao, useProgresso } from "@/lib/historico";
import { cx, MARCA } from "@/lib/marca";
import { rotaAssistir } from "@/lib/rotas";
import { useApp } from "./AppProvider";
import { Botao } from "./Botao";
import { EpisodeGrid, type EstadoEpisodio } from "./EpisodeGrid";
import {
  IconAcelerar,
  IconArrowLeft,
  IconCheck,
  IconChevronDown,
  IconChevronUp,
  IconClock,
  IconClose,
  IconCoin,
  IconCrown,
  IconFeed,
  IconGift,
  IconHeart,
  IconInfo,
  IconList,
  IconLock,
  IconPause,
  IconPlay,
  IconPlus,
  IconRepetir,
  IconShare,
  IconTelaCheia,
  IconUnlock,
  IconVelocidade,
  IconVolume,
} from "./icons";
import { Meta } from "./Meta";
import { useNoNavegador } from "./useReducedMotion";
import styles from "./Player.module.css";

const VELOCIDADES = [1, 1.5, 2];
const CONTAGEM_S = 3;
const SEGURAR_MS = 450;

const formatar = (s: number) => {
  const v = Number.isFinite(s) && s > 0 ? s : 0;
  return `${Math.floor(v / 60)}:${String(Math.floor(v % 60)).padStart(2, "0")}`;
};

/**
 * Player vertical 9:16 com vídeo de verdade.
 * Toque: pausa/continua · segurar: 2x · deslizar ↑↓: troca de episódio · fim: próximo em 3 s.
 * Lembra onde a pessoa parou. Episódio bloqueado mostra o paywall no lugar do vídeo;
 * episódio que ainda não saiu mostra "em breve".
 */
export function Player({ id }: { id: string }) {
  const d = getDrama(id);
  const router = useRouter();
  const params = useSearchParams();
  const { abrirModal, alternarLista, mostrarToast } = useApp();
  const carteira = useCarteira();
  const { ids: lista } = useMinhaLista();
  const continuarDe = useProgresso(d.id);
  const noNavegador = useNoNavegador();

  const epUrl = Number(params.get("ep"));
  const ep = Number.isInteger(epUrl) && epUrl >= 1 && epUrl <= d.episodios ? epUrl : 1;
  const acesso = temAcesso(carteira, d, ep);
  const { src: srcPadrao, amostra: amostraPadrao, emBreve: emBrevePadrao } = videoDoEpisodio(d.id, ep);
  const [srcDinamico, setSrcDinamico] = useState<string | null>(null);

  useEffect(() => {
    let montado = true;
    fetch(`/api/episodio?dramaId=${d.id}&ep=${ep}`)
      .then((res) => res.json())
      .then((data) => {
        if (montado && data.encontrado && data.episodio?.videoUrl) {
          setSrcDinamico(data.episodio.videoUrl);
        }
      })
      .catch(() => {});
    return () => {
      montado = false;
    };
  }, [d.id, ep]);

  const src = srcDinamico || srcPadrao;
  const amostra = srcDinamico ? false : amostraPadrao;
  const emBreve = srcDinamico ? false : emBrevePadrao;

  const videoRef = useRef<HTMLVideoElement>(null);
  const quadroRef = useRef<HTMLDivElement>(null);
  const trilhaRef = useRef<HTMLDivElement>(null);
  const ultimaRoda = useRef(0);
  const toque = useRef<{ x: number; y: number } | null>(null);
  const segurarTimer = useRef<number | undefined>(undefined);
  const segurou = useRef(false);
  const ultimoSalvo = useRef(0);
  const preparado = useRef<string | null>(null);

  const [tocando, setTocando] = useState(false);
  const [tempo, setTempo] = useState(0);
  const [duracao, setDuracao] = useState(0);
  const [carregado, setCarregado] = useState(0);
  const [esperando, setEsperando] = useState(true);
  const [erro, setErro] = useState(false);
  const [mudo, setMudo] = useState(false);
  const [somBloqueado, setSomBloqueado] = useState(false);
  const [velocidade, setVelocidade] = useState(1);
  const [acelerado, setAcelerado] = useState(false);
  const [arraste, setArraste] = useState<number | null>(null);
  const [proximoEm, setProximoEm] = useState<number | null>(null);
  const [fim, setFim] = useState(false);
  const [painel, setPainel] = useState(false);
  const [semSaldo, setSemSaldo] = useState(false);
  const [telaCheia, setTelaCheia] = useState(false);
  const [flash, setFlash] = useState<{ n: number; pausou: boolean } | null>(null);
  const [episodioDoEstado, setEpisodioDoEstado] = useState(ep);

  // trocou de episódio: zera o estado do vídeo (estado derivado durante a renderização)
  if (episodioDoEstado !== ep) {
    setEpisodioDoEstado(ep);
    setTempo(0);
    setDuracao(0);
    setCarregado(0);
    setEsperando(true);
    setErro(false);
    setProximoEm(null);
    setFim(false);
    setSemSaldo(false);
    setArraste(null);
    setFlash(null);
  }

  const ir = (n: number) => {
    const alvo = Math.max(1, Math.min(d.episodios, n));
    if (alvo === ep) return;
    router.replace(rotaAssistir(d.id, alvo), { scroll: false });
    setPainel(false);
  };

  const salvar = (forcar = false) => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    const agora = performance.now();
    if (!forcar && agora - ultimoSalvo.current < 2000) return;
    ultimoSalvo.current = agora;
    salvarPosicao(d.id, ep, v.currentTime, v.duration);
  };

  /* ---------- começar a tocar (com som se o navegador deixar; senão, mudo + aviso) ---------- */
  const tocar = async () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = mudo;
    v.playbackRate = acelerado ? 2 : velocidade;
    try {
      await v.play();
    } catch (e) {
      if (e instanceof DOMException && e.name === "NotAllowedError" && !v.muted) {
        v.muted = true;
        setMudo(true);
        setSomBloqueado(true);
        try {
          await v.play();
        } catch {
          /* continua pausado: o botão de play aparece no meio */
        }
      }
    }
  };

  const tentarTocar = useEffectEvent(() => void tocar());

  useEffect(() => {
    if (acesso && src) tentarTocar();
  }, [acesso, src, ep]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = mudo;
  }, [mudo]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = acelerado ? 2 : velocidade;
  }, [velocidade, acelerado, ep]);

  // ao sair do episódio (troca ou fechar), guarda onde parou
  useEffect(() => {
    const v = videoRef.current;
    return () => {
      if (v && v.duration && !v.ended) salvarPosicao(d.id, ep, v.currentTime, v.duration);
    };
  }, [d.id, ep, acesso]);

  /**
   * Prepara o vídeo (uma vez por episódio): duração e "continuar de onde parou".
   * Roda em vários eventos, não só no loadedmetadata: numa navegação pelo site esse
   * primeiro evento pode chegar antes da tela ficar ativa, e a barra ficava em 0:00 / 0:00.
   */
  const prepararVideo = (v: HTMLVideoElement) => {
    if (!Number.isFinite(v.duration) || v.duration <= 0) return;
    if (v.duration !== duracao) setDuracao(v.duration);
    const chave = `${d.id}-${ep}`;
    if (preparado.current === chave) return;
    preparado.current = chave;
    const p = lerHistorico()[d.id];
    if (p && p.ep === ep && p.t > 3 && p.t < v.duration - 3 && v.currentTime < 1) {
      v.currentTime = p.t;
      setTempo(p.t);
      mostrarToast(`Continuando de ${formatar(p.t)}`);
    }
  };

  const atualizarBuffer = (v: HTMLVideoElement) => {
    if (v.buffered.length && v.duration) setCarregado(v.buffered.end(v.buffered.length - 1) / v.duration);
  };

  /* ---------- fim do episódio: contagem de 3 s para o próximo (se ele já saiu) ---------- */
  const aoTerminar = () => {
    const v = videoRef.current;
    if (v?.duration) salvarPosicao(d.id, ep, v.duration, v.duration);
    if (ep < d.episodios && episodioSaiu(d.id, ep + 1)) setProximoEm(CONTAGEM_S);
    else setFim(true);
  };

  // "Rever": no fim da série volta ao ep. 1; no fim do que já saiu, repete este episódio
  const rever = () => {
    if (ep === d.episodios) return ir(1);
    const v = videoRef.current;
    setFim(false);
    if (v) {
      v.currentTime = 0;
      void v.play().catch(() => {});
    }
  };

  const avancar = useEffectEvent(() => ir(ep + 1));

  useEffect(() => {
    if (proximoEm === null) return;
    const t = window.setTimeout(() => {
      if (proximoEm <= 1) avancar();
      else setProximoEm(proximoEm - 1);
    }, 1000);
    return () => window.clearTimeout(t);
  }, [proximoEm]);

  /* ---------- controles ---------- */
  const alternar = () => {
    const v = videoRef.current;
    if (!v) return;
    if (somBloqueado) {
      // o primeiro toque depois do bloqueio de som liga o som, sem pausar
      setMudo(false);
      setSomBloqueado(false);
      if (v.paused) void v.play().catch(() => {});
      return;
    }
    setProximoEm(null);
    setFim(false);
    if (v.paused || v.ended) {
      void v.play().catch(() => {});
      setFlash({ n: Date.now(), pausou: false });
    } else {
      v.pause();
      setFlash({ n: Date.now(), pausou: true });
    }
  };

  const pular = (s: number) => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    v.currentTime = Math.max(0, Math.min(v.duration - 0.2, v.currentTime + s));
    setTempo(v.currentTime);
  };

  const alternarSom = () => {
    setSomBloqueado(false);
    setMudo((m) => !m);
  };

  const trocarVelocidade = () => {
    const prox = VELOCIDADES[(VELOCIDADES.indexOf(velocidade) + 1) % VELOCIDADES.length];
    setVelocidade(prox);
    mostrarToast(`Velocidade ${prox.toLocaleString("pt-BR")}x`);
  };

  const alternarTelaCheia = () => {
    const el = quadroRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    else void el.requestFullscreen?.().catch(() => {});
  };

  useEffect(() => {
    const aoMudar = () => setTelaCheia(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", aoMudar);
    return () => document.removeEventListener("fullscreenchange", aoMudar);
  }, []);

  // segurar o vídeo = 2x enquanto o dedo estiver em cima (como nos apps de vídeo curto)
  const comecarSegurar = (e: React.PointerEvent) => {
    segurou.current = false;
    toque.current = { x: e.clientX, y: e.clientY };
    window.clearTimeout(segurarTimer.current);
    segurarTimer.current = window.setTimeout(() => {
      if (!videoRef.current || videoRef.current.paused) return;
      segurou.current = true;
      setAcelerado(true);
    }, SEGURAR_MS);
  };

  const moverSegurar = (e: React.PointerEvent) => {
    const t = toque.current;
    if (t && Math.hypot(e.clientX - t.x, e.clientY - t.y) > 12) window.clearTimeout(segurarTimer.current);
  };

  const soltarSegurar = () => {
    window.clearTimeout(segurarTimer.current);
    if (segurou.current) setAcelerado(false);
  };

  // barra de tempo arrastável
  const fracaoDe = (clientX: number) => {
    const r = trilhaRef.current?.getBoundingClientRect();
    return r && r.width ? Math.min(1, Math.max(0, (clientX - r.left) / r.width)) : 0;
  };

  const soltarArraste = () => {
    const v = videoRef.current;
    if (arraste !== null && v && duracao) {
      v.currentTime = Math.min(duracao - 0.2, arraste * duracao);
      setTempo(v.currentTime);
      setProximoEm(null);
    }
    setArraste(null);
  };

  /* ---------- teclado ---------- */
  const aoTeclar = useEffectEvent((e: KeyboardEvent) => {
    if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;
    const alvo = e.target as HTMLElement | null;
    if (alvo?.closest?.("input, textarea, select")) return;
    if (alvo?.closest?.("button, a") && (e.key === " " || e.key === "Enter")) return;
    switch (e.key) {
      case " ":
      case "k":
      case "K":
        e.preventDefault();
        alternar();
        break;
      case "ArrowLeft":
        e.preventDefault();
        pular(-5);
        break;
      case "ArrowRight":
        e.preventDefault();
        pular(5);
        break;
      case "ArrowDown":
        e.preventDefault();
        ir(ep + 1);
        break;
      case "ArrowUp":
        e.preventDefault();
        ir(ep - 1);
        break;
      case "m":
      case "M":
        alternarSom();
        break;
      case "f":
      case "F":
        alternarTelaCheia();
        break;
      case "Escape":
        if (painel) setPainel(false);
        else if (!document.fullscreenElement) router.push("/");
        break;
    }
  });

  useEffect(() => {
    const ouvir = (e: KeyboardEvent) => aoTeclar(e);
    window.addEventListener("keydown", ouvir);
    return () => window.removeEventListener("keydown", ouvir);
  }, []);

  /* ---------- controles da tela de bloqueio do celular ---------- */
  const irEvento = useEffectEvent((n: number) => ir(n));
  const pularEvento = useEffectEvent((s: number) => pular(s));

  useEffect(() => {
    if (!("mediaSession" in navigator) || typeof MediaMetadata === "undefined") return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: `${d.titulo} · Ep. ${ep}`,
      artist: MARCA.nome,
      artwork: [{ src: d.capa, sizes: "600x800", type: "image/jpeg" }],
    });
    const acoes: [MediaSessionAction, MediaSessionActionHandler][] = [
      ["play", () => void videoRef.current?.play()],
      ["pause", () => videoRef.current?.pause()],
      ["previoustrack", () => irEvento(ep - 1)],
      ["nexttrack", () => irEvento(ep + 1)],
      ["seekbackward", () => pularEvento(-10)],
      ["seekforward", () => pularEvento(10)],
    ];
    for (const [acao, fazer] of acoes) {
      try {
        navigator.mediaSession.setActionHandler(acao, fazer);
      } catch {
        /* ação não suportada neste navegador */
      }
    }
    return () => {
      for (const [acao] of acoes) {
        try {
          navigator.mediaSession.setActionHandler(acao, null);
        } catch {
          /* idem */
        }
      }
    };
  }, [d.titulo, d.capa, ep]);

  const aoRolar = (e: React.WheelEvent) => {
    const agora = performance.now();
    if (agora - ultimaRoda.current < 700 || Math.abs(e.deltaY) < 40) return;
    ultimaRoda.current = agora;
    ir(ep + (e.deltaY > 0 ? 1 : -1));
  };

  const estadoDe = (n: number): EstadoEpisodio => {
    if (!episodioSaiu(d.id, n)) return "emBreve";
    if (!temAcesso(carteira, d, n)) return "bloqueado";
    if (n === ep) return "atual";
    if (n < ep) return "visto";
    return "livre";
  };

  // na grade, episódio que não saiu só avisa (não tira a pessoa do que está vendo)
  const escolherEp = (n: number) => (episodioSaiu(d.id, n) ? ir(n) : mostrarToast(`Ep. ${n} em breve`, "emBreve"));

  const comprar = () => {
    const r = desbloquear(d, ep);
    if (r === "sem-saldo") setSemSaldo(true);
    else mostrarToast(`Ep. ${ep} liberado`, "desbloqueio");
  };

  const compartilhar = async () => {
    const url = `${window.location.origin}${rotaAssistir(d.id, ep)}`;
    try {
      await navigator.clipboard.writeText(url);
      mostrarToast("Link copiado", "link");
    } catch {
      mostrarToast(url, "link");
    }
  };

  const naLista = lista.includes(d.id);
  const curtiu = carteira.curtidas.includes(d.id);
  // último episódio antes deste que a pessoa pode ver (grátis, comprado ou VIP)
  const ultimoLivre = lancadoAntes(d.id, ep, (n) => temAcesso(carteira, d, n));
  const fracao = arraste ?? (duracao ? tempo / duracao : 0);
  const proximoBloqueado = ep < d.episodios && !temAcesso(carteira, d, ep + 1);
  const podeTelaCheia = noNavegador && document.fullscreenEnabled;
  const mostrarPlay = acesso && src && !tocando && !esperando && !erro && proximoEm === null && !fim;
  // aviso "em breve": abriu um episódio que não saiu, ou acabou o último que saiu
  const aguardando = emBreve || (fim && ep < d.episodios);
  const epAguardado = emBreve ? ep : ep + 1;
  const voltarPara = lancadoAntes(d.id, ep);

  return (
    <div className={styles.tela}>
      <div className={styles.palco}>
        {/* ---------- quadro 9:16 ---------- */}
        <div
          ref={quadroRef}
          className={styles.quadro}
          onWheel={aoRolar}
          onTouchStart={(e) => (toque.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
          onTouchEnd={(e) => {
            const t = toque.current;
            if (!t) return;
            const dy = e.changedTouches[0].clientY - t.y;
            const dx = e.changedTouches[0].clientX - t.x;
            toque.current = null;
            if (Math.abs(dy) > 60 && Math.abs(dy) > Math.abs(dx)) ir(ep + (dy < 0 ? 1 : -1));
          }}
        >
          <div className={styles.fundo} aria-hidden="true">
            <Image src={d.foto} alt="" fill sizes="60vw" />
          </div>

          {acesso && src ? (
            <video
              key={`${d.id}-${ep}`}
              ref={videoRef}
              className={styles.video}
              src={src}
              poster={d.foto}
              playsInline
              preload="auto"
              aria-label={`${d.titulo}, episódio ${ep}`}
              onPlay={() => setTocando(true)}
              onPause={() => {
                setTocando(false);
                salvar(true);
              }}
              onPlaying={() => setEsperando(false)}
              onCanPlay={(e) => {
                setEsperando(false);
                prepararVideo(e.currentTarget);
              }}
              onWaiting={() => setEsperando(true)}
              onLoadedMetadata={(e) => prepararVideo(e.currentTarget)}
              onDurationChange={(e) => prepararVideo(e.currentTarget)}
              onTimeUpdate={(e) => {
                const v = e.currentTarget;
                if (arraste === null) setTempo(v.currentTime);
                if (esperando && !v.paused && v.readyState >= 3) setEsperando(false);
                prepararVideo(v);
                salvar();
              }}
              onProgress={(e) => atualizarBuffer(e.currentTarget)}
              onEnded={aoTerminar}
              onError={() => {
                setErro(true);
                setEsperando(false);
              }}
            />
          ) : (
            <Image src={d.foto} alt="" fill sizes="(min-width: 960px) 520px, 100vw" className={styles.foto} preload />
          )}
          <span className={styles.veu} aria-hidden="true" />

          {/* área de toque: pausa/continua; segurar = 2x */}
          {acesso && src && (
            <button
              className={styles.alternar}
              aria-label={tocando ? "Pausar" : "Assistir"}
              onPointerDown={comecarSegurar}
              onPointerMove={moverSegurar}
              onPointerUp={soltarSegurar}
              onPointerLeave={soltarSegurar}
              onPointerCancel={soltarSegurar}
              onContextMenu={(e) => e.preventDefault()}
              onClick={() => {
                if (segurou.current) {
                  segurou.current = false;
                  return;
                }
                alternar();
              }}
            >
              {mostrarPlay && (
                <span className={styles.botaoCentral}>
                  <IconPlay size={36} />
                </span>
              )}
              {flash && !mostrarPlay && (
                <span key={flash.n} className={styles.flash} aria-hidden="true">
                  {flash.pausou ? <IconPause size={34} /> : <IconPlay size={34} />}
                </span>
              )}
            </button>
          )}

          {acesso && src && esperando && !erro && <span className={styles.carregando} role="status" aria-label="Carregando" />}

          <header className={styles.topo}>
            <Link href="/" className={styles.redondo} aria-label="Voltar ao início">
              <IconArrowLeft size={22} />
            </Link>
            <div className={styles.topoTexto}>
              <p className={styles.topoTitulo}>{d.titulo}</p>
              <p className={styles.topoEp}>
                Ep. {ep} / {d.episodios}
              </p>
            </div>
            {acesso && src && (
              <div className={styles.topoAcoes}>
                <button className={styles.redondo} onClick={alternarSom} aria-label={mudo ? "Ligar o som" : "Tirar o som"} aria-pressed={!mudo}>
                  <IconVolume size={22} mudo={mudo} />
                </button>
                {podeTelaCheia && (
                  <button className={cx(styles.redondo, styles.soDesktop)} onClick={alternarTelaCheia} aria-label={telaCheia ? "Sair da tela cheia" : "Tela cheia"}>
                    <IconTelaCheia size={20} sair={telaCheia} />
                  </button>
                )}
              </div>
            )}
          </header>

          {/* avisos curtos no topo */}
          <div className={styles.avisos}>
            {amostra && acesso && src && <span className={styles.previa}>Vídeo de exemplo</span>}
            {somBloqueado && (
              <button className={styles.chipSom} onClick={alternarSom}>
                <IconVolume size={18} mudo />
                Ativar som
              </button>
            )}
            {acelerado && (
              <span className={styles.chip2x}>
                <IconAcelerar size={18} />
                2x
              </span>
            )}
          </div>

          {/* ações laterais (somem no paywall e no "em breve": uma decisão de cada vez) */}
          {acesso && !aguardando && (
            <div className={styles.lateral}>
              <button className={styles.acao} onClick={() => (alternarCurtida(d.id) ? mostrarToast("Curtido", "curtida") : mostrarToast("Curtida tirada"))} aria-pressed={curtiu}>
                <span className={cx(styles.acaoIcone, curtiu && styles.acaoOn)}>
                  <IconHeart size={24} cheio={curtiu} />
                </span>
                Curtir
              </button>
              <button className={styles.acao} onClick={() => alternarLista(d.id)} aria-pressed={naLista}>
                <span className={cx(styles.acaoIcone, naLista && styles.acaoOn)}>{naLista ? <IconCheck size={24} /> : <IconPlus size={24} />}</span>
                Lista
              </button>
              <button className={cx(styles.acao, styles.soCelular)} onClick={() => setPainel(true)}>
                <span className={styles.acaoIcone}>
                  <IconList size={22} />
                </span>
                Episódios
              </button>
              <button className={styles.acao} onClick={trocarVelocidade} aria-label={`Velocidade ${velocidade.toLocaleString("pt-BR")}x`}>
                <span className={cx(styles.acaoIcone, velocidade !== 1 && styles.acaoOn)}>
                  <IconVelocidade size={22} />
                </span>
                {velocidade.toLocaleString("pt-BR")}x
              </button>
              <button className={styles.acao} onClick={compartilhar}>
                <span className={styles.acaoIcone}>
                  <IconShare size={22} />
                </span>
                Enviar
              </button>
            </div>
          )}

          {/* base: barra de tempo e troca de episódio */}
          <footer className={styles.base}>
            <div className={styles.baseLinha}>
              <button className={styles.trocar} onClick={() => ir(ep - 1)} disabled={ep === 1} aria-label="Episódio anterior">
                <IconChevronUp size={20} />
              </button>
              <div
                ref={trilhaRef}
                className={cx(styles.trilha, arraste !== null && styles.trilhaAtiva)}
                role="slider"
                tabIndex={acesso && src ? 0 : -1}
                aria-label="Posição no episódio"
                aria-valuemin={0}
                aria-valuemax={Math.round(duracao)}
                aria-valuenow={Math.round(fracao * duracao)}
                aria-valuetext={`${formatar(fracao * duracao)} de ${formatar(duracao)}`}
                aria-disabled={!acesso || !src}
                onTouchStart={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
                onPointerDown={(e) => {
                  if (!acesso || !src || !duracao) return;
                  try {
                    e.currentTarget.setPointerCapture(e.pointerId);
                  } catch {
                    /* ponteiro já solto: arrasta sem captura */
                  }
                  setArraste(fracaoDe(e.clientX));
                }}
                onPointerMove={(e) => {
                  if (arraste !== null) setArraste(fracaoDe(e.clientX));
                }}
                onPointerUp={soltarArraste}
                onPointerCancel={() => setArraste(null)}
              >
                <span className={styles.trilhaFundo}>
                  <span className={styles.buffer} style={{ transform: `scaleX(${carregado})` }} />
                  <span className={styles.preenchido} style={{ transform: `scaleX(${fracao})` }} />
                </span>
                <span className={styles.bolinha} style={{ left: `${fracao * 100}%` }} />
                {arraste !== null && (
                  <span className={styles.bolha} style={{ left: `${fracao * 100}%` }}>
                    {formatar(fracao * duracao)}
                  </span>
                )}
              </div>
              <button className={styles.trocar} onClick={() => ir(ep + 1)} disabled={ep === d.episodios} aria-label="Próximo episódio">
                <IconChevronDown size={20} />
              </button>
            </div>
            <p className={styles.tempo}>
              {formatar(fracao * duracao)} / {formatar(duracao)}
            </p>
          </footer>

          {/* fim do episódio: próximo em 3 s */}
          {proximoEm !== null && (
            <div className={styles.proximo} role="status">
              <p className={styles.proximoRotulo}>Próximo</p>
              <button className={styles.proximoBotao} onClick={() => ir(ep + 1)} aria-label={`Assistir o episódio ${ep + 1} agora`}>
                <svg className={styles.anel} viewBox="0 0 80 80" aria-hidden="true">
                  <circle cx="40" cy="40" r="36" className={styles.anelFundo} />
                  <circle key={ep} cx="40" cy="40" r="36" className={styles.anelProgresso} style={{ animationDuration: `${CONTAGEM_S}s` }} />
                </svg>
                <IconPlay size={30} />
              </button>
              <p className={styles.proximoEp}>
                {proximoBloqueado && <IconLock size={18} />}
                Ep. {ep + 1}
              </p>
              <button className={styles.cancelar} onClick={() => setProximoEm(null)}>
                Cancelar
              </button>
            </div>
          )}

          {/* erro ao carregar */}
          {erro && (
            <div className={styles.cartaz} role="alert">
              <p>O vídeo não carregou</p>
              <Botao
                variante="claro"
                tamanho="m"
                icone={<IconRepetir size={18} />}
                onClick={() => {
                  setErro(false);
                  setEsperando(true);
                  videoRef.current?.load();
                  void tocar();
                }}
              >
                Tentar de novo
              </Botao>
            </div>
          )}

          {/* paywall (não vale para episódio que ainda não saiu) */}
          {!acesso && !emBreve && (
            <div className={styles.paywall} role="dialog" aria-label={`Episódio ${ep} bloqueado`}>
              <span className={styles.cadeado}>
                <IconLock size={30} />
              </span>
              <h2>Ep. {ep}</h2>
              <p className={styles.fichas}>
                <span className={styles.ficha}>
                  <IconGift size={16} />1 a {d.gratisAte} grátis
                </span>
                <span className={styles.ficha} aria-label={`Seu saldo: ${carteira.saldo} moedas`}>
                  <IconCoin size={16} />
                  {carteira.saldo}
                </span>
              </p>
              <div className={styles.paywallBotoes}>
                {semSaldo ? (
                  <Botao href="/moedas" variante="destaque" icone={<IconCoin size={18} />} bloco>
                    Comprar moedas
                  </Botao>
                ) : (
                  <Botao variante="destaque" icone={<IconUnlock size={18} />} onClick={comprar} bloco>
                    Liberar por {d.moedasPorEpisodio}
                  </Botao>
                )}
                <Botao href="/moedas#vip" variante="ouro" icone={<IconCrown size={18} />} bloco>
                  VIP
                </Botao>
                <Botao variante="contorno" icone={<IconArrowLeft size={16} />} onClick={() => ir(ultimoLivre)} bloco>
                  Voltar ao ep. {ultimoLivre}
                </Botao>
              </div>
              {semSaldo && <p className={styles.semSaldo}>Moedas insuficientes.</p>}
            </div>
          )}

          {/* em breve: o episódio ainda não saiu */}
          {aguardando && (
            <div className={styles.paywall} role="status" aria-label={`Episódio ${epAguardado} em breve`}>
              <span className={cx(styles.cadeado, styles.relogio)}>
                <IconClock size={36} />
              </span>
              <h2>Ep. {epAguardado}</h2>
              <p className={styles.fichas}>
                <span className={cx(styles.ficha, styles.fichaNeutra)}>Em breve</span>
              </p>
              <div className={styles.paywallBotoes}>
                {emBreve ? (
                  <Botao variante="claro" icone={<IconArrowLeft size={16} />} onClick={() => ir(voltarPara)} bloco>
                    Voltar ao ep. {voltarPara}
                  </Botao>
                ) : (
                  <Botao variante="claro" icone={<IconRepetir size={18} />} onClick={rever} bloco>
                    Rever ep. {ep}
                  </Botao>
                )}
                <Botao variante="contorno" icone={naLista ? <IconCheck size={18} /> : <IconPlus size={18} />} onClick={() => alternarLista(d.id)} bloco>
                  {naLista ? "Na Minha lista" : "Minha lista"}
                </Botao>
                <Botao href="/para-voce" variante="contorno" icone={<IconFeed size={18} />} bloco>
                  Outro drama
                </Botao>
              </div>
            </div>
          )}

          {/* fim da série */}
          {fim && ep === d.episodios && (
            <div className={styles.cartaz}>
              <p>Fim da série</p>
              <div className={styles.cartazBotoes}>
                <Botao href="/para-voce" variante="claro" tamanho="m" icone={<IconFeed size={20} />}>
                  Outro drama
                </Botao>
                <Botao variante="contorno" tamanho="m" icone={<IconRepetir size={18} />} onClick={rever}>
                  Rever
                </Botao>
              </div>
            </div>
          )}
        </div>

        {/* ---------- painel lateral (desktop) / folha (celular) ---------- */}
        <aside className={cx(styles.painel, painel && styles.painelAberto)} aria-label="Episódios">
          <div className={styles.painelCab}>
            <Image src={d.logo.src} alt={d.titulo} width={d.logo.w} height={d.logo.h} sizes="320px" className={styles.painelLogo} />
            <button className={cx(styles.fecharPainel, styles.soCelular)} onClick={() => setPainel(false)} aria-label="Fechar episódios">
              <IconClose size={20} />
            </button>
          </div>
          <Meta drama={d} duracao tamanho="p" className={styles.painelMeta} />
          <p className={styles.painelSinopse}>{d.gancho}</p>
          <Botao variante="neutro" tamanho="p" icone={<IconInfo size={18} />} onClick={() => abrirModal(d.id)}>
            Detalhes
          </Botao>
          <h2 className={styles.painelTitulo}>Episódios</h2>
          <EpisodeGrid drama={d} estadoDe={estadoDe} selecionado={ep} onEscolher={escolherEp} foco={ep} compacto />
          {continuarDe && continuarDe.episodio !== ep && (
            <p className={styles.dica}>
              <IconPlay size={12} /> Parou no ep. {continuarDe.episodio} · <button onClick={() => ir(continuarDe.episodio)}>Ir</button>
            </p>
          )}
        </aside>
        {painel && <button className={styles.cortina} aria-label="Fechar episódios" onClick={() => setPainel(false)} />}
      </div>
    </div>
  );
}
