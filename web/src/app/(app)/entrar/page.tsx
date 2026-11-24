"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import styles from "./entrar.module.css";

function FormularioAutenticacao() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/perfil";

  const { login, register } = useAuth();
  const [modo, setModo] = useState<"login" | "cadastro">("login");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    try {
      if (modo === "login") {
        const res = await login(email, senha);
        if (res.ok) {
          router.push(redirect);
          router.refresh();
        } else {
          setErro(res.error || "Não foi possível entrar.");
        }
      } else {
        const res = await register(nome, email, senha);
        if (res.ok) {
          router.push(redirect);
          router.refresh();
        } else {
          setErro(res.error || "Não foi possível criar a conta.");
        }
      }
    } catch {
      setErro("Ocorreu um erro inesperado. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  };

  const usarCredenciaisDemo = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setSenha(demoPass);
    setErro(null);
    setCarregando(true);
    const res = await login(demoEmail, demoPass);
    if (res.ok) {
      router.push(redirect);
      router.refresh();
    } else {
      setErro(res.error || "Falha ao entrar com credenciais de demonstração.");
      setCarregando(false);
    }
  };

  return (
    <div className={styles.cartao}>
      <div className={styles.cabecalho}>
        <h1 className={styles.titulo}>
          {modo === "login" ? "Entrar na sua conta" : "Criar uma conta"}
        </h1>
        <p className={styles.subtitulo}>
          {modo === "login"
            ? "Acesse seus dramas favoritos, moedas e histórico."
            : "Cadastre-se para sincronizar seus dados em qualquer dispositivo."}
        </p>
      </div>

      <div className={styles.abas}>
        <button
          type="button"
          className={`${styles.aba} ${modo === "login" ? styles.abaAtiva : ""}`}
          onClick={() => {
            setModo("login");
            setErro(null);
          }}
        >
          Entrar
        </button>
        <button
          type="button"
          className={`${styles.aba} ${modo === "cadastro" ? styles.abaAtiva : ""}`}
          onClick={() => {
            setModo("cadastro");
            setErro(null);
          }}
        >
          Cadastre-se
        </button>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        {erro && <div className={styles.erro}>{erro}</div>}

        {modo === "cadastro" && (
          <div className={styles.campoGrupo}>
            <label className={styles.rotulo} htmlFor="nome">
              Nome de exibição
            </label>
            <input
              id="nome"
              type="text"
              className={styles.input}
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Maria Silva"
              required
            />
          </div>
        )}

        <div className={styles.campoGrupo}>
          <label className={styles.rotulo} htmlFor="email">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            className={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            required
          />
        </div>

        <div className={styles.campoGrupo}>
          <label className={styles.rotulo} htmlFor="senha">
            Senha
          </label>
          <input
            id="senha"
            type="password"
            className={styles.input}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Sua senha secreta"
            required
            minLength={6}
          />
        </div>

        <button
          type="submit"
          className={styles.botaoPrincipal}
          disabled={carregando}
        >
          {carregando
            ? "Processando..."
            : modo === "login"
            ? "Acessar Plataforma"
            : "Finalizar Cadastro"}
        </button>
      </form>

      <div className={styles.divisor}>Contas de Teste</div>

      <div className={styles.demos}>
        <button
          type="button"
          className={styles.botaoDemo}
          onClick={() => usarCredenciaisDemo("admin@dramaflix.com", "admin123")}
        >
          <span>Admin (Acesso Total + Painel)</span>
          <span className={styles.tagDemo}>ADMIN</span>
        </button>

        <button
          type="button"
          className={styles.botaoDemo}
          onClick={() => usarCredenciaisDemo("usuario@dramaflix.com", "user123")}
        >
          <span>Cliente Padrão (120 moedas)</span>
          <span className={styles.tagDemo}>CLIENTE</span>
        </button>
      </div>
    </div>
  );
}

export default function EntrarPage() {
  return (
    <div className={styles.container}>
      <Suspense fallback={<div className={styles.cartao}>Carregando...</div>}>
        <FormularioAutenticacao />
      </Suspense>
    </div>
  );
}
