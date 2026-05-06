/*
  Warnings:

  - You are about to drop the column `matchPoints` on the `Tournament` table. All the data in the column will be lost.
  - You are about to drop the column `regularGamePoints` on the `Tournament` table. All the data in the column will be lost.
  - You are about to drop the column `seriesFormat` on the `Tournament` table. All the data in the column will be lost.
  - You are about to drop the column `tiebreakerPoints` on the `Tournament` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[dni]` on the table `Player` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[dni]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('TOURNAMENT_CREATED', 'REGISTRATION_OPEN', 'TOURNAMENT_STARTED', 'TOURNAMENT_FINISHED', 'LOCATION_INVITE', 'TOURNAMENT_INVITATION', 'TEAM_REGISTERED');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "TeamRegistrationStatus" AS ENUM ('PENDING', 'APPROVED');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'ORGANIZER';

-- DropForeignKey
ALTER TABLE "TeamPlayer" DROP CONSTRAINT "TeamPlayer_playerId_fkey";

-- AlterTable
ALTER TABLE "Player" ADD COLUMN     "confirmed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "dni" TEXT,
ADD COLUMN     "provincia" TEXT;

-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "hasPaid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "registrationStatus" "TeamRegistrationStatus" NOT NULL DEFAULT 'APPROVED';

-- AlterTable
ALTER TABLE "Tournament" DROP COLUMN "matchPoints",
DROP COLUMN "regularGamePoints",
DROP COLUMN "seriesFormat",
DROP COLUMN "tiebreakerPoints",
ADD COLUMN     "inscriptionFee" INTEGER,
ADD COLUMN     "locality" TEXT,
ADD COLUMN     "maxPlayers" INTEGER,
ADD COLUMN     "provincia" TEXT,
ADD COLUMN     "reglamentoId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "acceptsAppNotifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "acceptsContactByEmail" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "acceptsContactByPhone" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "acceptsCountryInvites" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "acceptsLocalityInvites" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "acceptsProvinciaInvites" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "acceptsWhatsAppContact" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "dni" TEXT,
ADD COLUMN     "instagram" TEXT,
ADD COLUMN     "locality" TEXT,
ADD COLUMN     "pendingActivation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "provincia" TEXT;

-- DropEnum
DROP TYPE "SeriesFormat";

-- CreateTable
CREATE TABLE "Reglamento" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "contenido" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "adminId" TEXT NOT NULL,

    CONSTRAINT "Reglamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tournamentId" TEXT NOT NULL,
    "inviterId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentRegistration" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tournamentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "TournamentRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentInterest" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,

    CONSTRAINT "TournamentInterest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Follow" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Follow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "tournamentId" TEXT,
    "invitationId" TEXT,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizerContact" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "dni" TEXT,
    "locality" TEXT,
    "provincia" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organizerId" TEXT NOT NULL,

    CONSTRAINT "OrganizerContact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_tournamentId_userId_key" ON "Invitation"("tournamentId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentRegistration_tournamentId_userId_key" ON "TournamentRegistration"("tournamentId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentInterest_userId_tournamentId_key" ON "TournamentInterest"("userId", "tournamentId");

-- CreateIndex
CREATE UNIQUE INDEX "Follow_followerId_followingId_key" ON "Follow"("followerId", "followingId");

-- CreateIndex
CREATE UNIQUE INDEX "Player_dni_key" ON "Player"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "User_dni_key" ON "User"("dni");

-- AddForeignKey
ALTER TABLE "Tournament" ADD CONSTRAINT "Tournament_reglamentoId_fkey" FOREIGN KEY ("reglamentoId") REFERENCES "Reglamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reglamento" ADD CONSTRAINT "Reglamento_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentRegistration" ADD CONSTRAINT "TournamentRegistration_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentRegistration" ADD CONSTRAINT "TournamentRegistration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentInterest" ADD CONSTRAINT "TournamentInterest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentInterest" ADD CONSTRAINT "TournamentInterest_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamPlayer" ADD CONSTRAINT "TeamPlayer_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizerContact" ADD CONSTRAINT "OrganizerContact_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
