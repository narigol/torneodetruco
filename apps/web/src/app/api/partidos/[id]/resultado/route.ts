import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, Phase } from "@tdt/db";
import { z } from "zod";

const NEXT_PHASE: Partial<Record<Phase, Phase>> = {
  ROUND_OF_16: "QUARTERFINAL",
  QUARTERFINAL: "SEMIFINAL",
  SEMIFINAL: "FINAL",
};

const schema = z.object({
  homeScore: z.number().int().min(0),
  awayScore: z.number().int().min(0),
});

type Params = { params: { id: string } };

export async function PATCH(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const { homeScore, awayScore } = parsed.data;

  const match = await prisma.match.findUnique({ where: { id: params.id } });
  if (!match) {
    return NextResponse.json({ error: "Partido no encontrado" }, { status: 404 });
  }
  if (match.status === "FINISHED") {
    return NextResponse.json({ error: "El partido ya fue finalizado" }, { status: 400 });
  }

  // En eliminatoria no se permiten empates
  if (!match.groupId && homeScore === awayScore) {
    return NextResponse.json(
      { error: "En eliminatoria no puede haber empate" },
      { status: 400 }
    );
  }

  const winnerId =
    homeScore > awayScore
      ? match.homeTeamId
      : awayScore > homeScore
      ? match.awayTeamId
      : null;

  await prisma.$transaction(async (tx) => {
    await tx.match.update({
      where: { id: params.id },
      data: { homeScore, awayScore, winnerId, status: "FINISHED" },
    });

    if (match.groupId) {
      const homeWin = homeScore > awayScore;
      const awayWin = awayScore > homeScore;
      const draw = homeScore === awayScore;

      await tx.groupStanding.update({
        where: { groupId_teamId: { groupId: match.groupId, teamId: match.homeTeamId } },
        data: {
          wins: { increment: homeWin ? 1 : 0 },
          losses: { increment: awayWin ? 1 : 0 },
          draws: { increment: draw ? 1 : 0 },
          points: { increment: homeWin ? 3 : draw ? 1 : 0 },
          scored: { increment: homeScore },
          against: { increment: awayScore },
        },
      });

      await tx.groupStanding.update({
        where: { groupId_teamId: { groupId: match.groupId, teamId: match.awayTeamId } },
        data: {
          wins: { increment: awayWin ? 1 : 0 },
          losses: { increment: homeWin ? 1 : 0 },
          draws: { increment: draw ? 1 : 0 },
          points: { increment: awayWin ? 3 : draw ? 1 : 0 },
          scored: { increment: awayScore },
          against: { increment: homeScore },
        },
      });

      return;
    }

    // Eliminatoria: verificar si toda la fase terminó
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
    const matchCreates = [];
    for (let i = 0; i + 1 < winners.length; i += 2) {
      matchCreates.push({
        tournamentId: match.tournamentId,
        phase: nextPhase,
        round: Math.floor(i / 2) + 1,
        homeTeamId: winners[i],
        awayTeamId: winners[i + 1],
      });
    }

    if (matchCreates.length > 0) {
      await tx.match.createMany({ data: matchCreates });
    }
  });

  return NextResponse.json({ ok: true });
}
