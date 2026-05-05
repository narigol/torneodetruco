import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@tdt/db";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const schema = z.object({
  myDni: z.string().min(6).max(20).optional().nullable(),
  myPhone: z.string().min(6).max(30).optional().nullable(),
  partnerName: z.string().min(1).max(100).optional(),
  partnerEmail: z.string().email().optional().nullable(),
  partnerDni: z.string().min(6).max(20).optional().nullable(),
  partnerPhone: z.string().min(6).max(30).optional().nullable(),
});

function alias(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts[0] + (parts.length > 1 ? parts[parts.length - 1][0].toUpperCase() : "");
}

export async function POST(req: Request, { params }: Params) {
  const { id: tournamentId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
  }
  const { myDni, myPhone, partnerName, partnerEmail, partnerDni, partnerPhone } = parsed.data;

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { id: true, status: true, playersPerTeam: true, maxPlayers: true, adminId: true },
  });

  if (!tournament || tournament.status === "DRAFT") {
    return NextResponse.json({ error: "Torneo no encontrado" }, { status: 404 });
  }
  if (tournament.status !== "REGISTRATION") {
    return NextResponse.json({ error: "El torneo no está aceptando inscripciones" }, { status: 400 });
  }
  if (tournament.playersPerTeam > 1 && !partnerName) {
    return NextResponse.json({ error: "Nombre del compañero requerido" }, { status: 400 });
  }

  // Obtener o crear Player del usuario actual
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, dni: true, phone: true, player: { select: { id: true } } },
  });
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  let myPlayerId = user.player?.id;
  if (!myPlayerId) {
    myPlayerId = await prisma.$transaction(async (tx) => {
      const newPlayer = await tx.player.create({
        data: {
          name: user.name,
          email: user.email,
          dni: myDni ?? user.dni ?? null,
          phone: myPhone ?? user.phone ?? null,
          confirmed: true,
        },
      });
      await tx.user.update({
        where: { id: session.user.id },
        data: { player: { connect: { id: newPlayer.id } } },
      });
      return newPlayer.id;
    });
  } else if (myPhone || myDni) {
    await prisma.player.update({
      where: { id: myPlayerId },
      data: {
        ...(myPhone ? { phone: myPhone } : {}),
        ...(myDni ? { dni: myDni } : {}),
      },
    });
  }

  // Buscar o crear Player del compañero (solo para torneos con más de 1 jugador por equipo)
  let partnerPlayerId: string | null = null;
  if (tournament.playersPerTeam > 1 && partnerName) {
    let partner = (partnerEmail || partnerDni)
      ? await prisma.player.findFirst({
          where: {
            OR: [
              ...(partnerEmail ? [{ email: partnerEmail }] : []),
              ...(partnerDni ? [{ dni: partnerDni }] : []),
            ],
          },
          select: { id: true },
        })
      : null;

    if (!partner) {
      partner = await prisma.player.create({
        data: {
          name: partnerName,
          email: partnerEmail ?? null,
          dni: partnerDni ?? null,
          phone: partnerPhone ?? null,
        },
      });
    }
    partnerPlayerId = partner.id;
  }

  const playerIds = [myPlayerId, ...(partnerPlayerId ? [partnerPlayerId] : [])];

  // Validar capacidad
  const teamCount = await prisma.team.count({ where: { tournamentId } });
  const currentPeople = teamCount * tournament.playersPerTeam;
  if (tournament.maxPlayers !== null && tournament.maxPlayers !== undefined) {
    if (currentPeople + playerIds.length > tournament.maxPlayers) {
      const restantes = tournament.maxPlayers - currentPeople;
      return NextResponse.json(
        { error: `El torneo tiene cupo para ${tournament.maxPlayers} jugadores. ${restantes > 0 ? `Solo quedan ${restantes} lugar${restantes !== 1 ? "es" : ""}.` : "El cupo está completo."}` },
        { status: 400 }
      );
    }
  }

  // Validar que ningún jugador ya esté en otro equipo de este torneo
  const already = await prisma.teamPlayer.findFirst({
    where: { playerId: { in: playerIds }, team: { tournamentId } },
    include: { player: { select: { name: true } } },
  });
  if (already) {
    return NextResponse.json(
      { error: `${already.player.name} ya está inscripto en este torneo` },
      { status: 400 }
    );
  }

  // Crear equipo
  const teamName = tournament.playersPerTeam === 1
    ? user.name
    : `${alias(user.name)} y ${alias(partnerName!)}`;

  const team = await prisma.team.create({
    data: {
      name: teamName,
      tournamentId,
      registrationStatus: "PENDING",
      teamPlayers: { create: playerIds.map((playerId) => ({ playerId })) },
    },
    select: { id: true, name: true },
  });

  // Eliminar TournamentInterest si existe (ya está formalmente inscripto)
  await prisma.tournamentInterest.deleteMany({
    where: { userId: session.user.id, tournamentId },
  });

  // Notificar al organizador
  prisma.notification.create({
    data: {
      userId: tournament.adminId,
      tournamentId,
      type: "TEAM_REGISTERED",
      message: `${team.name} se inscribió al torneo.`,
    },
  }).catch(() => {});

  return NextResponse.json({ team }, { status: 201 });
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id: tournamentId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { status: true },
  });
  if (!tournament || tournament.status !== "REGISTRATION") {
    return NextResponse.json({ error: "No se puede cancelar la inscripción en este momento" }, { status: 400 });
  }

  // Buscar el equipo donde el usuario actual es jugador
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { player: { select: { id: true } } },
  });
  if (!user?.player) {
    return NextResponse.json({ error: "No tenés equipo en este torneo" }, { status: 404 });
  }

  const teamPlayer = await prisma.teamPlayer.findFirst({
    where: { playerId: user.player.id, team: { tournamentId } },
    select: { teamId: true },
  });
  if (!teamPlayer) {
    return NextResponse.json({ error: "No tenés equipo en este torneo" }, { status: 404 });
  }

  await prisma.team.delete({ where: { id: teamPlayer.teamId } });

  return NextResponse.json({ ok: true });
}
