import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@tdt/db";
import { authOptions } from "@/lib/auth";
import { isSuperAdmin, isOrganizer } from "@/lib/tournament-auth";

const schema = z.object({
  nombre: z.string().min(1).max(200).optional(),
  descripcion: z.string().max(500).optional().nullable(),
  contenido: z.string().min(1).optional(),
});

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !isOrganizer(session.user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const reglamento = await prisma.reglamento.findUnique({
    where: { id: params.id },
    include: { admin: { select: { id: true, name: true } } },
  });

  if (!reglamento) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  return NextResponse.json(reglamento);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !isOrganizer(session.user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const reglamento = await prisma.reglamento.findUnique({ where: { id: params.id } });
  if (!reglamento) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  if (!isSuperAdmin(session.user.role) && reglamento.adminId !== session.user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const updated = await prisma.reglamento.update({
    where: { id: params.id },
    data: parsed.data,
    include: { admin: { select: { id: true, name: true } } },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !isOrganizer(session.user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const reglamento = await prisma.reglamento.findUnique({ where: { id: params.id } });
  if (!reglamento) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  if (!isSuperAdmin(session.user.role) && reglamento.adminId !== session.user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  await prisma.reglamento.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
