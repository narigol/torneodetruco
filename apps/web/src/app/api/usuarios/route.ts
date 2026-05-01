import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@tdt/db";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { isOrganizer, isSuperAdmin } from "@/lib/tournament-auth";

const createSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  dni: z.string().max(20).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  locality: z.string().max(100).optional().nullable(),
  province: z.string().max(100).optional().nullable(),
});

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !isOrganizer(session.user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const locality = searchParams.get("locality") ?? "";
  const limit = parseInt(searchParams.get("limit") ?? "200", 10);

  const users = await prisma.user.findMany({
    where: {
      AND: [
        search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { dni: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { locality: { contains: search, mode: "insensitive" } },
              ],
            }
          : {},
        locality ? { locality: { contains: locality, mode: "insensitive" } } : {},
      ],
    },
    orderBy: { name: "asc" },
    take: Math.min(limit, 200),
    select: {
      id: true,
      name: true,
      email: true,
      dni: true,
      phone: true,
      locality: true,
      province: true,
      role: true,
      plan: true,
      pendingActivation: true,
      createdAt: true,
    },
  });

  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !isOrganizer(session.user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
  }

  const { name, email, dni, phone, locality, province } = parsed.data;

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

  // ORGANIZER crea usuario pendiente (no puede hacer login hasta que se registre)
  // ADMIN crea usuario activo con contraseña temporal
  const isPending = !isSuperAdmin(session.user.role);
  const tempPassword = await bcrypt.hash(uuidv4(), 10);

  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        name,
        email,
        password: tempPassword,
        role: "PLAYER",
        dni: dni ?? null,
        phone: phone ?? null,
        locality: locality ?? null,
        province: province ?? null,
        country: "Argentina",
        pendingActivation: isPending,
        player: {
          create: {
            name,
            email,
            dni: dni ?? null,
            phone: phone ?? null,
            locality: locality ?? null,
            provincia: province ?? null,
            confirmed: !isPending,
          },
        },
      },
      select: { id: true, name: true, email: true, dni: true, pendingActivation: true, player: { select: { id: true } } },
    });
    return newUser;
  });

  return NextResponse.json(user, { status: 201 });
}
