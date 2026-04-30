import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@tdt/db";

const schema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6),
  dni: z.string().min(6).max(20).optional().nullable(),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const { name, email, password, dni } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "El email ya está registrado" }, { status: 409 });
  }

  if (dni) {
    const dniTaken = await prisma.user.findUnique({ where: { dni } });
    if (dniTaken) {
      return NextResponse.json({ error: "El DNI ya está registrado" }, { status: 409 });
    }
  }

  const hashed = await bcrypt.hash(password, 10);

  const existingPlayer = await prisma.player.findFirst({
    where: {
      userId: null,
      OR: [
        { email },
        ...(dni ? [{ dni }] : []),
      ],
    },
    select: { id: true },
  });

  await prisma.user.create({
    data: {
      name,
      email,
      password: hashed,
      role: "PLAYER",
      ...(dni ? { dni } : {}),
      player: existingPlayer
        ? { connect: { id: existingPlayer.id } }
        : { create: { name, email, ...(dni ? { dni } : {}) } },
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
