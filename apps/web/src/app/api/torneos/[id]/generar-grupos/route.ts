import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, TournamentFormat } from "@tdt/db";
import { z } from "zod";
import { canManageTournament } from "@/lib/tournament-auth";

type Params = { params: Promise<{ id: string }> };

const schema = z.object({
  numGroups: z.number().int().min(2).max(16),
  qualifyPerGroup: z.number().int().min(1).default(2),
});

const BYE_SCORE = 30;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: { teams: true, groups: true },
  });

  if (!tournament) {
    return NextResponse.json({ error: "Torneo no encontrado" }, { status: 404 });
  }

  if (!canManageTournament(session, tournament.adminId)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  if (tournament.format !== TournamentFormat.GROUPS_AND_KNOCKOUT) {
    return NextResponse.json(
      { error: "Este torneo no tiene fase de grupos" },
      { status: 400 }
    );
  }

  if (tournament.groups.length > 0) {
    return NextResponse.json({ error: "Los grupos ya fueron generados" }, { status: 400 });
  }

  const { numGroups, qualifyPerGroup } = parsed.data;

  // Max group size (all groups except possibly the last one)
  const maxGroupSize = Math.ceil(tournament.teams.length / numGroups);

  if (qualifyPerGroup >= maxGroupSize) {
    return NextResponse.json(
      { error: `Los clasificados deben ser menos que los equipos por grupo (máx ${maxGroupSize - 1})` },
      { status: 400 }
    );
  }

  const shuffled = shuffle(tournament.teams);
  const groupLetters = Array.from({ length: numGroups }, (_, i) =>
    String.fromCharCode(65 + i)
  );

  await prisma.$transaction(async (tx) => {
    await tx.tournament.update({ where: { id }, data: { qualifyPerGroup } });

    for (let g = 0; g < numGroups; g++) {
      // Sequential block distribution — last group naturally gets the remainder
      const start = g * maxGroupSize;
      const end = Math.min(start + maxGroupSize, shuffled.length);
      const teamsInGroup = shuffled.slice(start, end);

      if (teamsInGroup.length === 0) break;

      const group = await tx.group.create({
        data: {
          tournamentId: id,
          name: `Grupo ${groupLetters[g]}`,
          standings: {
            create: teamsInGroup.map((t) => ({ teamId: t.id })),
          },
        },
      });

      // Round-robin matches between real teams
      const matchData = [];
      for (let i = 0; i < teamsInGroup.length; i++) {
        for (let j = i + 1; j < teamsInGroup.length; j++) {
          matchData.push({
            tournamentId: id,
            groupId: group.id,
            phase: "GROUP" as const,
            round: 1,
            homeTeamId: teamsInGroup[i].id,
            awayTeamId: teamsInGroup[j].id,
          });
        }
      }
      if (matchData.length > 0) {
        await tx.match.createMany({ data: matchData });
      }

      // BYE matches for the last (smaller) group
      const byeCount = maxGroupSize - teamsInGroup.length;
      if (byeCount > 0) {
        for (const team of teamsInGroup) {
          for (let b = 0; b < byeCount; b++) {
            await tx.match.create({
              data: {
                tournamentId: id,
                groupId: group.id,
                phase: "GROUP" as const,
                round: b + 2,
                homeTeamId: team.id,
                awayTeamId: null,
                homeScore: BYE_SCORE,
                awayScore: 0,
                status: "FINISHED",
                winnerId: team.id,
              },
            });
          }
          await tx.groupStanding.update({
            where: { groupId_teamId: { groupId: group.id, teamId: team.id } },
            data: {
              wins: { increment: byeCount },
              scored: { increment: BYE_SCORE * byeCount },
            },
          });
        }
      }
    }
  });

  return NextResponse.json({ groups: numGroups });
}
