import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@tdt/db";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().nullable(),
  format: z.enum(["GROUPS_AND_KNOCKOUT", "SINGLE_ELIMINATION"]),
  startDate: z.string().datetime().optional().nullable(),
});

export async function GET() {
  const tournaments = await prisma.tournament.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      admin: { select: { name: true } },
      _count: { select: { teams: true, matches: true } },
    },
  });
  return NextResponse.json(tournaments);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const { name, description, format, startDate } = parsed.data;

  const tournament = await prisma.tournament.create({
    data: {
      name,
      description,
      format,
      startDate: startDate ? new Date(startDate) : null,
      adminId: session.user.id,
    },
  });

  return NextResponse.json(tournament, { status: 201 });
}
