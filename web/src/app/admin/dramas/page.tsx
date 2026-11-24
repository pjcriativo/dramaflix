"use client";

import { useEffect, useRef, useState } from "react";
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

interface UploadInfo {
  tamanhoOriginal: string;
  tamanhoOtimizado: string;
  reducao: string;
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
  const [formGenero, setFormGenero] = useState("Romance");
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

  // Upload states
  const [enviandoCapa, setEnviandoCapa] = useState(false);
  const [enviandoBanner, setEnviandoBanner] = useState(false);
  const [infoCapa, setInfoCapa] = useState<UploadInfo | null>(null);
  const [infoBanner, setInfoBanner] = useState<UploadInfo | null>(null);
  const [modoManualCapa, setModoManualCapa] = useState(false);
  const [modoManualBanner, setModoManualBanner] = useState(false);

  const inputCapaRef = useRef<HTMLInputElement>(null);
  const inputBannerRef = useRef<HTMLInputElement>(null);

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
    setInfoCapa(null);
    setInfoBanner(null);
    setModoManualCapa(false);
    setModoManualBanner(false);
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
    setInfoCapa(null);
    setInfoBanner(null);
    setModoManualCapa(false);
    setModoManualBanner(false);
    setErro(null);
    setModalAberto(true);
  };

  const processarUpload = async (arquivo: File, tipo: "capa" | "banner") => {
    if (tipo === "capa") setEnviandoCapa(true);
    else setEnviandoBanner(true);

    const formData = new FormData();
    formData.append("file", arquivo);
    formData.append("tipo", tipo);

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        if (tipo === "capa") {
          setFormCapa(data.url);
          setFormFoto(data.url);
          setInfoCapa({
            tamanhoOriginal: data.tamanhoOriginal,
            tamanhoOtimizado: data.tamanhoOtimizado,
            reducao: data.reducao,
          });
        } else {
          setFormBanner(data.url);
          setInfoBanner({
            tamanhoOriginal: data.tamanhoOriginal,
            tamanhoOtimizado: data.tamanhoOtimizado,
            reducao: data.reducao,
          });
        }
      } else {
        alert(data.error || "Erro ao processar imagem.");
      }
    } catch {
      alert("Falha de conexão ao enviar imagem.");
    } finally {
      if (tipo === "capa") setEnviandoCapa(false);
      else setEnviandoBanner(false);
    }
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
      foto: formFoto || formCapa || "/fotos/placeholder.webp",
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
            Cadastre novas séries, envie capas otimizadas em alta resolução e gerencie episódios.
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

      {/* Modal de Cadastro / Edição com Upload Otimizado Netflix-Style */}
      {modalAberto && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCaixa}>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 800, marginBottom: "16px", color: "#fff" }}>
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
                    placeholder="Ex: Amor Proibido na Cobertura"
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
                    placeholder="Frase de impacto que aparece na capa e no destaque"
                    required
                  />
                </div>

                <div className={`${styles.campoGrupo} ${styles.formFull}`}>
                  <label>Sinopse completa *</label>
                  <textarea
                    className={`${styles.input} ${styles.textarea}`}
                    value={formSinopse}
                    onChange={(e) => setFormSinopse(e.target.value)}
                    placeholder="História completa do drama..."
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

                {/* CARD DE UPLOAD DE CAPA (3:4 VERTICAL) */}
                <div className={`${styles.uploadCard} ${styles.formFull}`}>
                  <div className={styles.uploadCardHeader}>
                    <span className={styles.uploadCardTitulo}>
                      🖼️ Capa da Série (Poster Vertical)
                    </span>
                    <span className={styles.specBadge}>Proporção 3:4</span>
                  </div>

                  <div className={styles.specBox}>
                    <strong>Padrão de Exibição Netflix:</strong>
                    <ul className={styles.specList}>
                      <li className={styles.specItem}>
                        📐 <strong>Proporção Exata:</strong> 3:4 (Vertical)
                      </li>
                      <li className={styles.specItem}>
                        📏 <strong>Resolução Recomendada:</strong> 900 × 1200 px (Mínimo: 600 × 800 px)
                      </li>
                      <li className={styles.specItem}>
                        ⚡ <strong>Conversor Inteligente:</strong> Aceita imagens geradas no ChatGPT/DALL-E e comprime automaticamente para <strong>WebP ultraleve</strong> sem perder nitidez.
                      </li>
                    </ul>
                  </div>

                  <input
                    type="file"
                    ref={inputCapaRef}
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        processarUpload(e.target.files[0], "capa");
                      }
                    }}
                  />

                  {!modoManualCapa ? (
                    <div>
                      <div
                        className={styles.dropzone}
                        onClick={() => inputCapaRef.current?.click()}
                      >
                        <span className={styles.dropzoneTexto}>
                          {enviandoCapa
                            ? "⏳ Comprimindo e convertendo para WebP..."
                            : "📤 Clique ou arraste para fazer upload da Capa"}
                        </span>
                        <span className={styles.dropzoneSub}>
                          PNG, JPG ou WEBP (até 20MB) • Otimização automática
                        </span>
                      </div>

                      {formCapa && (
                        <div className={styles.previewContainer}>
                          <img
                            src={formCapa}
                            alt="Preview Capa"
                            className={styles.previewThumbCapa}
                          />
                          <div className={styles.previewInfo}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <strong style={{ fontSize: "0.85rem", color: "#fff" }}>Capa Selecionada</strong>
                              <button
                                type="button"
                                onClick={() => setFormCapa("")}
                                className={styles.btnPerigo}
                                style={{ padding: "2px 6px", fontSize: "0.7rem" }}
                              >
                                Remover
                              </button>
                            </div>
                            <span className={styles.previewUrl}>{formCapa}</span>
                            {infoCapa && (
                              <span className={styles.tagEconomia}>
                                Otimizado: de {infoCapa.tamanhoOriginal} para {infoCapa.tamanhoOtimizado} ({infoCapa.reducao})
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        className={styles.switchLink}
                        onClick={() => setModoManualCapa(true)}
                      >
                        Prefere colar uma URL externa manualmente?
                      </button>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="text"
                        className={styles.input}
                        value={formCapa}
                        onChange={(e) => setFormCapa(e.target.value)}
                        placeholder="https://... ou /capas/exemplo.webp"
                      />
                      <button
                        type="button"
                        className={styles.switchLink}
                        onClick={() => setModoManualCapa(false)}
                      >
                        ← Voltar para upload de arquivo
                      </button>
                    </div>
                  )}
                </div>

                {/* CARD DE UPLOAD DE BANNER (16:9 HORIZONTAL) */}
                <div className={`${styles.uploadCard} ${styles.formFull}`}>
                  <div className={styles.uploadCardHeader}>
                    <span className={styles.uploadCardTitulo}>
                      🎬 Banner de Destaque (Billboard Horizontal)
                    </span>
                    <span className={styles.specBadge}>Proporção 16:9</span>
                  </div>

                  <div className={styles.specBox}>
                    <strong>Padrão de Exibição Netflix:</strong>
                    <ul className={styles.specList}>
                      <li className={styles.specItem}>
                        📐 <strong>Proporção Exata:</strong> 16:9 (Horizontal / Destaque)
                      </li>
                      <li className={styles.specItem}>
                        📏 <strong>Resolução Recomendada:</strong> 1920 × 1080 px (Full HD)
                      </li>
                      <li className={styles.specItem}>
                        ⚡ <strong>Conversor Inteligente:</strong> Comprime automaticamente imagens pesadas de IA para <strong>WebP Full HD</strong> de carregamento instantâneo.
                      </li>
                    </ul>
                  </div>

                  <input
                    type="file"
                    ref={inputBannerRef}
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        processarUpload(e.target.files[0], "banner");
                      }
                    }}
                  />

                  {!modoManualBanner ? (
                    <div>
                      <div
                        className={styles.dropzone}
                        onClick={() => inputBannerRef.current?.click()}
                      >
                        <span className={styles.dropzoneTexto}>
                          {enviandoBanner
                            ? "⏳ Comprimindo e convertendo para WebP..."
                            : "📤 Clique ou arraste para fazer upload do Banner"}
                        </span>
                        <span className={styles.dropzoneSub}>
                          PNG, JPG ou WEBP (até 20MB) • Otimização automática
                        </span>
                      </div>

                      {formBanner && (
                        <div className={styles.previewContainer}>
                          <img
                            src={formBanner}
                            alt="Preview Banner"
                            className={styles.previewThumbBanner}
                          />
                          <div className={styles.previewInfo}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <strong style={{ fontSize: "0.85rem", color: "#fff" }}>Banner Selecionado</strong>
                              <button
                                type="button"
                                onClick={() => setFormBanner("")}
                                className={styles.btnPerigo}
                                style={{ padding: "2px 6px", fontSize: "0.7rem" }}
                              >
                                Remover
                              </button>
                            </div>
                            <span className={styles.previewUrl}>{formBanner}</span>
                            {infoBanner && (
                              <span className={styles.tagEconomia}>
                                Otimizado: de {infoBanner.tamanhoOriginal} para {infoBanner.tamanhoOtimizado} ({infoBanner.reducao})
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        className={styles.switchLink}
                        onClick={() => setModoManualBanner(true)}
                      >
                        Prefere colar uma URL externa manualmente?
                      </button>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="text"
                        className={styles.input}
                        value={formBanner}
                        onChange={(e) => setFormBanner(e.target.value)}
                        placeholder="https://... ou /banners/exemplo.webp"
                      />
                      <button
                        type="button"
                        className={styles.switchLink}
                        onClick={() => setModoManualBanner(false)}
                      >
                        ← Voltar para upload de arquivo
                      </button>
                    </div>
                  )}
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
                  disabled={salvando || enviandoCapa || enviandoBanner}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={styles.btnPrimario}
                  disabled={salvando || enviandoCapa || enviandoBanner}
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
