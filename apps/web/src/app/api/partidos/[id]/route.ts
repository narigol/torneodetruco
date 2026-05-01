import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@tdt/db";
import { canManageTournament } from "@/lib/tournament-auth";
import { sendMatchScheduledEmails } from "@/lib/email-notifications";

const updateSchema = z.object({
  scheduledAt: z.string().nullable().optional(),
  location: z.string().max(500).nullable().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      tournament: {
        select: { adminId: true },
      },
    },
  });

  if (!match) {
    return NextResponse.json({ error: "Partido no encontrado" }, { status: 404 });
  }

  if (!canManageTournament(session, match.tournament.adminId)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
  }

  const updated = await prisma.match.update({
    where: { id },
    data: {
      ...(parsed.data.scheduledAt !== undefined
        ? { scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : null }
        : {}),
      ...(parsed.data.location !== undefined
        ? { location: parsed.data.location ?? null }
        : {}),
    },
    select: {
      id: true,
      scheduledAt: true,
      location: true,
    },
  });

  if (updated.scheduledAt) {
    sendMatchScheduledEmails(updated.id).catch((error) => {
      console.error("[match-schedule-email]", error);
    });
  }

  return NextResponse.json(updated);
}
