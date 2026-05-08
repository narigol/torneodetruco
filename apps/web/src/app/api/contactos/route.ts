import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@tdt/db";
import { isOrganizer } from "@/lib/tournament-auth";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().min(6).max(30).optional().nullable(),
  email: z.string().email().optional().nullable(),
  dni: z.string().min(6).max(20).optional().nullable(),
  locality: z.string().max(100).optional().nullable(),
  provincia: z.string().max(100).optional().nullable(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !isOrganizer(session.user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
  }

  const contact = await prisma.organizerContact.create({
    data: {
      ...parsed.data,
      organizerId: session.user.id,
    },
  });

  return NextResponse.json({ contact }, { status: 201 });
}
