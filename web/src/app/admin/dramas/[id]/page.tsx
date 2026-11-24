"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import styles from "../../admin.module.css";

interface EpisodeItem {
  id: string;
  numero: number;
  titulo: string | null;
  videoUrl: string;
  duracaoSegundos: number;
  gratis: boolean;
}

interface DramaDetail {
  id: string;
  titulo: string;
  genero: string;
  capa: string;
  episodiosTotal: number;
  gratisAte: number;
  moedasPorEpisodio: number;
  episodios: EpisodeItem[];
}

export default function AdminDramaEpisodiosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [drama, setDrama] = useState<DramaDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Form states
  const [formNumero, setFormNumero] = useState(1);
  const [formTitulo, setFormTitulo] = useState("");
  const [formVideoUrl, setFormVideoUrl] = useState("");
  const [formDuracao, setFormDuracao] = useState(90);
  const [formGratis, setFormGratis] = useState(true);

  const carregarDetalhes = async () => {
    try {
      const res = await fetch(`/api/admin/dramas/${id}`);
      if (res.ok) {
        const data = await res.json();
        setDrama(data.drama);
      }
    } catch (e) {
      console.error("Erro ao carregar episódios do drama:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDetalhes();
  }, [id]);

  const abrirNovoEpisodio = () => {
    const proximoNum = drama ? (drama.episodios.length > 0 ? Math.max(...drama.episodios.map(e => e.numero)) + 1 : 1) : 1;
    setFormNumero(proximoNum);
    setFormTitulo(`Episódio ${proximoNum}`);
    setFormVideoUrl(`/videos/${id}/ep-${String(proximoNum).padStart(3, "0")}.mp4`);
    setFormDuracao(90);
    setFormGratis(drama ? proximoNum <= drama.gratisAte : true);
    setErro(null);
    setModalAberto(true);
  };

  const abrirEdicaoEpisodio = (ep: EpisodeItem) => {
    setFormNumero(ep.numero);
    setFormTitulo(ep.titulo || `Episódio ${ep.numero}`);
    setFormVideoUrl(ep.videoUrl);
    setFormDuracao(ep.duracaoSegundos);
    setFormGratis(ep.gratis);
    setErro(null);
    setModalAberto(true);
  };

  const salvarEpisodio = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    setErro(null);

    try {
      const res = await fetch(`/api/admin/dramas/${id}/episodios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          numero: formNumero,
          titulo: formTitulo,
          videoUrl: formVideoUrl,
          duracaoSegundos: formDuracao,
          gratis: formGratis,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setModalAberto(false);
        carregarDetalhes();
      } else {
        setErro(data.error || "Erro ao salvar episódio.");
      }
    } catch {
      setErro("Falha de conexão com o servidor.");
    } finally {
      setSalvando(false);
    }
  };

  const excluirEpisodio = async (numero: number) => {
    if (!confirm(`Tem certeza que deseja excluir o Episódio ${numero}?`)) return;

    try {
      const res = await fetch(`/api/admin/dramas/${id}/episodios?numero=${numero}`, {
        method: "DELETE",
      });
      if (res.ok) {
        carregarDetalhes();
      } else {
        alert("Erro ao excluir episódio.");
      }
    } catch {
      alert("Falha de conexão.");
    }
  };

  if (loading) return <div>Carregando episódios...</div>;
  if (!drama) return <div>Drama não encontrado.</div>;

  return (
    <div>
      <div style={{ marginBottom: "16px" }}>
        <Link href="/admin/dramas" className={styles.btnSecundario}>
          ← Voltar para Séries
        </Link>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "20px",
          background: "#161616",
          padding: "20px",
          borderRadius: "12px",
          border: "1px solid #262626",
          marginBottom: "28px",
        }}
      >
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <img
            src={drama.capa}
            alt={drama.titulo}
            style={{ width: "56px", height: "74px", objectFit: "cover", borderRadius: "6px" }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                "https://placehold.co/56x74/222/fff?text=Capa";
            }}
          />
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff", marginBottom: "4px" }}>
              {drama.titulo}
            </h1>
            <p style={{ color: "#888", fontSize: "0.85rem" }}>
              {drama.genero} • {drama.episodios.length} episódios cadastrados • Grátis até ep. {drama.gratisAte} • {drama.moedasPorEpisodio} moedas/ep
            </p>
          </div>
        </div>

        <button onClick={abrirNovoEpisodio} className={styles.btnPrimario}>
          + Novo Episódio
        </button>
      </div>

      <div className={styles.cardTabela}>
        <div className={styles.cardTabelaHeader}>
          <h2 className={styles.cardTabelaTitulo}>Lista de Episódios ({drama.episodios.length})</h2>
        </div>
        <table className={styles.tabela}>
          <thead>
            <tr>
              <th>Nº</th>
              <th>Título</th>
              <th>URL do Vídeo (MP4)</th>
              <th>Duração</th>
              <th>Acesso</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {drama.episodios.map((ep) => (
              <tr key={ep.id}>
                <td><strong>Ep. {ep.numero}</strong></td>
                <td>{ep.titulo || `Episódio ${ep.numero}`}</td>
                <td>
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: "0.8rem",
                      color: "#aaa",
                      maxWidth: "340px",
                      display: "inline-block",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={ep.videoUrl}
                  >
                    {ep.videoUrl}
                  </span>
                </td>
                <td>{ep.duracaoSegundos}s</td>
                <td>
                  <span
                    className={`${styles.badgePill} ${
                      ep.gratis ? styles.badgeVerde : styles.badgeAmarelo
                    }`}
                  >
                    {ep.gratis ? "Grátis" : `${drama.moedasPorEpisodio} moedas`}
                  </span>
                </td>
                <td>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      onClick={() => abrirEdicaoEpisodio(ep)}
                      className={styles.btnSecundario}
                      style={{ fontSize: "0.75rem", padding: "4px 8px" }}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => excluirEpisodio(ep.numero)}
                      className={styles.btnPerigo}
                      style={{ fontSize: "0.75rem", padding: "4px 8px" }}
                    >
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Adicionar / Editar Episódio */}
      {modalAberto && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCaixa} style={{ maxWidth: "500px" }}>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "16px", color: "#fff" }}>
              Episódio {formNumero} - {drama.titulo}
            </h2>

            {erro && <div style={{ color: "#ff6b8b", marginBottom: "16px", fontSize: "0.9rem" }}>{erro}</div>}

            <form onSubmit={salvarEpisodio}>
              <div className={styles.formGrid}>
                <div className={styles.campoGrupo}>
                  <label>Número do Episódio *</label>
                  <input
                    type="number"
                    min={1}
                    className={styles.input}
                    value={formNumero}
                    onChange={(e) => setFormNumero(Number(e.target.value))}
                    required
                  />
                </div>

                <div className={styles.campoGrupo}>
                  <label>Duração (segundos)</label>
                  <input
                    type="number"
                    min={1}
                    className={styles.input}
                    value={formDuracao}
                    onChange={(e) => setFormDuracao(Number(e.target.value))}
                  />
                </div>

                <div className={`${styles.campoGrupo} ${styles.formFull}`}>
                  <label>Título do Episódio</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={formTitulo}
                    onChange={(e) => setFormTitulo(e.target.value)}
                    placeholder={`Episódio ${formNumero}`}
                  />
                </div>

                <div className={`${styles.campoGrupo} ${styles.formFull}`}>
                  <label>URL do Arquivo de Vídeo (MP4) *</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={formVideoUrl}
                    onChange={(e) => setFormVideoUrl(e.target.value)}
                    placeholder="ex: /videos/nome/ep-001.mp4 ou https://..."
                    required
                  />
                </div>

                <div className={`${styles.campoGrupo} ${styles.formFull}`}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={formGratis}
                      onChange={(e) => setFormGratis(e.target.checked)}
                    />
                    Episódio Grátis (sem cobrar moedas)
                  </label>
                </div>
              </div>

              <div className={styles.modalAcoes}>
                <button
                  type="button"
                  className={styles.btnSecundario}
                  onClick={() => setModalAberto(false)}
                  disabled={salvando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={styles.btnPrimario}
                  disabled={salvando}
                >
                  {salvando ? "Salvando..." : "Salvar Episódio"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
