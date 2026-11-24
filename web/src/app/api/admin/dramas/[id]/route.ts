import { NextResponse } from "next/server";
import { checkAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await checkAdmin();
  if (!auth.authorized) return auth.response;

  const { id } = await params;

  try {
    const drama = await prisma.drama.findUnique({
      where: { id },
      include: {
        episodios: {
          orderBy: { numero: "asc" },
        },
      },
    });

    if (!drama) {
      return NextResponse.json(
        { error: "Drama não encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json({ drama });
  } catch (error) {
    console.error("Erro ao obter drama:", error);
    return NextResponse.json(
      { error: "Erro ao obter drama." },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await checkAdmin();
  if (!auth.authorized) return auth.response;

  const { id } = await params;
  const data = await request.json();

  try {
    const drama = await prisma.drama.update({
      where: { id },
      data: {
        titulo: data.titulo !== undefined ? data.titulo.trim() : undefined,
        genero: data.genero !== undefined ? data.genero : undefined,
        sinopse: data.sinopse !== undefined ? data.sinopse.trim() : undefined,
        gancho: data.gancho !== undefined ? data.gancho.trim() : undefined,
        episodiosTotal: data.episodiosTotal !== undefined ? Number(data.episodiosTotal) : undefined,
        gratisAte: data.gratisAte !== undefined ? Number(data.gratisAte) : undefined,
        moedasPorEpisodio: data.moedasPorEpisodio !== undefined ? Number(data.moedasPorEpisodio) : undefined,
        classificacao: data.classificacao !== undefined ? data.classificacao : undefined,
        selo: data.selo !== undefined ? data.selo : undefined,
        dublado: data.dublado !== undefined ? Boolean(data.dublado) : undefined,
        idiomaAudio: data.idiomaAudio !== undefined ? data.idiomaAudio : undefined,
        legendado: data.legendado !== undefined ? Boolean(data.legendado) : undefined,
        idiomasLegenda: data.idiomasLegenda !== undefined ? data.idiomasLegenda : undefined,
        capa: data.capa !== undefined ? data.capa : undefined,
        foto: data.foto !== undefined ? data.foto : undefined,
        banner: data.banner !== undefined ? data.banner : undefined,
        logo: data.logo !== undefined ? data.logo : undefined,
        cor: data.cor !== undefined ? data.cor : undefined,
        tags: data.tags !== undefined ? (typeof data.tags === "string" ? data.tags : JSON.stringify(data.tags)) : undefined,
        amostraVideo: data.amostraVideo !== undefined ? data.amostraVideo : undefined,
        previaVideo: data.previaVideo !== undefined ? data.previaVideo : undefined,
        ativo: data.ativo !== undefined ? Boolean(data.ativo) : undefined,
      },
    });

    return NextResponse.json({ ok: true, drama });
  } catch (error) {
    console.error("Erro ao atualizar drama:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar drama." },
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

  const { id } = await params;

  try {
    await prisma.drama.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro ao excluir drama:", error);
    return NextResponse.json(
      { error: "Erro ao excluir drama." },
      { status: 500 }
    );
  }
}
