import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ autenticado: false });
  }

  try {
    const [desbloqueios, historico, favoritos, curtidas] = await Promise.all([
      prisma.episodeUnlock.findMany({
        where: { userId: user.id },
        select: { dramaId: true, numeroEpisodio: true },
      }),
      prisma.watchHistory.findMany({
        where: { userId: user.id },
        select: { dramaId: true, numeroEpisodio: true, segundos: true },
      }),
      prisma.favorite.findMany({
        where: { userId: user.id },
        select: { dramaId: true },
      }),
      prisma.like.findMany({
        where: { userId: user.id },
        select: { dramaId: true },
      }),
    ]);

    // Agrupa desbloqueados por dramaId
    const mapaDesbloqueados: Record<string, number[]> = {};
    for (const d of desbloqueios) {
      if (!mapaDesbloqueados[d.dramaId]) mapaDesbloqueados[d.dramaId] = [];
      mapaDesbloqueados[d.dramaId].push(d.numeroEpisodio);
    }

    // Mapa histórico
    const mapaHistorico: Record<string, { ep: number; t: number }> = {};
    for (const h of historico) {
      mapaHistorico[h.dramaId] = { ep: h.numeroEpisodio, t: h.segundos };
    }

    return NextResponse.json({
      autenticado: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        coinsBalance: user.coinsBalance,
        isVip: user.isVip,
        vipPlan: user.vipPlan,
      },
      desbloqueados: mapaDesbloqueados,
      historico: mapaHistorico,
      favoritos: favoritos.map((f) => f.dramaId),
      curtidas: curtidas.map((c) => c.dramaId),
    });
  } catch (error) {
    console.error("Erro ao buscar dados do usuário:", error);
    return NextResponse.json(
      { error: "Erro ao carregar dados do usuário." },
      { status: 500 }
    );
  }
}
