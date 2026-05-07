import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@tdt/db";
import { authOptions } from "@/lib/auth";
import { isOrganizer } from "@/lib/tournament-auth";

const articleSchema = z.object({
  articuloId: z.string(),
  visible: z.boolean(),
  contenidoOverride: z.string().nullable().optional(),
});

const schema = z.object({
  nombre: z.string().min(1).max(200),
  descripcion: z.string().max(500).optional().nullable(),
  isPublic: z.boolean().optional().default(false),
  articles: z.array(articleSchema).optional().default([]),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !isOrganizer(session.user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const reglamentos = await prisma.reglamento.findMany({
    where: {
      OR: [
        { adminId: session.user.id },
        { admin: { role: "ADMIN" } },
      ],
    },
    include: {
      admin: { select: { id: true, name: true } },
      articulos: {
        include: { articulo: true },
        orderBy: { articulo: { orden: "asc" } },
      },
      torneos: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(reglamentos);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !isOrganizer(session.user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const { nombre, descripcion, isPublic, articles } = parsed.data;

  // El reglamento del ADMIN siempre es público
  const effectiveIsPublic = session.user.role === "ADMIN" ? true : (isPublic ?? false);

  const reglamento = await prisma.$transaction(async (tx) => {
    const reg = await tx.reglamento.create({
      data: { nombre, descripcion, isPublic: effectiveIsPublic, adminId: session.user.id },
    });

    if (articles.length > 0) {
      await tx.reglamentoArticulo.createMany({
        data: articles.map((a) => ({
          reglamentoId: reg.id,
          articuloId: a.articuloId,
          visible: a.visible,
          contenidoOverride: a.contenidoOverride ?? null,
        })),
      });
    }

    return tx.reglamento.findUnique({
      where: { id: reg.id },
      include: {
        admin: { select: { id: true, name: true } },
        articulos: { include: { articulo: true }, orderBy: { articulo: { orden: "asc" } } },
      },
    });
  });

  return NextResponse.json(reglamento, { status: 201 });
}
