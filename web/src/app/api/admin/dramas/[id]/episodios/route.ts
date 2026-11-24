import { NextResponse } from "next/server";
import { checkAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await checkAdmin();
  if (!auth.authorized) return auth.response;

  const { id: dramaId } = await params;
  const data = await request.json();

  try {
    const drama = await prisma.drama.findUnique({ where: { id: dramaId } });
    if (!drama) {
      return NextResponse.json(
        { error: "Drama não encontrado." },
        { status: 404 }
      );
    }

    const numero = Number(data.numero);
    if (!numero || numero < 1) {
      return NextResponse.json(
        { error: "Número do episódio inválido." },
        { status: 400 }
      );
    }

    const videoUrl = data.videoUrl?.trim() || `/videos/${dramaId}/ep-${String(numero).padStart(3, "0")}.mp4`;
    const gratis = data.gratis !== undefined ? Boolean(data.gratis) : numero <= drama.gratisAte;

    const episodio = await prisma.episode.upsert({
      where: {
        dramaId_numero: {
          dramaId,
          numero,
        },
      },
      update: {
        titulo: data.titulo?.trim() || `Episódio ${numero}`,
        videoUrl,
        duracaoSegundos: Number(data.duracaoSegundos) || 90,
        gratis,
      },
      create: {
        dramaId,
        numero,
        titulo: data.titulo?.trim() || `Episódio ${numero}`,
        videoUrl,
        duracaoSegundos: Number(data.duracaoSegundos) || 90,
        gratis,
      },
    });

    if (numero > drama.episodiosTotal) {
      await prisma.drama.update({
        where: { id: dramaId },
        data: { episodiosTotal: numero },
      });
    }

    return NextResponse.json({ ok: true, episodio });
  } catch (error) {
    console.error("Erro ao salvar episódio:", error);
    return NextResponse.json(
      { error: "Erro ao salvar episódio." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await checkAdmin();
  if (!auth.authorized) return auth.response;

  const { id: dramaId } = await params;
  const { searchParams } = new URL(request.url);
  const numero = Number(searchParams.get("numero"));

  if (!numero) {
    return NextResponse.json(
      { error: "Número do episódio obrigatório." },
      { status: 400 }
    );
  }

  try {
    await prisma.episode.delete({
      where: {
        dramaId_numero: {
          dramaId,
          numero,
        },
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro ao excluir episódio:", error);
    return NextResponse.json(
      { error: "Erro ao excluir episódio." },
      { status: 500 }
    );
  }
}
