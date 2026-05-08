import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@tdt/db";
import { authOptions } from "@/lib/auth";
import { isSuperAdmin, isOrganizer } from "@/lib/tournament-auth";

const articleSchema = z.object({
  articuloId: z.string(),
  visible: z.boolean(),
  contenidoOverride: z.string().nullable().optional(),
});

const schema = z.object({
  nombre: z.string().min(1).max(200).optional(),
  descripcion: z.string().max(500).optional().nullable(),
  isPublic: z.boolean().optional(),
  articles: z.array(articleSchema).optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;

  const reglamento = await prisma.reglamento.findUnique({
    where: { id },
    include: {
      admin: { select: { id: true, name: true } },
      articulos: {
        include: { articulo: true },
        orderBy: { articulo: { orden: "asc" } },
      },
    },
  });

  if (!reglamento) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  // Acceso público si el reglamento lo es; si no, requiere auth de organizador
  if (!reglamento.isPublic) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !isOrganizer(session.user.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
  }

  return NextResponse.json(reglamento);
}

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !isOrganizer(session.user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const reglamento = await prisma.reglamento.findUnique({ where: { id } });
  if (!reglamento) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  if (!isSuperAdmin(session.user.role) && reglamento.adminId !== session.user.id) {
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

  const { articles, isPublic, ...rest } = parsed.data;

  // El reglamento del ADMIN siempre es público
  const fields = {
    ...rest,
    ...(isPublic !== undefined
      ? { isPublic: reglamento.adminId === session.user.id && session.user.role === "ADMIN" ? true : isPublic }
      : {}),
  };

  const updated = await prisma.$transaction(async (tx) => {
    await tx.reglamento.update({ where: { id }, data: fields });

    if (articles !== undefined) {
      await tx.reglamentoArticulo.deleteMany({ where: { reglamentoId: id } });
      if (articles.length > 0) {
        await tx.reglamentoArticulo.createMany({
          data: articles.map((a) => ({
            reglamentoId: id,
            articuloId: a.articuloId,
            visible: a.visible,
            contenidoOverride: a.contenidoOverride ?? null,
          })),
        });
      }
    }

    return tx.reglamento.findUnique({
      where: { id },
      include: {
        admin: { select: { id: true, name: true } },
        articulos: { include: { articulo: true }, orderBy: { articulo: { orden: "asc" } } },
      },
    });
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !isOrganizer(session.user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const reglamento = await prisma.reglamento.findUnique({ where: { id } });
  if (!reglamento) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  if (!isSuperAdmin(session.user.role) && reglamento.adminId !== session.user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  await prisma.reglamento.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
