import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@tdt/db";
import { z } from "zod";
import { canManageTournament } from "@/lib/tournament-auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      admin: { select: { id: true, name: true } },
      teams: {
        include: {
          teamPlayers: { include: { player: { select: { id: true, name: true } } } },
        },
        orderBy: { name: "asc" },
      },
      groups: {
        include: {
          standings: {
            include: { team: { select: { id: true, name: true } } },
            orderBy: [{ points: "desc" }, { wins: "desc" }],
          },
          matches: {
            include: {
              homeTeam: { select: { id: true, name: true } },
              awayTeam: { select: { id: true, name: true } },
              winner: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { name: "asc" },
      },
      matches: {
        where: { groupId: null },
        include: {
          homeTeam: { select: { id: true, name: true } },
          awayTeam: { select: { id: true, name: true } },
          winner: { select: { id: true, name: true } },
        },
        orderBy: [{ round: "asc" }],
      },
    },
  });

  if (!tournament) {
    return NextResponse.json({ error: "Torneo no encontrado" }, { status: 404 });
  }

  return NextResponse.json(tournament);
}

const evenNumber = z.number().int().min(2).refine((n) => n % 2 === 0, {
  message: "Los puntos deben ser un número par",
});

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  status: z.enum(["DRAFT", "REGISTRATION", "IN_PROGRESS", "FINISHED"]).optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  startTime: z.string().max(50).nullable().optional(),
  location: z.string().max(500).nullable().optional(),
  matchPoints: evenNumber.optional(),
  qualifyPerGroup: z.number().int().min(1).max(8).optional(),
  playersPerTeam: z.number().int().min(1).max(3).optional(),
  seriesFormat: z.enum(["SINGLE", "BEST_OF_3"]).optional(),
  regularGamePoints: evenNumber.optional(),
  tiebreakerPoints: evenNumber.optional(),
});

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    select: { adminId: true },
  });
  if (!tournament) return NextResponse.json({ error: "Torneo no encontrado" }, { status: 404 });
  if (!canManageTournament(session, tournament.adminId)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
  }

  const { startDate, endDate, startTime, location, ...rest } = parsed.data;

  const updated = await prisma.tournament.update({
    where: { id },
    data: {
      ...rest,
      ...(startDate !== undefined ? { startDate: startDate ? new Date(startDate) : null } : {}),
      ...(endDate !== undefined ? { endDate: endDate ? new Date(endDate) : null } : {}),
      ...(startTime !== undefined ? { startTime: startTime ?? null } : {}),
      ...(location !== undefined ? { location: location ?? null } : {}),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    select: { adminId: true },
  });
  if (!tournament) return NextResponse.json({ error: "Torneo no encontrado" }, { status: 404 });
  if (!canManageTournament(session, tournament.adminId)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  await prisma.tournament.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
