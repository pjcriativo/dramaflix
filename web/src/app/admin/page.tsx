"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./admin.module.css";

interface Stats {
  totalDramas: number;
  totalEpisodios: number;
  totalUsuarios: number;
  totalDesbloqueios: number;
  ultimosUsuarios: Array<{
    id: string;
    email: string;
    name: string | null;
    role: string;
    coinsBalance: number;
    createdAt: string;
  }>;
  ultimosDramas: Array<{
    id: string;
    titulo: string;
    genero: string;
    capa: string;
    episodiosTotal: number;
    ativo: boolean;
  }>;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarStats() {
      try {
        const res = await fetch("/api/admin/stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Erro ao carregar stats:", err);
      } finally {
        setLoading(false);
      }
    }
    carregarStats();
  }, []);

  if (loading) {
    return <div>Carregando métricas da plataforma...</div>;
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1 className={styles.headerTitle}>Visão Geral do Painel</h1>
          <p className={styles.headerSubtitle}>
            Acompanhe as métricas de catálogo, episódios e usuários do Dramaflix.
          </p>
        </div>
        <Link href="/admin/dramas" className={styles.btnPrimario}>
          + Cadastrar Nova Série
        </Link>
      </div>

      <div className={styles.gridMetricas}>
        <div className={styles.cardMetrica}>
          <span className={styles.metricaLabel}>Total de Séries</span>
          <span className={styles.metricaValor}>{stats?.totalDramas ?? 0}</span>
        </div>

        <div className={styles.cardMetrica}>
          <span className={styles.metricaLabel}>Total de Episódios</span>
          <span className={styles.metricaValor}>{stats?.totalEpisodios ?? 0}</span>
        </div>

        <div className={styles.cardMetrica}>
          <span className={styles.metricaLabel}>Usuários Cadastrados</span>
          <span className={styles.metricaValor}>{stats?.totalUsuarios ?? 0}</span>
        </div>

        <div className={styles.cardMetrica}>
          <span className={styles.metricaLabel}>Episódios Desbloqueados</span>
          <span className={styles.metricaValor}>{stats?.totalDesbloqueios ?? 0}</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        <div className={styles.cardTabela}>
          <div className={styles.cardTabelaHeader}>
            <h2 className={styles.cardTabelaTitulo}>Séries Recentes</h2>
            <Link href="/admin/dramas" className={styles.btnSecundario}>
              Ver Todas
            </Link>
          </div>
          <table className={styles.tabela}>
            <thead>
              <tr>
                <th>Título</th>
                <th>Gênero</th>
                <th>Episódios</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {stats?.ultimosDramas.map((drama) => (
                <tr key={drama.id}>
                  <td>
                    <strong>{drama.titulo}</strong>
                  </td>
                  <td>{drama.genero}</td>
                  <td>{drama.episodiosTotal} eps</td>
                  <td>
                    <Link
                      href={`/admin/dramas/${drama.id}`}
                      className={styles.btnSecundario}
                      style={{ fontSize: "0.75rem", padding: "4px 8px" }}
                    >
                      Episódios
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.cardTabela}>
          <div className={styles.cardTabelaHeader}>
            <h2 className={styles.cardTabelaTitulo}>Últimos Usuários</h2>
            <Link href="/admin/usuarios" className={styles.btnSecundario}>
              Ver Todos
            </Link>
          </div>
          <table className={styles.tabela}>
            <thead>
              <tr>
                <th>Usuário</th>
                <th>Papel</th>
                <th>Saldo</th>
              </tr>
            </thead>
            <tbody>
              {stats?.ultimosUsuarios.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div><strong>{u.name || "Sem nome"}</strong></div>
                    <div style={{ fontSize: "0.75rem", color: "#888" }}>{u.email}</div>
                  </td>
                  <td>
                    <span
                      className={`${styles.badgePill} ${
                        u.role === "ADMIN" ? styles.badgeVermelho : styles.badgeVerde
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td>{u.coinsBalance} moedas</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
