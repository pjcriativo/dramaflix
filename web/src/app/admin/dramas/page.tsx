"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "../admin.module.css";

interface DramaItem {
  id: string;
  numero: number;
  titulo: string;
  genero: string;
  sinopse: string;
  gancho: string;
  episodiosTotal: number;
  gratisAte: number;
  moedasPorEpisodio: number;
  classificacao: string;
  dublado: boolean;
  capa: string;
  foto: string;
  banner: string;
  logo: string | null;
  ativo: boolean;
  _count?: {
    episodios: number;
  };
}

export default function AdminDramasPage() {
  const [dramas, setDramas] = useState<DramaItem[]>([]);
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [dramaEditando, setDramaEditando] = useState<DramaItem | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Form states
  const [formTitulo, setFormTitulo] = useState("");
  const [formId, setFormId] = useState("");
  const [formGenero, setFormGenero] = useState("Drama");
  const [formSinopse, setFormSinopse] = useState("");
  const [formGancho, setFormGancho] = useState("");
  const [formEpisodiosTotal, setFormEpisodiosTotal] = useState(60);
  const [formGratisAte, setFormGratisAte] = useState(10);
  const [formMoedasPorEp, setFormMoedasPorEp] = useState(40);
  const [formClassificacao, setFormClassificacao] = useState("A14");
  const [formDublado, setFormDublado] = useState(false);
  const [formCapa, setFormCapa] = useState("");
  const [formFoto, setFormFoto] = useState("");
  const [formBanner, setFormBanner] = useState("");
  const [formAtivo, setFormAtivo] = useState(true);

  const carregarDramas = async () => {
    try {
      const res = await fetch("/api/admin/dramas");
      if (res.ok) {
        const data = await res.json();
        setDramas(data.dramas || []);
      }
    } catch (e) {
      console.error("Erro ao carregar dramas:", e);
    }
  };

  useEffect(() => {
    carregarDramas();
  }, []);

  const abrirNovo = () => {
    setDramaEditando(null);
    setFormTitulo("");
    setFormId("");
    setFormGenero("Romance");
    setFormSinopse("");
    setFormGancho("");
    setFormEpisodiosTotal(60);
    setFormGratisAte(10);
    setFormMoedasPorEp(40);
    setFormClassificacao("A14");
    setFormDublado(false);
    setFormCapa("");
    setFormFoto("");
    setFormBanner("");
    setFormAtivo(true);
    setErro(null);
    setModalAberto(true);
  };

  const abrirEdicao = (d: DramaItem) => {
    setDramaEditando(d);
    setFormTitulo(d.titulo);
    setFormId(d.id);
    setFormGenero(d.genero);
    setFormSinopse(d.sinopse);
    setFormGancho(d.gancho);
    setFormEpisodiosTotal(d.episodiosTotal);
    setFormGratisAte(d.gratisAte);
    setFormMoedasPorEp(d.moedasPorEpisodio);
    setFormClassificacao(d.classificacao);
    setFormDublado(d.dublado);
    setFormCapa(d.capa);
    setFormFoto(d.foto);
    setFormBanner(d.banner);
    setFormAtivo(d.ativo);
    setErro(null);
    setModalAberto(true);
  };

  const salvarDrama = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    setErro(null);

    const payload = {
      titulo: formTitulo,
      id: formId,
      genero: formGenero,
      sinopse: formSinopse,
      gancho: formGancho,
      episodiosTotal: formEpisodiosTotal,
      gratisAte: formGratisAte,
      moedasPorEpisodio: formMoedasPorEp,
      classificacao: formClassificacao,
      dublado: formDublado,
      capa: formCapa || "/capas/placeholder.webp",
      foto: formFoto || "/fotos/placeholder.webp",
      banner: formBanner || "/banners/placeholder.webp",
      ativo: formAtivo,
    };

    try {
      const url = dramaEditando
        ? `/api/admin/dramas/${dramaEditando.id}`
        : "/api/admin/dramas";
      const method = dramaEditando ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setModalAberto(false);
        carregarDramas();
      } else {
        setErro(data.error || "Erro ao salvar série.");
      }
    } catch {
      setErro("Falha de conexão com o servidor.");
    } finally {
      setSalvando(false);
    }
  };

  const excluirDrama = async (id: string, titulo: string) => {
    if (!confirm(`Tem certeza que deseja excluir a série "${titulo}" e todos os seus episódios?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/dramas/${id}`, { method: "DELETE" });
      if (res.ok) {
        carregarDramas();
      } else {
        alert("Erro ao excluir série.");
      }
    } catch {
      alert("Falha de conexão.");
    }
  };

  const dramasFiltrados = dramas.filter(
    (d) =>
      d.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      d.genero.toLowerCase().includes(busca.toLowerCase()) ||
      d.id.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 className={styles.headerTitle}>Catálogo de Séries (Dramas)</h1>
          <p className={styles.headerSubtitle}>
            Cadastre novas séries, edite metadados e gerencie os episódios disponíveis.
          </p>
        </div>
        <button onClick={abrirNovo} className={styles.btnPrimario}>
          + Nova Série
        </button>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          className={styles.input}
          placeholder="Filtrar por título, ID ou gênero..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={{ maxWidth: "400px" }}
        />
      </div>

      <div className={styles.cardTabela}>
        <table className={styles.tabela}>
          <thead>
            <tr>
              <th>Capa</th>
              <th>Título / Slug</th>
              <th>Gênero</th>
              <th>Eps Cadastrados</th>
              <th>Grátis Até</th>
              <th>Preço Ep</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {dramasFiltrados.map((d) => (
              <tr key={d.id}>
                <td style={{ width: "60px" }}>
                  <img
                    src={d.capa}
                    alt={d.titulo}
                    style={{ width: "42px", height: "56px", objectFit: "cover", borderRadius: "4px" }}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        "https://placehold.co/42x56/222/fff?text=Capa";
                    }}
                  />
                </td>
                <td>
                  <div><strong>{d.titulo}</strong></div>
                  <div style={{ fontSize: "0.75rem", color: "#888" }}>ID: {d.id}</div>
                </td>
                <td>{d.genero}</td>
                <td>
                  <strong>{d._count?.episodios ?? d.episodiosTotal}</strong> / {d.episodiosTotal}
                </td>
                <td>Ep. {d.gratisAte}</td>
                <td>{d.moedasPorEpisodio} moedas</td>
                <td>
                  <span
                    className={`${styles.badgePill} ${
                      d.ativo ? styles.badgeVerde : styles.badgeVermelho
                    }`}
                  >
                    {d.ativo ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <Link
                      href={`/admin/dramas/${d.id}`}
                      className={styles.btnPrimario}
                      style={{ fontSize: "0.75rem", padding: "6px 10px" }}
                    >
                      Episódios
                    </Link>
                    <button
                      onClick={() => abrirEdicao(d)}
                      className={styles.btnSecundario}
                      style={{ fontSize: "0.75rem", padding: "6px 10px" }}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => excluirDrama(d.id, d.titulo)}
                      className={styles.btnPerigo}
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

      {/* Modal de Cadastro / Edição */}
      {modalAberto && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCaixa}>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "16px", color: "#fff" }}>
              {dramaEditando ? "Editar Série" : "Cadastrar Nova Série"}
            </h2>

            {erro && <div style={{ color: "#ff6b8b", marginBottom: "16px", fontSize: "0.9rem" }}>{erro}</div>}

            <form onSubmit={salvarDrama}>
              <div className={styles.formGrid}>
                <div className={`${styles.campoGrupo} ${styles.formFull}`}>
                  <label>Título da Série *</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={formTitulo}
                    onChange={(e) => setFormTitulo(e.target.value)}
                    required
                  />
                </div>

                {!dramaEditando && (
                  <div className={styles.campoGrupo}>
                    <label>Slug / ID único (opcional)</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={formId}
                      onChange={(e) => setFormId(e.target.value)}
                      placeholder="ex: amor-proibido"
                    />
                  </div>
                )}

                <div className={styles.campoGrupo}>
                  <label>Gênero *</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={formGenero}
                    onChange={(e) => setFormGenero(e.target.value)}
                    required
                  />
                </div>

                <div className={`${styles.campoGrupo} ${styles.formFull}`}>
                  <label>Gancho curto (uma frase) *</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={formGancho}
                    onChange={(e) => setFormGancho(e.target.value)}
                    placeholder="Frase de impacto para a capa e destaque"
                    required
                  />
                </div>

                <div className={`${styles.campoGrupo} ${styles.formFull}`}>
                  <label>Sinopse completa *</label>
                  <textarea
                    className={`${styles.input} ${styles.textarea}`}
                    value={formSinopse}
                    onChange={(e) => setFormSinopse(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.campoGrupo}>
                  <label>Total de Episódios</label>
                  <input
                    type="number"
                    min={1}
                    className={styles.input}
                    value={formEpisodiosTotal}
                    onChange={(e) => setFormEpisodiosTotal(Number(e.target.value))}
                  />
                </div>

                <div className={styles.campoGrupo}>
                  <label>Grátis até o Episódio</label>
                  <input
                    type="number"
                    min={0}
                    className={styles.input}
                    value={formGratisAte}
                    onChange={(e) => setFormGratisAte(Number(e.target.value))}
                  />
                </div>

                <div className={styles.campoGrupo}>
                  <label>Moedas por Episódio</label>
                  <input
                    type="number"
                    min={0}
                    className={styles.input}
                    value={formMoedasPorEp}
                    onChange={(e) => setFormMoedasPorEp(Number(e.target.value))}
                  />
                </div>

                <div className={styles.campoGrupo}>
                  <label>Classificação Indicativa</label>
                  <select
                    className={styles.input}
                    value={formClassificacao}
                    onChange={(e) => setFormClassificacao(e.target.value)}
                  >
                    <option value="L">Livre (L)</option>
                    <option value="A10">10 anos (A10)</option>
                    <option value="A12">12 anos (A12)</option>
                    <option value="A14">14 anos (A14)</option>
                    <option value="A16">16 anos (A16)</option>
                    <option value="A18">18 anos (A18)</option>
                  </select>
                </div>

                <div className={styles.campoGrupo}>
                  <label>URL da Capa (3:4)</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={formCapa}
                    onChange={(e) => setFormCapa(e.target.value)}
                    placeholder="/capas/exemplo.webp"
                  />
                </div>

                <div className={styles.campoGrupo}>
                  <label>URL do Banner (16:9)</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={formBanner}
                    onChange={(e) => setFormBanner(e.target.value)}
                    placeholder="/banners/exemplo.webp"
                  />
                </div>

                <div className={`${styles.campoGrupo} ${styles.formFull}`} style={{ flexDirection: "row", gap: "20px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={formDublado}
                      onChange={(e) => setFormDublado(e.target.checked)}
                    />
                    Dublado
                  </label>

                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={formAtivo}
                      onChange={(e) => setFormAtivo(e.target.checked)}
                    />
                    Série Ativa no Catálogo
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
                  {salvando ? "Salvando..." : "Salvar Série"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
