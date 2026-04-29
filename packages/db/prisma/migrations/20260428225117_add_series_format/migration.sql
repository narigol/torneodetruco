-- CreateEnum
CREATE TYPE "SeriesFormat" AS ENUM ('SINGLE', 'BEST_OF_3');

-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "games" JSONB;

-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN     "regularGamePoints" INTEGER NOT NULL DEFAULT 24,
ADD COLUMN     "seriesFormat" "SeriesFormat" NOT NULL DEFAULT 'SINGLE',
ADD COLUMN     "tiebreakerPoints" INTEGER NOT NULL DEFAULT 30;
