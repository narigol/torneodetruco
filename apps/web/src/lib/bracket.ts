import { Phase } from "@tdt/db";

type MatchClient = {
  create(args: { data: Record<string, unknown> }): Promise<unknown>;
};

// Crea los partidos de una fase. Si hay equipo impar, recibe un bye (FINISHED automáticamente).
export async function createPhaseMatches(
  matchClient: MatchClient,
  tournamentId: string,
  phase: Phase,
  teamIds: string[]
) {
  for (let i = 0; i + 1 < teamIds.length; i += 2) {
    await matchClient.create({
      data: {
        tournamentId,
        phase,
        round: Math.floor(i / 2) + 1,
        homeTeamId: teamIds[i],
        awayTeamId: teamIds[i + 1],
      },
    });
  }

  if (teamIds.length % 2 === 1) {
    const byeTeamId = teamIds[teamIds.length - 1];
    await matchClient.create({
      data: {
        tournamentId,
        phase,
        round: Math.floor((teamIds.length - 1) / 2) + 1,
        homeTeamId: byeTeamId,
        awayTeamId: null,
        status: "FINISHED",
        homeScore: 0,
        awayScore: 0,
        winnerId: byeTeamId,
      },
    });
  }
}
