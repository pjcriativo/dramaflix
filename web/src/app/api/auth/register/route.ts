import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createSessionToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "E-mail e senha são obrigatórios." },
        { status: 400 }
      );
    }

    const emailNormalizado = email.toLowerCase().trim();

    const existente = await prisma.user.findUnique({
      where: { email: emailNormalizado },
    });

    if (existente) {
      return NextResponse.json(
        { error: "Já existe uma conta cadastrada com este e-mail." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name?.trim() || emailNormalizado.split("@")[0],
        email: emailNormalizado,
        passwordHash,
        role: "USER",
        coinsBalance: 120, // Saldo inicial de boas-vindas
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        coinsBalance: true,
        isVip: true,
        vipPlan: true,
        createdAt: true,
      },
    });

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const cookieStore = await cookies();
    cookieStore.set("drama_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 dias
    });

    return NextResponse.json({ ok: true, user });
  } catch (error) {
    console.error("Erro no cadastro:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ao realizar cadastro." },
      { status: 500 }
    );
  }
}
