import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const SECRET_KEY = process.env.AUTH_SECRET || "dramaflix-super-secret-jwt-key-2026";
const encodedKey = new TextEncoder().encode(SECRET_KEY);

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  [key: string]: unknown;
}

export async function createSessionToken(payload: TokenPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(encodedKey);
}

export async function verifySessionToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, encodedKey);
    return payload as TokenPayload;
  } catch {
    return null;
  }
}

export async function getSessionUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("drama_session")?.value;
    if (!token) return null;

    const payload = await verifySessionToken(token);
    if (!payload?.userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        coinsBalance: true,
        isVip: true,
        vipPlan: true,
        vipExpiresAt: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    return user;
  } catch {
    return null;
  }
}
