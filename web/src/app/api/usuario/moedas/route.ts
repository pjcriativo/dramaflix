import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Faça login para realizar recargas ou assinaturas." }, { status: 401 });
  }

  try {
    const { tipo, quantidade, plano, valor } = await request.json();

    if (tipo === "RECARGA") {
      const moedasAdicionar = Number(quantidade) || 0;
      if (moedasAdicionar <= 0) {
        return NextResponse.json({ error: "Quantidade inválida." }, { status: 400 });
      }

      const [userAtualizado] = await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: { coinsBalance: { increment: moedasAdicionar } },
          select: { id: true, coinsBalance: true, isVip: true, vipPlan: true },
        }),
        prisma.transaction.create({
          data: {
            userId: user.id,
            tipo: "RECARGA_MOEDAS",
            valor: Number(valor) || 0,
            moedas: moedasAdicionar,
            descricao: `Recarga de ${moedasAdicionar} moedas`,
            status: "CONCLUIDO",
          },
        }),
      ]);

      return NextResponse.json({ ok: true, user: userAtualizado });
    }

    if (tipo === "VIP") {
      const planoEscolhido = plano || "mensal";

      const [userAtualizado] = await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: { isVip: true, vipPlan: planoEscolhido },
          select: { id: true, coinsBalance: true, isVip: true, vipPlan: true },
        }),
        prisma.transaction.create({
          data: {
            userId: user.id,
            tipo: "ASSINATURA_VIP",
            valor: Number(valor) || 0,
            descricao: `Assinatura do Plano VIP ${planoEscolhido}`,
            status: "CONCLUIDO",
          },
        }),
      ]);

      return NextResponse.json({ ok: true, user: userAtualizado });
    }

    return NextResponse.json({ error: "Tipo de operação não suportado." }, { status: 400 });
  } catch (error) {
    console.error("Erro ao processar transação:", error);
    return NextResponse.json({ error: "Erro interno ao processar operação." }, { status: 500 });
  }
}
