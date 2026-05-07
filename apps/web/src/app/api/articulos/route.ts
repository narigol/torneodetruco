import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@tdt/db";
import { authOptions } from "@/lib/auth";
import { isOrganizer } from "@/lib/tournament-auth";

const SECCIONES = ["GENERAL","FLOR","TRUCO","ENVIDO","ANEXO","PENALIDADES","PUNTAJES","JERARQUIA"] as const;

const schema = z.object({
  titulo: z.string().min(1).max(200),
  contenido: z.string().min(1),
  seccion: z.enum(SECCIONES).optional().default("GENERAL"),
  mandatory: z.boolean().optional().default(false),
  orden: z.number().int().optional().default(0),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !isOrganizer(session.user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const articulos = await prisma.articulo.findMany({
    where: {
      OR: [
        { adminId: session.user.id },
        { admin: { role: "ADMIN" } },
      ],
    },
    include: { admin: { select: { id: true, role: true } } },
    orderBy: [{ admin: { role: "asc" } }, { orden: "asc" }],
  });

  return NextResponse.json(articulos);
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

  const articulo = await prisma.articulo.create({
    data: { ...parsed.data, adminId: session.user.id },
  });

  return NextResponse.json(articulo, { status: 201 });
}
