import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@tdt/db";
import { authOptions } from "@/lib/auth";
import { isOrganizer } from "@/lib/tournament-auth";

const schema = z.object({
  nombre: z.string().min(1).max(200),
  descripcion: z.string().max(500).optional().nullable(),
  contenido: z.string().min(1),
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
    include: { admin: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(reglamentos);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !isOrganizer(session.user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const reglamento = await prisma.reglamento.create({
    data: {
      ...parsed.data,
      adminId: session.user.id,
    },
    include: { admin: { select: { id: true, name: true } } },
  });

  return NextResponse.json(reglamento, { status: 201 });
}
