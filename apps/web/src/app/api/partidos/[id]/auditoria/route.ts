import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@tdt/db";
import { canManageTournament } from "@/lib/tournament-auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      tournament: {
        select: { adminId: true },
      },
    },
  });

  if (!match) {
    return NextResponse.json({ error: "Partido no encontrado" }, { status: 404 });
  }

  if (!canManageTournament(session, match.tournament.adminId)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const audits = await prisma.matchAudit.findMany({
    where: { matchId: id },
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { name: true, email: true },
      },
    },
  });

  return NextResponse.json(audits);
}
