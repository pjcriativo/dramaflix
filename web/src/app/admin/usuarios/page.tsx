"use client";

import { useEffect, useState } from "react";
import styles from "../admin.module.css";

interface Usuario {
  id: string;
  email: string;
  name: string | null;
  role: string;
  coinsBalance: number;
  isVip: boolean;
  vipPlan: string | null;
  createdAt: string;
  _count?: {
    unlocks: number;
    favorites: number;
  };
}

export default function AdminUsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [processando, setProcessando] = useState<string | null>(null);

  const carregarUsuarios = async () => {
    try {
      const res = await fetch("/api/admin/usuarios");
      if (res.ok) {
        const data = await res.json();
        setUsuarios(data.usuarios || []);
      }
    } catch (e) {
      console.error("Erro ao carregar usuários:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarUsuarios();
  }, []);

  const alterarUsuario = async (
    userId: string,
    payload: { coinsAdd?: number; setVip?: boolean; vipPlan?: string | null; role?: string }
  ) => {
    setProcessando(userId);
    try {
      const res = await fetch("/api/admin/usuarios", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...payload }),
      });

      if (res.ok) {
        carregarUsuarios();
      } else {
        const err = await res.json();
        alert(err.error || "Erro ao atualizar usuário.");
      }
    } catch {
      alert("Falha de conexão com o servidor.");
    } finally {
      setProcessando(null);
    }
  };

  const usuariosFiltrados = usuarios.filter(
    (u) =>
      u.email.toLowerCase().includes(busca.toLowerCase()) ||
      (u.name && u.name.toLowerCase().includes(busca.toLowerCase()))
  );

  if (loading) return <div>Carregando lista de usuários...</div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 className={styles.headerTitle}>Gestão de Usuários e Moedas</h1>
          <p className={styles.headerSubtitle}>
            Visualize clientes, gerencie saldos de moedas, status VIP e permissões de acesso.
          </p>
        </div>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          className={styles.input}
          placeholder="Buscar por nome ou e-mail..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={{ maxWidth: "400px" }}
        />
      </div>

      <div className={styles.cardTabela}>
        <table className={styles.tabela}>
          <thead>
            <tr>
              <th>Usuário</th>
              <th>Papel</th>
              <th>Saldo de Moedas</th>
              <th>Status VIP</th>
              <th>Desbloqueios</th>
              <th>Cadastro</th>
              <th>Ações Rápidas</th>
            </tr>
          </thead>
          <tbody>
            {usuariosFiltrados.map((u) => {
              const ocupado = processando === u.id;
              return (
                <tr key={u.id}>
                  <td>
                    <div><strong>{u.name || "Sem nome"}</strong></div>
                    <div style={{ fontSize: "0.8rem", color: "#888" }}>{u.email}</div>
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
                  <td>
                    <strong>{u.coinsBalance}</strong> moedas
                  </td>
                  <td>
                    <span
                      className={`${styles.badgePill} ${
                        u.isVip ? styles.badgeAmarelo : styles.badgePill
                      }`}
                      style={{ background: u.isVip ? undefined : "#262626", color: u.isVip ? undefined : "#888" }}
                    >
                      {u.isVip ? `VIP (${u.vipPlan || "ativo"})` : "Sem VIP"}
                    </span>
                  </td>
                  <td>{u._count?.unlocks ?? 0} eps</td>
                  <td style={{ fontSize: "0.8rem", color: "#888" }}>
                    {new Date(u.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      <button
                        onClick={() => alterarUsuario(u.id, { coinsAdd: 100 })}
                        disabled={ocupado}
                        className={styles.btnSecundario}
                        style={{ fontSize: "0.75rem", padding: "4px 8px" }}
                      >
                        +100 Moedas
                      </button>
                      <button
                        onClick={() =>
                          alterarUsuario(u.id, {
                            setVip: !u.isVip,
                            vipPlan: !u.isVip ? "mensal" : null,
                          })
                        }
                        disabled={ocupado}
                        className={styles.btnSecundario}
                        style={{ fontSize: "0.75rem", padding: "4px 8px" }}
                      >
                        {u.isVip ? "Remover VIP" : "Ativar VIP"}
                      </button>
                      <button
                        onClick={() =>
                          alterarUsuario(u.id, {
                            role: u.role === "ADMIN" ? "USER" : "ADMIN",
                          })
                        }
                        disabled={ocupado}
                        className={styles.btnSecundario}
                        style={{ fontSize: "0.75rem", padding: "4px 8px" }}
                      >
                        {u.role === "ADMIN" ? "Tornar Cliente" : "Tornar Admin"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
