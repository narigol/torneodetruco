CREATE TABLE "RankingConfig" (
    "key" TEXT NOT NULL DEFAULT 'global',
    "tournamentPlayedPoints" INTEGER NOT NULL DEFAULT 10,
    "matchPlayedPoints" INTEGER NOT NULL DEFAULT 3,
    "groupWinPoints" INTEGER NOT NULL DEFAULT 5,
    "roundOf16WinPoints" INTEGER NOT NULL DEFAULT 8,
    "quarterfinalWinPoints" INTEGER NOT NULL DEFAULT 12,
    "semifinalWinPoints" INTEGER NOT NULL DEFAULT 18,
    "finalWinPoints" INTEGER NOT NULL DEFAULT 30,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RankingConfig_pkey" PRIMARY KEY ("key")
);
