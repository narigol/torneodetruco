import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, Phase } from "@tdt/db";
import { z } from "zod";
import { createPhaseMatches } from "@/lib/bracket";
import { canManageTournament } from "@/lib/tournament-auth";

const NEXT_PHASE: Partial<Record<Phase, Phase>> = {
  ROUND_OF_16: "QUARTERFINAL",
  QUARTERFINAL: "SEMIFINAL",
  SEMIFINAL: "FINAL",
};

const evenNumber = z.number().int().min(0);

const singleSchema = z.object({
  seriesFormat: z.literal("SINGLE").optional(),
  matchPoints: z.number().int().min(1).optional(),
  homeScore: z.number().int().min(0),
  awayScore: z.number().int().min(0),
});

const gameSchema = z.object({ home: z.number().int().min(0), away: z.number().int().min(0) });
const best3Schema = z.object({
  seriesFormat: z.literal("BEST_OF_3"),
  regularGamePoints: evenNumber.optional(),
  tiebreakerPoints: evenNumber.optional(),
  games: z.array(gameSchema).min(2).max(3),
});

const bodySchema = z.union([best3Schema, singleSchema]);

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const match = await prisma.match.findUnique({
    where: { id },
    include: { tournament: { select: { adminId: true } } },
  });
  if (!match) return NextResponse.json({ error: "Partido no encontrado" }, { status: 404 });
  if (match.status === "FINISHED") return NextResponse.json({ error: "El partido ya fue finalizado" }, { status: 400 });
  if (!canManageTournament(session, match.tournament.adminId)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  let homeScore: number;
  let awayScore: number;
  let gamesData: { home: number; away: number }[] | null = null;

  const data = parsed.data;

  if ("seriesFormat" in data && data.seriesFormat === "BEST_OF_3") {
    const games = data.games;
    const regularPts = data.regularGamePoints;
    const tiebreakerPts = data.tiebreakerPoints;

    // Validate scores if points are provided
    for (let i = 0; i < games.length; i++) {
      const target = i < 2 ? regularPts : tiebreakerPts;
      const { home, away } = games[i];
      if (home === away) {
        return NextResponse.json({ error: `El juego ${i + 1} no puede terminar en empate` }, { status: 400 });
      }
      if (target !== undefined) {
        const maxScore = Math.max(home, away);
        if (maxScore !== target) {
          return NextResponse.json(
            { error: `El juego ${i + 1} debe tener ${target} puntos el ganador` },
            { status: 400 }
          );
        }
      }
    }

    let homeWins = 0;
    let awayWins = 0;
    for (const g of games) {
      if (g.home > g.away) homeWins++;
      else awayWins++;
    }

    if (games.length === 2) {
      if (homeWins !== 2 && awayWins !== 2) {
        return NextResponse.json({ error: "Con 2 juegos debe haber un ganador claro (2-0)" }, { status: 400 });
      }
    } else {
      const after2home = (games[0].home > games[0].away ? 1 : 0) + (games[1].home > games[1].away ? 1 : 0);
      const after2away = (games[0].away > games[0].home ? 1 : 0) + (games[1].away > games[1].home ? 1 : 0);
      if (after2home === 2 || after2away === 2) {
        return NextResponse.json({ error: "El juego 3 no es necesario: un equipo ya ganó 2-0" }, { status: 400 });
      }
    }

    homeScore = homeWins;
    awayScore = awayWins;
    gamesData = games;
  } else {
    const d = data as z.infer<typeof singleSchema>;
    homeScore = d.homeScore;
    awayScore = d.awayScore;

    if (homeScore === awayScore) {
      return NextResponse.json({ error: "No puede haber empate en truco" }, { status: 400 });
    }

    if (d.matchPoints !== undefined) {
      const maxScore = Math.max(homeScore, awayScore);
      if (maxScore !== d.matchPoints) {
        return NextResponse.json(
          { error: `El ganador debe tener exactamente ${d.matchPoints} puntos` },
          { status: 400 }
        );
      }
    }
  }

  const winnerId =
    homeScore > awayScore ? match.homeTeamId :
    awayScore > homeScore ? (match.awayTeamId ?? null) : null;

  await prisma.$transaction(async (tx) => {
    await tx.match.update({
      where: { id },
      data: {
        homeScore,
        awayScore,
        winnerId,
        status: "FINISHED",
        ...(gamesData ? { games: gamesData } : {}),
      },
    });

    if (match.groupId) {
      const homeWin = homeScore > awayScore;

      await tx.groupStanding.update({
        where: { groupId_teamId: { groupId: match.groupId, teamId: match.homeTeamId } },
        data: {
          wins: { increment: homeWin ? 1 : 0 },
          losses: { increment: homeWin ? 0 : 1 },
          scored: { increment: homeScore },
          against: { increment: awayScore },
        },
      });

      if (match.awayTeamId) {
        await tx.groupStanding.update({
          where: { groupId_teamId: { groupId: match.groupId, teamId: match.awayTeamId } },
          data: {
            wins: { increment: homeWin ? 0 : 1 },
            losses: { increment: homeWin ? 1 : 0 },
            scored: { increment: awayScore },
            against: { increment: homeScore },
          },
        });
      }

      return;
    }

    const phaseMatches = await tx.match.findMany({
      where: { tournamentId: match.tournamentId, phase: match.phase, groupId: null },
    });

    const allFinished = phaseMatches.every((m) => m.status === "FINISHED");
    if (!allFinished) return;

    if (match.phase === "FINAL") {
      await tx.tournament.update({
        where: { id: match.tournamentId },
        data: { status: "FINISHED" },
      });
      return;
    }

    const nextPhase = NEXT_PHASE[match.phase];
    if (!nextPhase) return;

    const winners = phaseMatches.map((m) => m.winnerId!).filter(Boolean);
    await createPhaseMatches(tx.match, match.tournamentId, nextPhase, winners);
  });

  return NextResponse.json({ ok: true });
}
