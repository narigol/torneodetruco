import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@tdt/db";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(100),
});

export async function GET() {
  const players = await prisma.player.findMany({
    orderBy: { name: "asc" },
    include: {
      user: { select: { email: true } },
      teamPlayers: {
        include: { team: { select: { name: true, tournamentId: true } } },
      },
    },
  });
  return NextResponse.json(players);
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

  const player = await prisma.player.create({
    data: { name: parsed.data.name },
  });

  return NextResponse.json(player, { status: 201 });
}
