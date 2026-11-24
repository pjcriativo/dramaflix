import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { AppProvider } from "@/components/AppProvider";
import { TitleModal } from "@/components/TitleModal";
import { Toast } from "@/components/Toast";
import { AuthProvider } from "@/contexts/AuthContext";
import { MARCA } from "@/lib/marca";
import "./globals.css";

// Inter substitui a Netflix Sans (proprietária); é variável, então cobre 400–900.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${MARCA.nome} — dramas curtos`,
  description: "Dramas curtos para maratonar.",
  applicationName: MARCA.nome,
  // aberto pela tela inicial do iPhone: tela cheia, sem a barra do Safari
  appleWebApp: { capable: true, title: MARCA.nome, statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#141414",
  colorScheme: "dark",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body>
        <AuthProvider>
          <AppProvider>
            {children}
            <TitleModal />
            <Toast />
          </AppProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
