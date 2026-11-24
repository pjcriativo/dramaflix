import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dramaId = searchParams.get("dramaId");
  const numero = Number(searchParams.get("ep"));

  if (!dramaId || !numero) {
    return NextResponse.json({ error: "dramaId e ep são obrigatórios." }, { status: 400 });
  }

  try {
    const episodio = await prisma.episode.findUnique({
      where: {
        dramaId_numero: {
          dramaId,
          numero,
        },
      },
      include: {
        drama: {
          select: {
            gratisAte: true,
            moedasPorEpisodio: true,
          },
        },
      },
    });

    if (!episodio) {
      return NextResponse.json({ encontrado: false });
    }

    return NextResponse.json({
      encontrado: true,
      episodio: {
        numero: episodio.numero,
        titulo: episodio.titulo,
        videoUrl: episodio.videoUrl,
        duracaoSegundos: episodio.duracaoSegundos,
        gratis: episodio.gratis || episodio.numero <= (episodio.drama?.gratisAte ?? 10),
      },
    });
  } catch (error) {
    console.error("Erro ao buscar episódio:", error);
    return NextResponse.json({ error: "Erro ao buscar episódio." }, { status: 500 });
  }
}
