"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./admin.module.css";

interface Stats {
  receitaTotal: string;
  novosCadastros: string;
  totalUsuarios: number;
  totalViews: string;
  totalCompras: number;
  totalDramas: number;
  totalEpisodios: number;
  topSeries: Array<{
    rank: string;
    id: string;
    title: string;
    views: string;
  }>;
  latestEpisodes: Array<{
    id: string;
    titulo: string;
    tag: string;
    data: string;
  }>;
  systemHealth: Array<{
    name: string;
    status: string;
  }>;
  coinEconomy: {
    circulando: number;
    gastas: number;
    percentualCirculando: number;
  };
  revenueChart: Array<{
    data: string;
    valor: number;
  }>;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState("1month");

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
    return (
      <div style={{ padding: "40px", color: "#888", display: "grid", placeItems: "center", minHeight: "400px" }}>
        <p>Carregando telemetria e métricas do sistema...</p>
      </div>
    );
  }

  // Preparação de pontos para o gráfico SVG de Receita
  const chartPoints = stats?.revenueChart || [];
  const svgWidth = 700;
  const svgHeight = 200;
  const paddingX = 40;
  const paddingY = 25;
  const plotWidth = svgWidth - paddingX * 2;
  const plotHeight = svgHeight - paddingY * 2;
  const maxVal = 3.5;

  const points = chartPoints.map((p, i) => {
    const x = paddingX + (i / Math.max(1, chartPoints.length - 1)) * plotWidth;
    const y = svgHeight - paddingY - (p.valor / maxVal) * plotHeight;
    return { x, y, ...p };
  });

  const pathD = points.reduce((acc, pt, i, arr) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`;
    const prev = arr[i - 1];
    const cx = (prev.x + pt.x) / 2;
    return `${acc} C ${cx} ${prev.y}, ${cx} ${pt.y}, ${pt.x} ${pt.y}`;
  }, "");

  const fillD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${svgHeight - paddingY} L ${points[0].x} ${svgHeight - paddingY} Z`
    : "";

  // Donut chart math
  const circPercent = stats?.coinEconomy?.percentualCirculando ?? 70;
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeCirculando = (circPercent / 100) * circumference;

  return (
    <div>
      {/* Header SnapReels v2.0 */}
      <div className={styles.dashboardHeader}>
        <div className={styles.dashboardHeaderLeft}>
          <h1>
            Dashboard <span className={styles.badgeV2}>V2.0</span>
          </h1>
          <p className={styles.dashboardSubtitle}>
            Engine Statistics & Telemetry
          </p>
        </div>

        <div className={styles.dashboardControls}>
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className={styles.periodSelect}
          >
            <option value="1month">1 month</option>
            <option value="7days">7 days</option>
            <option value="today">Today</option>
            <option value="all">All Time</option>
          </select>
          <button
            type="button"
            className={styles.periodSelect}
            style={{ padding: "8px 12px" }}
            title="Filtros de telemetria"
          >
            ⚙
          </button>
        </div>
      </div>

      {/* Grid de 5 Métricas */}
      <div className={styles.metricGrid5}>
        <div className={styles.metricCardSnap}>
          <div className={styles.metricCardHeader}>
            <span className={styles.metricLabelSnap}>Total Revenue</span>
            <div className={`${styles.metricIconCircle} ${styles.iconRed}`}>$</div>
          </div>
          <div className={styles.metricValueSnap}>${stats?.receitaTotal ?? "0.00"}</div>
        </div>

        <div className={styles.metricCardSnap}>
          <div className={styles.metricCardHeader}>
            <span className={styles.metricLabelSnap}>New Registrations</span>
            <div className={`${styles.metricIconCircle} ${styles.iconBlue}`}>👤</div>
          </div>
          <div className={styles.metricValueSnap}>{stats?.novosCadastros ?? "+0"}</div>
        </div>

        <div className={styles.metricCardSnap}>
          <div className={styles.metricCardHeader}>
            <span className={styles.metricLabelSnap}>Total Users</span>
            <div className={`${styles.metricIconCircle} ${styles.iconGreen}`}>👥</div>
          </div>
          <div className={styles.metricValueSnap}>{stats?.totalUsuarios ?? 0}</div>
        </div>

        <div className={styles.metricCardSnap}>
          <div className={styles.metricCardHeader}>
            <span className={styles.metricLabelSnap}>Total Views</span>
            <div className={`${styles.metricIconCircle} ${styles.iconPurple}`}>👁</div>
          </div>
          <div className={styles.metricValueSnap}>{stats?.totalViews ?? "0"}</div>
        </div>

        <div className={styles.metricCardSnap}>
          <div className={styles.metricCardHeader}>
            <span className={styles.metricLabelSnap}>Total Purchases</span>
            <div className={`${styles.metricIconCircle} ${styles.iconEmerald}`}>💰</div>
          </div>
          <div className={styles.metricValueSnap}>{stats?.totalCompras ?? 0}</div>
        </div>
      </div>

      {/* Grid Principal de 2 Colunas */}
      <div className={styles.dashboardTwoCols}>
        {/* Coluna Esquerda: Gráfico de Receita + Tabela de Top Séries */}
        <div>
          {/* Gráfico de Receita */}
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <div className={styles.chartTitle}>
                <span style={{ color: "#ec1c5b" }}>📊</span> Revenue Chart
              </div>
            </div>

            <div style={{ position: "relative", width: "100%" }}>
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className={styles.chartSvg}
              >
                <defs>
                  <linearGradient id="blueGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.45" />
                    <stop offset="80%" stopColor="#3b82f6" stopOpacity="0.05" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Linhas de Grade Horizontais */}
                {[3, 2.25, 1.5, 0.75, 0].map((val) => {
                  const y = svgHeight - paddingY - (val / maxVal) * plotHeight;
                  return (
                    <g key={val}>
                      <line
                        x1={paddingX}
                        y1={y}
                        x2={svgWidth - paddingX}
                        y2={y}
                        stroke="#1c1c24"
                        strokeDasharray="4 4"
                      />
                      <text
                        x={paddingX - 10}
                        y={y + 4}
                        fill="#555566"
                        fontSize="10"
                        textAnchor="end"
                      >
                        {val}
                      </text>
                    </g>
                  );
                })}

                {/* Área preenchida com gradiente */}
                {fillD && <path d={fillD} fill="url(#blueGlow)" />}

                {/* Linha curva principal */}
                {pathD && (
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                )}

                {/* Pontos nos picos */}
                {points.map((pt, i) => (
                  <circle
                    key={i}
                    cx={pt.x}
                    cy={pt.y}
                    r={pt.valor > 2 ? 4 : 2}
                    fill={pt.valor > 2 ? "#60a5fa" : "#3b82f6"}
                    stroke="#121217"
                    strokeWidth="1.5"
                  />
                ))}
              </svg>

              {/* Rótulos do Eixo X */}
              <div className={styles.chartAxis}>
                {chartPoints.map((p, i) => (
                  <span key={i} style={{ opacity: i % 2 === 0 ? 1 : 0.6 }}>
                    {p.data}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Tabela de Top Séries (Views) */}
          <div className={styles.topSeriesCard}>
            <div className={styles.topSeriesHeader}>
              <div className={styles.chartTitle}>
                <span style={{ color: "#ec1c5b" }}>▶</span> Top Series (Views)
              </div>
              <Link
                href="/admin/dramas"
                className={styles.btnSecundario}
                style={{ fontSize: "0.78rem", padding: "4px 10px" }}
              >
                Gerenciar Catálogo
              </Link>
            </div>

            <table className={styles.tabela}>
              <thead>
                <tr>
                  <th style={{ width: "90px" }}>Rank</th>
                  <th>Title</th>
                  <th style={{ textAlign: "right", width: "130px" }}>Views</th>
                </tr>
              </thead>
              <tbody>
                {stats?.topSeries?.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <span style={{ color: "#777788", fontWeight: 700 }}>
                        {s.rank}
                      </span>
                    </td>
                    <td>
                      <Link
                        href={`/admin/dramas/${s.id}`}
                        style={{ color: "#fff", textDecoration: "none", fontWeight: 600 }}
                      >
                        {s.title}
                      </Link>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <span className={styles.badgeViews}>{s.views}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Coluna Direita: Latest Episodes + System Health + Coin Economy */}
        <div>
          {/* Latest Episodes */}
          <div className={styles.sideWidgetCard}>
            <div className={styles.sideWidgetTitle}>
              <span>⏱</span> Latest Episodes
            </div>
            <div>
              {stats?.latestEpisodes && stats.latestEpisodes.length > 0 ? (
                stats.latestEpisodes.map((ep) => (
                  <div key={ep.id} className={styles.latestEpItem}>
                    <span className={styles.latestEpTitle} title={ep.titulo}>
                      {ep.titulo}
                    </span>
                    <span className={styles.badgeNow}>Now</span>
                  </div>
                ))
              ) : (
                <p style={{ color: "#666", fontSize: "0.85rem" }}>
                  Nenhum episódio cadastrado recentemente.
                </p>
              )}
            </div>
          </div>

          {/* System Health */}
          <div className={styles.sideWidgetCard}>
            <div className={styles.sideWidgetTitle}>
              <span>⚡</span> System Health
            </div>
            <div className={styles.healthList}>
              {stats?.systemHealth?.map((srv, idx) => (
                <div key={idx} className={styles.healthItem}>
                  <div className={styles.healthItemLeft}>
                    <span className={styles.dotGreen} />
                    <span>{srv.name}</span>
                  </div>
                  <span className={styles.badgeOperational}>
                    {srv.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Coin Economy */}
          <div className={styles.sideWidgetCard}>
            <div className={styles.sideWidgetTitle}>
              <span>🪙</span> Coin Economy
            </div>
            <div className={styles.donutWrapper}>
              <svg viewBox="0 0 140 140" width="130" height="130">
                {/* Círculo de Fundo (Moedas Gastas) */}
                <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="transparent"
                  stroke="#374151"
                  strokeWidth="16"
                />
                {/* Arco de Moedas em Circulação */}
                <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="transparent"
                  stroke="#a855f7"
                  strokeWidth="16"
                  strokeDasharray={`${strokeCirculando} ${circumference}`}
                  strokeDashoffset={circumference / 4}
                  strokeLinecap="round"
                />
                <text
                  x="70"
                  y="68"
                  fill="#fff"
                  fontSize="18"
                  fontWeight="800"
                  textAnchor="middle"
                >
                  {circPercent}%
                </text>
                <text
                  x="70"
                  y="84"
                  fill="#888899"
                  fontSize="9"
                  fontWeight="700"
                  textAnchor="middle"
                  style={{ textTransform: "uppercase" }}
                >
                  Ativas
                </text>
              </svg>

              <div className={styles.donutLegend}>
                <div>
                  <span className={styles.legendDotCirculando} />
                  <span>Circulating</span>
                </div>
                <div>
                  <span className={styles.legendDotGastas} style={{ background: "#4b5563" }} />
                  <span>Spent</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
