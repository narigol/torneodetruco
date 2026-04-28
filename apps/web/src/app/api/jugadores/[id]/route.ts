import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@tdt/db";
import { z } from "zod";

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  const player = await prisma.player.findUnique({
    where: { id: params.id },
    include: {
      teamPlayers: {
        include: { team: { select: { name: true, tournament: { select: { name: true } } } } },
      },
    },
  });
  if (!player) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(player);
}

const updateSchema = z.object({
  name: z.string().min(1).max(100),
});

export async function PATCH(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const player = await prisma.player.update({
    where: { id: params.id },
    data: { name: parsed.data.name },
  });

  return NextResponse.json(player);
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  await prisma.player.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
