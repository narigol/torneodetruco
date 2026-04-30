import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@tdt/db";
import { z } from "zod";
import { findUserToLink } from "@/lib/player-link";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const player = await prisma.player.findUnique({
    where: { id },
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
  email: z.string().email().optional().nullable(),
  dni: z.string().min(6).max(20).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  locality: z.string().max(100).optional().nullable(),
  provincia: z.string().max(100).optional().nullable(),
});

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos invalidos" }, { status: 400 });
  }

  const existingUser = await findUserToLink(parsed.data.email, parsed.data.dni);

  const player = await prisma.player.update({
    where: { id },
    data: {
      name: parsed.data.name,
      email: parsed.data.email ?? null,
      dni: parsed.data.dni ?? null,
      phone: parsed.data.phone ?? null,
      locality: parsed.data.locality ?? null,
      provincia: parsed.data.provincia ?? null,
      ...(existingUser && (!existingUser.player || existingUser.player.id === id)
        ? { user: { connect: { id: existingUser.id } } }
        : {}),
    },
  });

  return NextResponse.json(player);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  await prisma.player.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
