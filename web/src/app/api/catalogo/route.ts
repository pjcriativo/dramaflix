import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const dramas = await prisma.drama.findMany({
      where: { ativo: true },
      orderBy: { numero: "asc" },
      include: {
        episodios: {
          select: {
            numero: true,
            titulo: true,
            videoUrl: true,
            duracaoSegundos: true,
            gratis: true,
          },
          orderBy: { numero: "asc" },
        },
      },
    });

    return NextResponse.json({ dramas });
  } catch (error) {
    console.error("Erro ao buscar catálogo dinâmico:", error);
    return NextResponse.json(
      { error: "Erro ao buscar catálogo." },
      { status: 500 }
    );
  }
}
