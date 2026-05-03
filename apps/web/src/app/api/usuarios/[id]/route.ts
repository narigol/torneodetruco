import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@tdt/db";
import { z } from "zod";
import { isSuperAdmin } from "@/lib/tournament-auth";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!isSuperAdmin(session?.user?.role ?? "")) {
    return NextResponse.json({ error: "Solo el administrador puede eliminar usuarios" }, { status: 403 });
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  if (user.role === "ADMIN") return NextResponse.json({ error: "No se puede eliminar al super administrador" }, { status: 400 });

  await prisma.user.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}

const updateSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  dni: z.string().max(20).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  locality: z.string().max(100).optional().nullable(),
  province: z.string().max(100).optional().nullable(),
  instagram: z.string().max(100).optional().nullable(),
});

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  // Solo ADMIN puede editar otros usuarios
  if (!isSuperAdmin(session?.user?.role ?? "") && session?.user?.id !== id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
  }

  const { name, email, dni, phone, locality, province, instagram } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  if (email !== user.email) {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return NextResponse.json({ error: "El email ya está en uso" }, { status: 409 });
  }

  if (dni && dni !== user.dni) {
    const exists = await prisma.user.findUnique({ where: { dni } });
    if (exists) return NextResponse.json({ error: "El DNI ya está en uso" }, { status: 409 });
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { name, email, dni: dni ?? null, phone: phone ?? null, locality: locality ?? null, province: province ?? null, country: "Argentina", instagram: instagram ?? null },
  });

  return NextResponse.json(updated);
}
