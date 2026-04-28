import { jwtVerify, SignJWT } from "jose";

const secret = () => new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);

export type MobileTokenPayload = {
  sub: string;
  role: string;
  name: string;
};

export async function signMobileToken(payload: MobileTokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(secret());
}

export async function verifyMobileToken(
  authHeader: string | null | undefined
): Promise<MobileTokenPayload | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as unknown as MobileTokenPayload;
  } catch {
    return null;
  }
}
