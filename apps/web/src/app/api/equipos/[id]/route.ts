import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@tdt/db";
import { canManageTournament } from "@/lib/tournament-auth";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const team = await prisma.team.findUnique({
    where: { id },
    include: { tournament: { select: { adminId: true, status: true } } },
  });

  if (!team) {
    return NextResponse.json({ error: "Equipo no encontrado" }, { status: 404 });
  }

  if (!canManageTournament(session, team.tournament.adminId)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  if (!["DRAFT", "REGISTRATION"].includes(team.tournament.status)) {
    return NextResponse.json(
      { error: "No se puede eliminar equipos de un torneo ya iniciado" },
      { status: 400 }
    );
  }

  await prisma.team.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
