import { Phase, prisma } from "@tdt/db";

export const RANKING_CONFIG_KEY = "global";

export async function getRankingConfig() {
  return prisma.rankingConfig.upsert({
    where: { key: RANKING_CONFIG_KEY },
    update: {},
    create: { key: RANKING_CONFIG_KEY },
  });
}

type RankingConfig = Awaited<ReturnType<typeof getRankingConfig>>;

type RankingRow = {
  userId: string;
  userName: string;
  userEmail: string;
  role: string;
  totalPoints: number;
  tournamentsPlayed: number;
  matchesPlayed: number;
  winsByPhase: Record<Phase, number>;
  pointsBreakdown: {
    tournamentsPlayed: number;
    matchesPlayed: number;
    groupWins: number;
    roundOf16Wins: number;
    quarterfinalWins: number;
    semifinalWins: number;
    finalWins: number;
  };
};

function emptyWinsByPhase(): Record<Phase, number> {
  return {
    GROUP: 0,
    ROUND_OF_16: 0,
    QUARTERFINAL: 0,
    SEMIFINAL: 0,
    FINAL: 0,
  };
}

export async function getRankingRows(config: RankingConfig): Promise<RankingRow[]> {
  const [users, orphanPlayers] = await Promise.all([
    prisma.user.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        dni: true,
        player: { select: { id: true } },
      },
    }),
    prisma.player.findMany({
      where: {
        userId: null,
        OR: [{ email: { not: null } }, { dni: { not: null } }],
      },
      orderBy: { createdAt: "asc" },
      select: { id: true, email: true, dni: true },
    }),
  ]);

  const userEmailSet = new Set(users.map((u) => u.email.toLowerCase()));
  const userDniSet = new Set(users.filter((u) => u.dni).map((u) => u.dni!));

  const orphanByEmail = new Map<string, string>();
  const orphanByDni = new Map<string, string>();
  for (const player of orphanPlayers) {
    const email = player.email?.toLowerCase();
    if (email && userEmailSet.has(email)) {
      if (orphanByEmail.has(email)) {
        console.warn(`[ranking] múltiples players huérfanos con email ${email}, usando el primero`);
      } else {
        orphanByEmail.set(email, player.id);
      }
    }
    if (player.dni && userDniSet.has(player.dni)) {
      if (orphanByDni.has(player.dni)) {
        console.warn(`[ranking] múltiples players huérfanos con DNI ${player.dni}, usando el primero`);
      } else {
        orphanByDni.set(player.dni, player.id);
      }
    }
  }

  const playerIdByUserId = new Map<string, string>();
  for (const user of users) {
    const playerId =
      user.player?.id ??
      orphanByEmail.get(user.email.toLowerCase()) ??
      (user.dni ? orphanByDni.get(user.dni) : undefined);
    if (playerId) playerIdByUserId.set(user.id, playerId);
  }

  const trackedPlayerIds = [...new Set(playerIdByUserId.values())];

  const [teamEntries, playedMatches] = await Promise.all([
    trackedPlayerIds.length === 0
      ? Promise.resolve([])
      : prisma.teamPlayer.findMany({
          where: { playerId: { in: trackedPlayerIds } },
          select: {
            playerId: true,
            team: {
              select: {
                id: true,
                tournamentId: true,
              },
            },
          },
        }),
    prisma.match.findMany({
      where: {
        status: "FINISHED",
        awayTeamId: { not: null },
      },
      select: {
        phase: true,
        winnerId: true,
        homeTeamId: true,
        awayTeamId: true,
        homeTeam: {
          select: {
            teamPlayers: {
              select: { playerId: true },
            },
          },
        },
        awayTeam: {
          select: {
            teamPlayers: {
              select: { playerId: true },
            },
          },
        },
        winner: {
          select: {
            teamPlayers: {
              select: { playerId: true },
            },
          },
        },
      },
    }),
  ]);

  const tournamentIdsByPlayerId = new Map<string, Set<string>>();
  for (const entry of teamEntries) {
    const current = tournamentIdsByPlayerId.get(entry.playerId) ?? new Set<string>();
    current.add(entry.team.tournamentId);
    tournamentIdsByPlayerId.set(entry.playerId, current);
  }

  const matchesPlayedByPlayerId = new Map<string, number>();
  const winsByPhaseByPlayerId = new Map<string, Record<Phase, number>>();

  for (const match of playedMatches) {
    const participants = new Set<string>([
      ...match.homeTeam.teamPlayers.map((tp) => tp.playerId),
      ...(match.awayTeam?.teamPlayers.map((tp) => tp.playerId) ?? []),
    ]);

    for (const playerId of participants) {
      matchesPlayedByPlayerId.set(playerId, (matchesPlayedByPlayerId.get(playerId) ?? 0) + 1);
    }

    const winners = match.winner?.teamPlayers.map((tp) => tp.playerId) ?? [];
    for (const playerId of winners) {
      const wins = winsByPhaseByPlayerId.get(playerId) ?? emptyWinsByPhase();
      wins[match.phase] += 1;
      winsByPhaseByPlayerId.set(playerId, wins);
    }
  }

  return users
    .map((user) => {
      const playerId = playerIdByUserId.get(user.id);
      const tournamentsPlayed = playerId ? (tournamentIdsByPlayerId.get(playerId)?.size ?? 0) : 0;
      const matchesPlayed = playerId ? (matchesPlayedByPlayerId.get(playerId) ?? 0) : 0;
      const winsByPhase = playerId ? (winsByPhaseByPlayerId.get(playerId) ?? emptyWinsByPhase()) : emptyWinsByPhase();

      const pointsBreakdown = {
        tournamentsPlayed: tournamentsPlayed * config.tournamentPlayedPoints,
        matchesPlayed: matchesPlayed * config.matchPlayedPoints,
        groupWins: winsByPhase.GROUP * config.groupWinPoints,
        roundOf16Wins: winsByPhase.ROUND_OF_16 * config.roundOf16WinPoints,
        quarterfinalWins: winsByPhase.QUARTERFINAL * config.quarterfinalWinPoints,
        semifinalWins: winsByPhase.SEMIFINAL * config.semifinalWinPoints,
        finalWins: winsByPhase.FINAL * config.finalWinPoints,
      };

      return {
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        role: user.role,
        totalPoints:
          pointsBreakdown.tournamentsPlayed +
          pointsBreakdown.matchesPlayed +
          pointsBreakdown.groupWins +
          pointsBreakdown.roundOf16Wins +
          pointsBreakdown.quarterfinalWins +
          pointsBreakdown.semifinalWins +
          pointsBreakdown.finalWins,
        tournamentsPlayed,
        matchesPlayed,
        winsByPhase,
        pointsBreakdown,
      };
    })
    .sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.winsByPhase.FINAL !== a.winsByPhase.FINAL) return b.winsByPhase.FINAL - a.winsByPhase.FINAL;
      if (b.winsByPhase.SEMIFINAL !== a.winsByPhase.SEMIFINAL) return b.winsByPhase.SEMIFINAL - a.winsByPhase.SEMIFINAL;
      if (b.matchesPlayed !== a.matchesPlayed) return b.matchesPlayed - a.matchesPlayed;
      return a.userName.localeCompare(b.userName, "es", { sensitivity: "base" });
    });
}

export function getPhaseLabel(phase: Phase): string {
  switch (phase) {
    case "GROUP":
      return "Grupos";
    case "ROUND_OF_16":
      return "Octavos";
    case "QUARTERFINAL":
      return "Cuartos";
    case "SEMIFINAL":
      return "Semis";
    case "FINAL":
      return "Final";
  }
}

export function getPhaseConfigLabel(phase: Phase): string {
  switch (phase) {
    case "GROUP":
      return "Victoria en grupos";
    case "ROUND_OF_16":
      return "Victoria en octavos";
    case "QUARTERFINAL":
      return "Victoria en cuartos";
    case "SEMIFINAL":
      return "Victoria en semifinal";
    case "FINAL":
      return "Victoria en final";
  }
}
