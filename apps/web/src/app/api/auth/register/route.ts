import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@tdt/db";

const schema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6),
  dni: z.string().min(6).max(20).optional().nullable(),
  locality: z.string().max(100).optional().nullable(),
  province: z.string().max(100).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const { name, email, password, dni, locality, province, country } = parsed.data;
  const hashed = await bcrypt.hash(password, 10);

  // Check if there's a pending user with the same email or DNI (created by an organizer)
  const pendingUser = await prisma.user.findFirst({
    where: {
      pendingActivation: true,
      OR: [
        { email },
        ...(dni ? [{ dni }] : []),
      ],
    },
    include: { player: { select: { id: true } } },
  });

  if (pendingUser) {
    // Activate the pending user
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: pendingUser.id },
        data: {
          name,
          email,
          password: hashed,
          pendingActivation: false,
          dni: dni || null,
          locality: locality || null,
          province: province || null,
          country: country || "Argentina",
        },
      });
      if (pendingUser.player) {
        await tx.player.update({
          where: { id: pendingUser.player.id },
          data: { name, email, confirmed: true, dni: dni || null, locality: locality || null, provincia: province || null },
        });
      }
    });
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  // No pending user — check for uniqueness and create fresh
  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    return NextResponse.json({ error: "El email ya está registrado" }, { status: 409 });
  }

  if (dni) {
    const existingDni = await prisma.user.findUnique({ where: { dni } });
    if (existingDni) {
      return NextResponse.json({ error: "El DNI ya está registrado" }, { status: 409 });
    }
  }

  // Find existing orphan player by email or DNI to link
  const existingPlayer = await prisma.player.findFirst({
    where: {
      userId: null,
      OR: [{ email }, ...(dni ? [{ dni }] : [])],
    },
    select: { id: true },
  });

  await prisma.$transaction(async (tx) => {
    await tx.user.create({
      data: {
        name,
        email,
        password: hashed,
        role: "PLAYER",
        dni: dni || null,
        locality: locality || null,
        province: province || null,
        country: country || "Argentina",
        pendingActivation: false,
        player: existingPlayer
          ? { connect: { id: existingPlayer.id } }
          : { create: { name, email, confirmed: true } },
      },
    });

    if (existingPlayer) {
      await tx.player.update({
        where: { id: existingPlayer.id },
        data: { confirmed: true },
      });
    }
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
