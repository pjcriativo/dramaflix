import { NextResponse } from "next/server";
import { checkAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await checkAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const usuarios = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        coinsBalance: true,
        isVip: true,
        vipPlan: true,
        createdAt: true,
        _count: {
          select: {
            unlocks: true,
            favorites: true,
          },
        },
      },
    });

    return NextResponse.json({ usuarios });
  } catch (error) {
    console.error("Erro ao listar usuários:", error);
    return NextResponse.json(
      { error: "Erro ao listar usuários." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const auth = await checkAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const { userId, role, coinsAdd, setVip, vipPlan } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "ID do usuário é obrigatório." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado." },
        { status: 404 }
      );
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        role: role !== undefined ? role : undefined,
        coinsBalance: coinsAdd !== undefined ? user.coinsBalance + Number(coinsAdd) : undefined,
        isVip: setVip !== undefined ? Boolean(setVip) : undefined,
        vipPlan: vipPlan !== undefined ? vipPlan : undefined,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        coinsBalance: true,
        isVip: true,
        vipPlan: true,
      },
    });

    return NextResponse.json({ ok: true, user: updated });
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar usuário." },
      { status: 500 }
    );
  }
}
