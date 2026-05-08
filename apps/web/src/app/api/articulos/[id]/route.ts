import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@tdt/db";
import { authOptions } from "@/lib/auth";
import { isOrganizer, isSuperAdmin } from "@/lib/tournament-auth";

const SECCIONES = ["GENERAL","FLOR","TRUCO","ENVIDO","ANEXO","PENALIDADES","PUNTAJES","JERARQUIA"] as const;

const schema = z.object({
  titulo: z.string().min(1).max(200).optional(),
  contenido: z.string().min(1).optional(),
  seccion: z.enum(SECCIONES).optional(),
  mandatory: z.boolean().optional(),
  orden: z.number().int().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !isOrganizer(session.user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const articulo = await prisma.articulo.findUnique({ where: { id } });
  if (!articulo) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  if (!isSuperAdmin(session.user.role) && articulo.adminId !== session.user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const updated = await prisma.articulo.update({ where: { id }, data: parsed.data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !isOrganizer(session.user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const articulo = await prisma.articulo.findUnique({ where: { id } });
  if (!articulo) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  if (!isSuperAdmin(session.user.role) && articulo.adminId !== session.user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  await prisma.articulo.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
