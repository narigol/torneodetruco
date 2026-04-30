import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@tdt/db";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    select: { id: true, status: true, published: true },
  });
  if (!tournament || !tournament.published) {
    return NextResponse.json({ error: "Torneo no encontrado" }, { status: 404 });
  }
  if (tournament.status === "FINISHED") {
    return NextResponse.json({ error: "El torneo ya finalizó" }, { status: 400 });
  }

  await prisma.tournamentInterest.upsert({
    where: { userId_tournamentId: { userId: session.user.id, tournamentId: id } },
    create: { userId: session.user.id, tournamentId: id },
    update: {},
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  await prisma.tournamentInterest.deleteMany({
    where: { userId: session.user.id, tournamentId: id },
  });

  return NextResponse.json({ ok: true });
}
