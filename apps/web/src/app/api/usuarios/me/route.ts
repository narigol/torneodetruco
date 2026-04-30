import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@tdt/db";

const schema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  dni: z.string().max(20).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  locality: z.string().max(100).optional().nullable(),
  province: z.string().max(100).optional().nullable(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6).optional(),
}).refine(
  (d) => !d.newPassword || !!d.currentPassword,
  { message: "Ingresá tu contraseña actual para cambiarla", path: ["currentPassword"] }
);

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.errors[0]?.message ?? "Datos inválidos";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { name, email, dni, phone, locality, province, currentPassword, newPassword } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  if (email !== user.email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: "El email ya está en uso" }, { status: 409 });
  }

  if (dni && dni !== user.dni) {
    const existing = await prisma.user.findUnique({ where: { dni } });
    if (existing) return NextResponse.json({ error: "El DNI ya está en uso" }, { status: 409 });
  }

  let hashedPassword: string | undefined;
  if (newPassword) {
    const valid = await bcrypt.compare(currentPassword!, user.password);
    if (!valid) return NextResponse.json({ error: "La contraseña actual es incorrecta" }, { status: 400 });
    hashedPassword = await bcrypt.hash(newPassword, 10);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name,
      email,
      dni: dni ?? null,
      phone: phone ?? null,
      locality: locality ?? null,
      province: province ?? null,
      country: "Argentina",
      ...(hashedPassword ? { password: hashedPassword } : {}),
    },
  });

  return NextResponse.json({ ok: true });
}
