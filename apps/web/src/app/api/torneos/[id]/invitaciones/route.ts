import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@tdt/db";
import { authOptions } from "@/lib/auth";
import { canManageTournament } from "@/lib/tournament-auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const tournament = await prisma.tournament.findUnique({ where: { id }, select: { adminId: true } });
  if (!tournament) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  if (!canManageTournament(session, tournament.adminId)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const invitations = await prisma.invitation.findMany({
    where: { tournamentId: id },
    include: {
      user: { select: { id: true, name: true, email: true, locality: true, province: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(invitations);
}

const postSchema = z.object({ userId: z.string() });

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const tournament = await prisma.tournament.findUnique({ where: { id }, select: { adminId: true, status: true } });
  if (!tournament) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  if (!canManageTournament(session, tournament.adminId)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  if (tournament.status === "FINISHED") {
    return NextResponse.json({ error: "El torneo ya finalizó" }, { status: 400 });
  }

  // PRO check: only PRO or ADMIN can invite
  const user = await prisma.user.findUnique({ where: { id: session!.user.id }, select: { plan: true, role: true } });
  if (user?.plan !== "PRO" && user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Las invitaciones son una función PRO" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const { userId } = parsed.data;

  const existing = await prisma.invitation.findUnique({
    where: { tournamentId_userId: { tournamentId: id, userId } },
  });
  if (existing) {
    return NextResponse.json({ error: "Ya fue invitado a este torneo" }, { status: 409 });
  }

  const invitation = await prisma.invitation.create({
    data: {
      tournamentId: id,
      inviterId: session!.user.id,
      userId,
    },
    include: { user: { select: { id: true, name: true } } },
  });

  // Create notification for the invited user
  const tournamentData = await prisma.tournament.findUnique({
    where: { id },
    select: { name: true },
  });
  await prisma.notification.create({
    data: {
      userId,
      type: "TOURNAMENT_INVITATION",
      message: `Fuiste invitado al torneo "${tournamentData?.name}" por ${session!.user.name}`,
      tournamentId: id,
      invitationId: invitation.id,
    },
  }).catch(() => {});

  return NextResponse.json(invitation, { status: 201 });
}
