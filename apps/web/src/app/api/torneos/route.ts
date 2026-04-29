import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@tdt/db";
import { z } from "zod";
import { FREE_TOURNAMENT_LIMIT } from "@/lib/tournament-auth";
import { notifyFollowers } from "@/lib/notifications";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().nullable(),
  format: z.enum(["GROUPS_AND_KNOCKOUT", "SINGLE_ELIMINATION"]),
  startDate: z.string().optional().nullable(),
  startTime: z.string().max(50).optional().nullable(),
  location: z.string().max(500).optional().nullable(),
  playersPerTeam: z.number().int().min(1).max(3).default(2),
});

export async function GET() {
  const tournaments = await prisma.tournament.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      admin: { select: { name: true } },
      _count: { select: { teams: true, matches: true } },
    },
  });
  return NextResponse.json(tournaments);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Usuarios FREE: máximo 5 torneos
  if (session.user.role !== "ADMIN") {
    const count = await prisma.tournament.count({ where: { adminId: session.user.id } });
    if (count >= FREE_TOURNAMENT_LIMIT) {
      return NextResponse.json(
        { error: `El plan gratuito permite hasta ${FREE_TOURNAMENT_LIMIT} torneos. Suscribite al plan Organizador para crear más.` },
        { status: 403 }
      );
    }
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const { name, description, format, startDate, startTime, location, playersPerTeam } = parsed.data;

  const tournament = await prisma.tournament.create({
    data: {
      name,
      description,
      format,
      startDate: startDate ? new Date(startDate) : null,
      startTime: startTime || null,
      location: location || null,
      playersPerTeam,
      adminId: session.user.id,
    },
  });

  notifyFollowers(session.user.id, tournament.id, "TOURNAMENT_CREATED").catch(() => {});

  return NextResponse.json(tournament, { status: 201 });
}
