"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { fileiras } from "@/data/catalogo";
import { useAuth } from "@/contexts/AuthContext";
import { definirNome, recomecar, useCarteira, useMinhaLista, usePerfil } from "@/lib/estado";
import { cx } from "@/lib/marca";
import { useApp } from "./AppProvider";
import {
  IconBookmark,
  IconCheck,
  IconChevronRight,
  IconCoin,
  IconCrown,
  IconHelp,
  IconRepetir,
  IconTv,
  IconUser,
} from "./icons";
import { Row } from "./Row";
import styles from "./Perfil.module.css";

const continuar = fileiras.find((f) => f.tipo === "continuar");

export function Perfil() {
  const { user, isAdmin, logout } = useAuth();
  const { saldo: saldoLocal, vip: vipLocal, plano: planoLocal } = useCarteira();
  const { ids } = useMinhaLista();
  const { nome: nomeLocal } = usePerfil();

  const [editando, setEditando] = useState(false);
  const [rascunho, setRascunho] = useState("");
  const [confirmar, setConfirmar] = useState(false);
  const router = useRouter();
  const { mostrarToast } = useApp();

  const nomeExibicao = user?.name || nomeLocal || "Visitante";
  const emailExibicao = user?.email || null;
  const isVip = user ? user.isVip : vipLocal;
  const planoVip = user ? user.vipPlan : planoLocal;
  const saldoExibicao = user ? user.coinsBalance : saldoLocal;

  const mostrarCampo = !user && (editando || !nomeLocal);

  const itens = [
    ...(isAdmin
      ? [
          {
            href: "/admin",
            rotulo: "Painel de Administração",
            valor: "Admin",
            Icone: IconTv,
            cor: styles.rosa,
            destaque: true,
          },
        ]
      : []),
    {
      href: "/minha-lista",
      rotulo: "Minha lista",
      valor: String(ids.length),
      Icone: IconBookmark,
      cor: styles.rosa,
      destaque: false,
    },
    {
      href: "/moedas",
      rotulo: "Moedas",
      valor: saldoExibicao.toLocaleString("pt-BR"),
      Icone: IconCoin,
      cor: styles.ouro,
      destaque: false,
    },
    {
      href: "/moedas#vip",
      rotulo: "VIP",
      valor: isVip && planoVip ? planoVip.charAt(0).toUpperCase() + planoVip.slice(1) : "",
      Icone: IconCrown,
      cor: styles.ouro,
      destaque: false,
    },
    {
      href: "/ajuda",
      rotulo: "Ajuda",
      valor: "",
      Icone: IconHelp,
      cor: styles.verde,
      destaque: false,
    },
  ];

  const salvar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rascunho.trim()) return;
    definirNome(rascunho);
    setEditando(false);
  };

  const handleLogout = async () => {
    await logout();
    mostrarToast("Você saiu da sua conta");
    router.refresh();
  };

  return (
    <div className="page">
      <h1 className="visually-hidden">Perfil</h1>

      <section className={styles.cabecalho}>
        <span className={styles.avatar} aria-hidden="true">
          {nomeExibicao.charAt(0).toUpperCase()}
        </span>

        <div className={styles.dados}>
          {mostrarCampo ? (
            <form className={styles.form} onSubmit={salvar}>
              <input
                className={styles.campo}
                value={rascunho}
                onChange={(e) => setRascunho(e.target.value)}
                placeholder="Seu nome"
                aria-label="Seu nome"
                maxLength={24}
                autoComplete="given-name"
                enterKeyHint="done"
                autoFocus={editando}
              />
              <button
                className={styles.ok}
                type="submit"
                aria-label="Salvar nome"
                disabled={!rascunho.trim()}
              >
                <IconCheck size={20} />
              </button>
            </form>
          ) : (
            <button
              className={styles.nome}
              onClick={() => {
                if (user) return; // Se autenticado, nome vem da conta
                setRascunho(nomeExibicao);
                setEditando(true);
              }}
              aria-label={`${nomeExibicao}, trocar nome`}
              disabled={Boolean(user)}
            >
              {nomeExibicao}
            </button>
          )}

          {emailExibicao && <p className={styles.email}>{emailExibicao}</p>}

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "6px" }}>
            <p className={cx(styles.status, isVip && styles.vip)}>
              {isVip && <IconCrown size={16} />}
              {isVip ? "VIP" : "Grátis"}
            </p>

            {user && (
              <p className={cx(styles.status, isAdmin ? styles.adminTag : "")}>
                {isAdmin ? "Administrador" : "Cliente"}
              </p>
            )}
          </div>
        </div>
      </section>

      {!user && (
        <div className={styles.bannerAuth}>
          <div className={styles.bannerTexto}>
            <strong>Você está no modo visitante</strong>
            <p>Faça login ou cadastre-se para sincronizar moedas e favoritos.</p>
          </div>
          <Link href="/entrar" className={styles.btnEntrar}>
            Entrar / Cadastrar
          </Link>
        </div>
      )}

      {continuar && (
        <div className={styles.continuar}>
          <Row fileira={continuar} />
        </div>
      )}

      <ul className={styles.menu}>
        {itens.map(({ href, rotulo, valor, Icone, cor, destaque }) => (
          <li key={href}>
            <Link href={href} className={cx(styles.item, destaque && styles.itemAdmin)}>
              <span className={cx(styles.icone, cor)}>
                <Icone size={24} />
              </span>
              <strong className={styles.rotulo}>{rotulo}</strong>
              {valor && <span className={styles.valor}>{valor}</span>}
              <IconChevronRight size={18} className={styles.seta} />
            </Link>
          </li>
        ))}

        {user && (
          <li>
            <button className={styles.item} onClick={handleLogout}>
              <span className={cx(styles.icone, styles.cinza)}>
                <IconUser size={22} />
              </span>
              <strong className={styles.rotulo}>Sair da conta</strong>
              <span className={styles.valor}>{user.email}</span>
            </button>
          </li>
        )}

        <li>
          <button
            className={cx(styles.item, confirmar && styles.perigo)}
            onClick={() => {
              if (!confirmar) return setConfirmar(true);
              recomecar();
              setConfirmar(false);
              setRascunho("");
              mostrarToast("Tudo apagado");
              router.push("/");
            }}
            onBlur={() => setConfirmar(false)}
          >
            <span className={cx(styles.icone, styles.cinza)}>
              <IconRepetir size={22} />
            </span>
            <strong className={styles.rotulo}>
              {confirmar ? "Apagar tudo?" : "Recomeçar"}
            </strong>
            {confirmar && <span className={styles.valor}>Tocar de novo</span>}
          </button>
        </li>
      </ul>
    </div>
  );
}
