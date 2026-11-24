import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("drama_session");
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro no logout:", error);
    return NextResponse.json(
      { error: "Erro ao encerrar sessão." },
      { status: 500 }
    );
  }
}
