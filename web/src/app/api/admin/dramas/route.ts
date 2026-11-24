import { NextResponse } from "next/server";
import { checkAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await checkAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const dramas = await prisma.drama.findMany({
      orderBy: { numero: "asc" },
      include: {
        _count: {
          select: { episodios: true },
        },
      },
    });

    return NextResponse.json({ dramas });
  } catch (error) {
    console.error("Erro ao listar dramas:", error);
    return NextResponse.json(
      { error: "Erro ao listar dramas." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await checkAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const data = await request.json();

    if (!data.titulo || !data.sinopse) {
      return NextResponse.json(
        { error: "Título e sinopse são obrigatórios." },
        { status: 400 }
      );
    }

    const id =
      data.id?.trim() ||
      data.titulo
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    const existente = await prisma.drama.findUnique({ where: { id } });
    if (existente) {
      return NextResponse.json(
        { error: "Já existe uma série com este identificador/slug: " + id },
        { status: 409 }
      );
    }

    const drama = await prisma.drama.create({
      data: {
        id,
        titulo: data.titulo.trim(),
        genero: data.genero || "Drama",
        sinopse: data.sinopse.trim(),
        gancho: data.gancho?.trim() || data.sinopse.slice(0, 80) + "...",
        episodiosTotal: Number(data.episodiosTotal) || 1,
        gratisAte: Number(data.gratisAte) || 10,
        moedasPorEpisodio: Number(data.moedasPorEpisodio) || 40,
        classificacao: data.classificacao || "A14",
        selo: data.selo || null,
        dublado: Boolean(data.dublado),
        capa: data.capa || "/capas/placeholder.webp",
        foto: data.foto || "/fotos/placeholder.webp",
        banner: data.banner || "/banners/placeholder.webp",
        logo: data.logo || null,
        cor: data.cor || "#14100d",
        tags: typeof data.tags === "string" ? data.tags : JSON.stringify(data.tags || []),
        amostraVideo: data.amostraVideo || null,
        previaVideo: data.previaVideo || null,
        ativo: data.ativo ?? true,
      },
    });

    return NextResponse.json({ ok: true, drama });
  } catch (error) {
    console.error("Erro ao criar drama:", error);
    return NextResponse.json(
      { error: "Erro ao criar drama." },
      { status: 500 }
    );
  }
}
