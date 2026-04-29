import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@tdt/db";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  tournamentId: z.string().cuid(),
  playerIds: z.array(z.string().cuid()).min(1).max(3),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tournamentId = searchParams.get("tournamentId");

  const teams = await prisma.team.findMany({
    where: tournamentId ? { tournamentId } : undefined,
    orderBy: { name: "asc" },
    include: {
      teamPlayers: {
        include: { player: { select: { id: true, name: true } } },
      },
    },
  });
  return NextResponse.json(teams);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const { name, tournamentId, playerIds } = parsed.data;

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { playersPerTeam: true },
  });

  if (!tournament) {
    return NextResponse.json({ error: "Torneo no encontrado" }, { status: 404 });
  }

  if (playerIds.length !== tournament.playersPerTeam) {
    return NextResponse.json(
      { error: `Este torneo requiere exactamente ${tournament.playersPerTeam} jugador${tournament.playersPerTeam !== 1 ? "es" : ""} por equipo` },
      { status: 400 }
    );
  }

  const already = await prisma.teamPlayer.findFirst({
    where: { playerId: { in: playerIds }, team: { tournamentId } },
    include: { player: { select: { name: true } } },
  });
  if (already) {
    return NextResponse.json(
      { error: `${already.player.name} ya está en otro equipo de este torneo` },
      { status: 400 }
    );
  }

  const team = await prisma.team.create({
    data: {
      name,
      tournamentId,
      teamPlayers: {
        create: playerIds.map((playerId) => ({ playerId })),
      },
    },
    include: {
      teamPlayers: { include: { player: true } },
    },
  });

  return NextResponse.json(team, { status: 201 });
}
