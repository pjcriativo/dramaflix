import Link from "next/link";
import { Billboard } from "@/components/Billboard";
import { PosterCard } from "@/components/PosterCard";
import { Row } from "@/components/Row";
import { dramas, fileiras } from "@/data/catalogo";
import styles from "./page.module.css";

// Home no estilo SnapReels: Destaque Cinematic + Fileiras Horizontais + Painel "All Series" + Rodapé
export default function Home() {
  const catalogoDestaques = dramas.slice(0, 12);

  return (
    <>
      {/* Hero Billboard */}
      <Billboard />

      {/* Fileiras de Categorias Horizontais */}
      <div className={styles.fileiras}>
        {fileiras.map((f) => (
          <Row key={f.id} fileira={f} />
        ))}
      </div>

      {/* Painel Arredondado Escuro "All Series" */}
      <section className={styles.allSeriesSection} aria-label="Todas as Séries">
        <div className={styles.allSeriesContainer}>
          <div className={styles.allSeriesHeader}>
            <div className={styles.allSeriesHeaderLeft}>
              <div className={styles.allSeriesIcon}>▶</div>
              <div>
                <h2 className={styles.allSeriesTitle}>All Series</h2>
                <p className={styles.allSeriesSubtitle}>
                  Explore episódios rápidos e histórias envolventes de vingança, amor e poder
                </p>
              </div>
            </div>

            <Link href="/em-alta" className={styles.btnCatalogFull} style={{ display: "none" }}>
              Ver Catálogo Completo
            </Link>
          </div>

          <div className={styles.allSeriesGrid}>
            {catalogoDestaques.map((drama) => (
              <PosterCard key={drama.id} drama={drama} layout="grade" />
            ))}
          </div>

          <div className={styles.allSeriesFooter}>
            <Link href="/em-alta" className={styles.btnCatalogFull}>
              <span>View Full Catalog</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Rodapé SnapReels */}
      <footer className={styles.snapFooter}>
        <div className={styles.footerContent}>
          <div className={styles.footerTop}>
            {/* Logo e Tagline */}
            <div>
              <div className={styles.brandSnap}>
                <div className={styles.brandLogoBox}>▶</div>
                <span className={styles.brandName}>SnapReels</span>
              </div>
              <p className={styles.footerTagline}>
                Watch premium short dramas anywhere, anytime. Episódios rápidos de 1 minuto em alta definição.
              </p>
            </div>

            {/* Links Centrais & Redes Sociais */}
            <div className={styles.footerCenter}>
              <div className={styles.footerLinksRow}>
                <Link href="/ajuda" className={styles.footerLink}>PRIVACY POLICY</Link>
                <Link href="/ajuda" className={styles.footerLink}>TERMS OF SERVICE</Link>
                <Link href="/ajuda" className={styles.footerLink}>CONTACT US</Link>
                <Link href="/admin" className={`${styles.footerLink} ${styles.footerLinkRed}`}>CREATOR STUDIO</Link>
              </div>

              <div className={styles.socialRow}>
                <a href="#facebook" className={styles.socialIconBtn} aria-label="Facebook">f</a>
                <a href="#twitter" className={styles.socialIconBtn} aria-label="Twitter">𝕏</a>
                <a href="#instagram" className={styles.socialIconBtn} aria-label="Instagram">📸</a>
                <a href="#tiktok" className={styles.socialIconBtn} aria-label="TikTok">♪</a>
                <a href="#youtube" className={styles.socialIconBtn} aria-label="YouTube">▶</a>
              </div>
            </div>

            {/* Baixar App */}
            <div>
              <div className={styles.footerAppsTitle}>GET THE APP</div>
              <div className={styles.appBadges}>
                <div className={styles.mockAppBadge}>
                  <span style={{ fontSize: "1.2rem" }}>🍏</span>
                  <div>
                    <div style={{ fontSize: "0.6rem", color: "#888" }}>Download on the</div>
                    <div style={{ fontWeight: 800 }}>App Store</div>
                  </div>
                </div>
                <div className={styles.mockAppBadge}>
                  <span style={{ fontSize: "1.2rem" }}>▶</span>
                  <div>
                    <div style={{ fontSize: "0.6rem", color: "#888" }}>GET IT ON</div>
                    <div style={{ fontWeight: 800 }}>Google Play</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.footerBottom}>
            <div>© 2026 SnapReels / Dramaflix Inc. All rights reserved.</div>
            <div>Built for High Performance & Micro-Drama Streaming</div>
          </div>
        </div>
      </footer>
    </>
  );
}
