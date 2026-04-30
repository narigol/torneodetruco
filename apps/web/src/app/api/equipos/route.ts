import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@tdt/db";
import { z } from "zod";
import { canManageTournament, FREE_PEOPLE_LIMIT, isSuperAdmin } from "@/lib/tournament-auth";

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
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const { name, tournamentId, playerIds } = parsed.data;

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { adminId: true, playersPerTeam: true, maxPlayers: true },
  });

  if (!tournament) {
    return NextResponse.json({ error: "Torneo no encontrado" }, { status: 404 });
  }

  if (!canManageTournament(session, tournament.adminId)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  if (playerIds.length !== tournament.playersPerTeam) {
    return NextResponse.json(
      { error: `Este torneo requiere exactamente ${tournament.playersPerTeam} jugador${tournament.playersPerTeam !== 1 ? "es" : ""} por equipo` },
      { status: 400 }
    );
  }

  const teamCount = await prisma.team.count({ where: { tournamentId } });
  const currentPeople = teamCount * tournament.playersPerTeam;

  // Cupo máximo del torneo
  if (tournament.maxPlayers !== null && tournament.maxPlayers !== undefined) {
    if (currentPeople + playerIds.length > tournament.maxPlayers) {
      const restantes = tournament.maxPlayers - currentPeople;
      return NextResponse.json(
        { error: `El torneo tiene cupo para ${tournament.maxPlayers} jugadores. ${restantes > 0 ? `Solo quedan ${restantes} lugar${restantes !== 1 ? "es" : ""}.` : "El cupo está completo."}` },
        { status: 400 }
      );
    }
  }

  // Usuarios FREE: máximo 10 personas por torneo
  if (!isSuperAdmin(session.user.role)) {
    if (currentPeople + playerIds.length > FREE_PEOPLE_LIMIT) {
      return NextResponse.json(
        { error: `El plan gratuito permite hasta ${FREE_PEOPLE_LIMIT} personas por torneo. Suscribite al plan Organizador para agregar más.` },
        { status: 403 }
      );
    }
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
