import { Suspense } from "react";
import { AdminShell } from "./AdminShell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display: "grid",
            placeItems: "center",
            minHeight: "100vh",
            background: "#0d0d0d",
            color: "#fff",
          }}
        >
          <p>Carregando painel administrativo...</p>
        </div>
      }
    >
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}
