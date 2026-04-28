import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, TournamentFormat, Phase } from "@tdt/db";

type Params = { params: { id: string } };

function phaseForTeamCount(count: number): Phase {
  if (count <= 2) return "FINAL";
  if (count <= 4) return "SEMIFINAL";
  if (count <= 8) return "QUARTERFINAL";
  return "ROUND_OF_16";
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function POST(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const tournament = await prisma.tournament.findUnique({
    where: { id: params.id },
    include: { teams: true, groups: true },
  });

  if (!tournament) {
    return NextResponse.json({ error: "Torneo no encontrado" }, { status: 404 });
  }

  if (tournament.status !== "IN_PROGRESS") {
    return NextResponse.json({ error: "El torneo debe estar en curso" }, { status: 400 });
  }

  const existingKnockout = await prisma.match.count({
    where: { tournamentId: params.id, groupId: null },
  });

  if (existingKnockout > 0) {
    return NextResponse.json({ error: "El bracket ya fue generado" }, { status: 400 });
  }

  // Para GROUPS_AND_KNOCKOUT: usar los clasificados de cada grupo (top 2)
  // Para SINGLE_ELIMINATION: usar todos los equipos
  let teamsForBracket = tournament.teams;

  if (tournament.format === TournamentFormat.GROUPS_AND_KNOCKOUT) {
    const standings = await prisma.groupStanding.findMany({
      where: { group: { tournamentId: params.id } },
      orderBy: [{ points: "desc" }, { wins: "desc" }],
      include: { group: true },
    });

    // Top 2 por grupo
    const qualifiedIds = new Set<string>();
    const groupMap = new Map<string, typeof standings>();

    for (const s of standings) {
      const arr = groupMap.get(s.groupId) ?? [];
      arr.push(s);
      groupMap.set(s.groupId, arr);
    }

    for (const [, arr] of groupMap) {
      arr.slice(0, 2).forEach((s) => qualifiedIds.add(s.teamId));
    }

    teamsForBracket = tournament.teams.filter((t) => qualifiedIds.has(t.id));
  }

  if (teamsForBracket.length < 2) {
    return NextResponse.json(
      { error: "Se necesitan al menos 2 equipos para generar el bracket" },
      { status: 400 }
    );
  }

  const shuffled = shuffle(teamsForBracket);
  const phase = phaseForTeamCount(shuffled.length);

  // Crear partidos en pares (bye si número impar)
  const matchCreates = [];
  for (let i = 0; i < shuffled.length - 1; i += 2) {
    matchCreates.push({
      tournamentId: params.id,
      phase,
      round: Math.floor(i / 2) + 1,
      homeTeamId: shuffled[i].id,
      awayTeamId: shuffled[i + 1].id,
    });
  }

  await prisma.match.createMany({ data: matchCreates });

  return NextResponse.json({ created: matchCreates.length });
}
