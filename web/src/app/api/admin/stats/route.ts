import { NextResponse } from "next/server";
import { checkAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await checkAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const [totalDramas, totalEpisodios, totalUsuarios, totalDesbloqueios, ultimosUsuarios, ultimosDramas] =
      await Promise.all([
        prisma.drama.count(),
        prisma.episode.count(),
        prisma.user.count(),
        prisma.episodeUnlock.count(),
        prisma.user.findMany({
          take: 5,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            coinsBalance: true,
            isVip: true,
            createdAt: true,
          },
        }),
        prisma.drama.findMany({
          take: 5,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            titulo: true,
            genero: true,
            capa: true,
            episodiosTotal: true,
            ativo: true,
          },
        }),
      ]);

    return NextResponse.json({
      totalDramas,
      totalEpisodios,
      totalUsuarios,
      totalDesbloqueios,
      ultimosUsuarios,
      ultimosDramas,
    });
  } catch (error) {
    console.error("Erro ao buscar estatísticas do admin:", error);
    return NextResponse.json(
      { error: "Erro ao carregar estatísticas." },
      { status: 500 }
    );
  }
}
