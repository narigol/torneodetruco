import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@tdt/db";
import { canManageTournament } from "@/lib/tournament-auth";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  action: z.enum(["approve", "reject", "togglePayment"]),
});

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const team = await prisma.team.findUnique({
    where: { id },
    select: { hasPaid: true, tournament: { select: { adminId: true, status: true } } },
  });

  if (!team) return NextResponse.json({ error: "Equipo no encontrado" }, { status: 404 });
  if (!canManageTournament(session, team.tournament.adminId)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  if (parsed.data.action === "approve") {
    const updated = await prisma.team.update({
      where: { id },
      data: { registrationStatus: "APPROVED" },
    });
    return NextResponse.json(updated);
  } else if (parsed.data.action === "togglePayment") {
    const updated = await prisma.team.update({
      where: { id },
      data: { hasPaid: !team.hasPaid },
    });
    return NextResponse.json(updated);
  } else {
    await prisma.team.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const team = await prisma.team.findUnique({
    where: { id },
    select: { tournament: { select: { adminId: true, status: true } } },
  });

  if (!team) return NextResponse.json({ error: "Equipo no encontrado" }, { status: 404 });

  if (!canManageTournament(session, team.tournament.adminId)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  if (!["DRAFT", "REGISTRATION"].includes(team.tournament.status)) {
    return NextResponse.json({ error: "No se puede eliminar equipos en este estado del torneo" }, { status: 400 });
  }

  await prisma.team.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
