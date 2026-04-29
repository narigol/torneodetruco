-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN     "matchPoints" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "qualifyPerGroup" INTEGER NOT NULL DEFAULT 2;
