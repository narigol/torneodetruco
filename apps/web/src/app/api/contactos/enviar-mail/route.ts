import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isOrganizer } from "@/lib/tournament-auth";
import { renderBasicEmail, sendEmail } from "@/lib/email";
import { z } from "zod";

// Max 3 sends per 10 minutes per user (in-memory, resets on cold start)
const sendLog = new Map<string, number[]>();
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 3;

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const times = (sendLog.get(userId) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (times.length >= RATE_MAX) return true;
  times.push(now);
  sendLog.set(userId, times);
  return false;
}

const schema = z.object({
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(5000),
  contactos: z
    .array(z.object({ name: z.string(), email: z.string().email() }))
    .min(1)
    .max(50),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !isOrganizer(session.user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (isRateLimited(session.user.id)) {
    return NextResponse.json(
      { error: `Límite alcanzado: máximo ${RATE_MAX} envíos cada 10 minutos.` },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const { subject, message, contactos } = parsed.data;
  const messageHtml = message.replace(/\n/g, "<br>");

  const results = await Promise.allSettled(
    contactos.map((c) =>
      sendEmail({
        to: c.email,
        subject,
        html: renderBasicEmail(subject, messageHtml),
        text: message,
      })
    )
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;

  return NextResponse.json({ sent });
}
