"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import styles from "./admin.module.css";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading, isAdmin, logout } = useAuth();

  if (loading) {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: "100vh", background: "#0d0d0d", color: "#fff" }}>
        <p>Verificando permissões de administrador...</p>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: "100vh", background: "#0d0d0d", color: "#fff", padding: "20px" }}>
        <div style={{ background: "#161616", padding: "32px", borderRadius: "12px", border: "1px solid #282828", maxWidth: "420px", textAlign: "center" }}>
          <h2 style={{ fontSize: "1.4rem", marginBottom: "12px", color: "#ec1c5b" }}>Acesso Restrito</h2>
          <p style={{ color: "#aaa", fontSize: "0.95rem", marginBottom: "24px" }}>
            Esta área é exclusiva para administradores da plataforma Dramaflix.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <Link href="/entrar?redirect=/admin" className={styles.btnPrimario} style={{ justifyContent: "center" }}>
              Fazer Login como Admin
            </Link>
            <Link href="/" className={styles.btnSecundario} style={{ justifyContent: "center" }}>
              Voltar para o App
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const links = [
    { href: "/admin", rotulo: "📊 Visão Geral" },
    { href: "/admin/dramas", rotulo: "🎬 Séries & Episódios" },
    { href: "/admin/usuarios", rotulo: "👥 Usuários & Moedas" },
    { href: "/", rotulo: "🌐 Ir para o App" },
  ];

  return (
    <div className={styles.adminContainer}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarBrand}>
          <span className={styles.brandText}>DRAMAFLIX</span>
          <span className={styles.badgeAdmin}>ADMIN</span>
        </div>

        <nav className={styles.nav}>
          {links.map((link) => {
            const ativo =
              link.href === "/admin"
                ? pathname === "/admin"
                : link.href !== "/" && pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`${styles.navItem} ${ativo ? styles.navItemActive : ""}`}
              >
                {link.rotulo}
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userWidget}>
            <div className={styles.userAvatar}>
              {user.name ? user.name.charAt(0).toUpperCase() : "A"}
            </div>
            <div style={{ overflow: "hidden" }}>
              <div className={styles.userName}>{user.name || user.email}</div>
              <div className={styles.userRole}>Administrador</div>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className={styles.btnSecundario}
            style={{ width: "100%", justifyContent: "center" }}
          >
            Sair da Conta
          </button>
        </div>
      </aside>

      <main className={styles.content}>{children}</main>
    </div>
  );
}
