"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import styles from "./admin.module.css";
import {
  IconHome,
  IconTv,
  IconUser,
  IconCoin,
  IconStars,
  IconCrown,
  IconArrowLeft,
  IconPlay,
} from "@/components/icons";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading, isAdmin, logout } = useAuth();

  if (loading) {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: "100vh", background: "#0c0c10", color: "#fff" }}>
        <p>Verificando credenciais de administrador...</p>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: "100vh", background: "#0c0c10", color: "#fff", padding: "20px" }}>
        <div style={{ background: "#121217", padding: "36px", borderRadius: "16px", border: "1px solid #1e1e28", maxWidth: "420px", textAlign: "center", boxShadow: "0 10px 40px rgba(0,0,0,0.5)" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(236, 28, 91, 0.15)", color: "#ec1c5b", display: "grid", placeItems: "center", margin: "0 auto 16px auto", fontSize: "1.5rem" }}>
            🔒
          </div>
          <h2 style={{ fontSize: "1.4rem", marginBottom: "10px", color: "#ffffff", fontWeight: 800 }}>Acesso Restrito</h2>
          <p style={{ color: "#888899", fontSize: "0.92rem", marginBottom: "24px", lineHeight: "1.5" }}>
            Esta área é exclusiva para a equipe de administração do Dramaflix / SnapReels.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <Link href="/entrar?redirect=/admin" className={styles.btnPrimario} style={{ justifyContent: "center" }}>
              Fazer Login como Admin
            </Link>
            <Link href="/" className={styles.btnSecundario} style={{ justifyContent: "center" }}>
              Voltar para o Catálogo
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const appLinks = [
    { href: "/admin", rotulo: "Dashboard", icone: "📊", exact: true },
    { href: "/admin/usuarios", rotulo: "Users & CRM", icone: "👥" },
    { href: "/admin/dramas", rotulo: "Dramas & Episódios", icone: "🎬" },
  ];

  return (
    <div className={styles.adminContainer}>
      <aside className={styles.sidebar}>
        {/* Brand SnapReels */}
        <div className={styles.sidebarBrand}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "linear-gradient(135deg, #ec1c5b 0%, #ff4b72 100%)", display: "grid", placeItems: "center", color: "#fff", fontSize: "0.9rem", boxShadow: "0 2px 10px rgba(236, 28, 91, 0.4)" }}>
              ▶
            </div>
            <span className={styles.brandText}>SNAPREELS</span>
          </div>
          <span className={styles.badgeAdmin}>v1.2.3</span>
        </div>

        {/* Navigation Sections */}
        <nav className={styles.nav}>
          <div className={styles.navSectionTitle}>APP</div>
          {appLinks.map((link) => {
            const ativo = link.exact
              ? pathname === link.href
              : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`${styles.navItem} ${ativo ? styles.navItemActive : ""}`}
              >
                <span style={{ fontSize: "1.1rem" }}>{link.icone}</span>
                <span>{link.rotulo}</span>
              </Link>
            );
          })}

          <div className={styles.navSectionTitle} style={{ marginTop: "16px" }}>SETTINGS</div>
          <Link href="/" className={styles.navItem}>
            <span style={{ fontSize: "1.1rem" }}>🌐</span>
            <span>Ver Catálogo (App)</span>
          </Link>
          <Link href="/admin/dramas" className={styles.navItem}>
            <span style={{ fontSize: "1.1rem" }}>⚙️</span>
            <span>Configurações</span>
          </Link>
        </nav>

        {/* Sidebar Footer */}
        <div className={styles.sidebarFooter}>
          <div className={styles.userWidget}>
            <div className={styles.userAvatar}>
              {user.name ? user.name.charAt(0).toUpperCase() : "A"}
            </div>
            <div style={{ overflow: "hidden" }}>
              <div className={styles.userName}>{user.name || user.email}</div>
              <div className={styles.userRole}>Administrador Root</div>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className={styles.btnSecundario}
            style={{ width: "100%", justifyContent: "center", padding: "8px 12px", fontSize: "0.82rem" }}
          >
            Encerrar Sessão
          </button>
        </div>
      </aside>

      <main className={styles.content}>{children}</main>
    </div>
  );
}
