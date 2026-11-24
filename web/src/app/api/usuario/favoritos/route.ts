import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Faça login para salvar favoritos." }, { status: 401 });
  }

  try {
    const { dramaId } = await request.json();

    if (!dramaId) {
      return NextResponse.json({ error: "ID da série obrigatório." }, { status: 400 });
    }

    const existente = await prisma.favorite.findUnique({
      where: {
        userId_dramaId: {
          userId: user.id,
          dramaId,
        },
      },
    });

    if (existente) {
      await prisma.favorite.delete({
        where: { id: existente.id },
      });
      return NextResponse.json({ favorito: false });
    } else {
      await prisma.favorite.create({
        data: {
          userId: user.id,
          dramaId,
        },
      });
      return NextResponse.json({ favorito: true });
    }
  } catch (error) {
    console.error("Erro ao alternar favorito:", error);
    return NextResponse.json({ error: "Erro ao atualizar favoritos." }, { status: 500 });
  }
}
