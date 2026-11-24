import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    // Visitante não autenticado: ignora silenciosamente (usará localStorage)
    return NextResponse.json({ ok: false, visitante: true });
  }

  try {
    const { dramaId, numeroEpisodio, segundos } = await request.json();

    if (!dramaId || numeroEpisodio === undefined) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }

    await prisma.watchHistory.upsert({
      where: {
        userId_dramaId: {
          userId: user.id,
          dramaId,
        },
      },
      update: {
        numeroEpisodio,
        segundos: Number(segundos) || 0,
      },
      create: {
        userId: user.id,
        dramaId,
        numeroEpisodio,
        segundos: Number(segundos) || 0,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro ao salvar histórico:", error);
    return NextResponse.json({ error: "Erro ao salvar progresso." }, { status: 500 });
  }
}
