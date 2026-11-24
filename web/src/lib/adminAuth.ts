import { NextResponse } from "next/server";
import { getSessionUser } from "./auth";

type AdminUser = NonNullable<Awaited<ReturnType<typeof getSessionUser>>>;

export async function checkAdmin(): Promise<
  | { authorized: true; user: AdminUser }
  | { authorized: false; user: null; response: NextResponse }
> {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return {
      authorized: false,
      user: null,
      response: NextResponse.json(
        { error: "Acesso restrito apenas para administradores." },
        { status: 403 }
      ),
    };
  }

  return { authorized: true, user };
}
