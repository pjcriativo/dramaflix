import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Faça login para desbloquear episódios." }, { status: 401 });
  }

  try {
    const { dramaId, numeroEpisodio } = await request.json();

    if (!dramaId || !numeroEpisodio) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }

    const drama = await prisma.drama.findUnique({ where: { id: dramaId } });
    if (!drama) {
      return NextResponse.json({ error: "Série não encontrada." }, { status: 404 });
    }

    // Se já é grátis pelo padrão da série
    if (numeroEpisodio <= drama.gratisAte) {
      return NextResponse.json({ status: "ja_gratis" });
    }

    // Se usuário é VIP ativo
    if (user.isVip) {
      return NextResponse.json({ status: "vip" });
    }

    // Verifica se já desbloqueou anteriormente
    const jaDesbloqueado = await prisma.episodeUnlock.findUnique({
      where: {
        userId_dramaId_numeroEpisodio: {
          userId: user.id,
          dramaId,
          numeroEpisodio,
        },
      },
    });

    if (jaDesbloqueado) {
      return NextResponse.json({ status: "ja_desbloqueado" });
    }

    const custo = drama.moedasPorEpisodio;
    if (user.coinsBalance < custo) {
      return NextResponse.json({ status: "sem_saldo", saldo: user.coinsBalance, custo }, { status: 400 });
    }

    // Transação atômica: desconta moedas, grava unlock e transaction
    const [userAtualizado, unlock] = await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { coinsBalance: { decrement: custo } },
        select: { id: true, coinsBalance: true },
      }),
      prisma.episodeUnlock.create({
        data: {
          userId: user.id,
          dramaId,
          numeroEpisodio,
          moedasGastas: custo,
        },
      }),
      prisma.transaction.create({
        data: {
          userId: user.id,
          tipo: "DESBLOQUEIO_EPISODIO",
          moedas: -custo,
          descricao: `Desbloqueio do Ep. ${numeroEpisodio} de ${drama.titulo}`,
          status: "CONCLUIDO",
        },
      }),
    ]);

    return NextResponse.json({
      status: "ok",
      novoSaldo: userAtualizado.coinsBalance,
      desbloqueio: unlock,
    });
  } catch (error) {
    console.error("Erro ao desbloquear episódio:", error);
    return NextResponse.json({ error: "Erro interno ao processar desbloqueio." }, { status: 500 });
  }
}
