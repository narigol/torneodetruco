import { NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import { z } from "zod";
import { prisma } from "@tdt/db";
import { renderBasicEmail, sendEmail } from "@/lib/email";
import { rateLimit, getRemainingTime } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  const clientIp = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";
  const rateLimitKey = `forgot-password:${clientIp}`;

  if (!rateLimit(rateLimitKey, 3, 15 * 60 * 1000)) {
    const remaining = getRemainingTime(rateLimitKey);
    const minutes = Math.ceil(remaining / 60000);
    return NextResponse.json(
      { error: `Demasiados intentos. Intenta de nuevo en ${minutes} minuto${minutes !== 1 ? "s" : ""}.` },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Email invalido" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, name: true, email: true },
  });

  if (user) {
    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30);

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    try {
      await sendEmail({
        to: user.email,
        subject: "Recupera tu contraseña de TdT",
        html: renderBasicEmail(
          "Recupera tu acceso",
          `Hola ${user.name}, recibimos un pedido para cambiar tu contraseña. El enlace vence en 30 minutos.`,
          "Cambiar contraseña",
          resetUrl
        ),
        text: `Recupera tu acceso desde ${resetUrl}`,
      });
    } catch (error) {
      console.error("[forgot-password] Error enviando email:", error);
    }
  }

  return NextResponse.json({
    ok: true,
    message: "Si el email existe en TdT, te enviamos instrucciones para recuperar tu cuenta.",
  });
}
