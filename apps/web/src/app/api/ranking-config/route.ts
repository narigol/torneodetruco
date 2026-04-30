import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@tdt/db";
import { getRankingConfig, RANKING_CONFIG_KEY } from "@/lib/ranking";

const schema = z.object({
  tournamentPlayedPoints: z.number().int().min(0),
  matchPlayedPoints: z.number().int().min(0),
  groupWinPoints: z.number().int().min(0),
  roundOf16WinPoints: z.number().int().min(0),
  quarterfinalWinPoints: z.number().int().min(0),
  semifinalWinPoints: z.number().int().min(0),
  finalWinPoints: z.number().int().min(0),
});

export async function GET() {
  const config = await getRankingConfig();
  return NextResponse.json(config);
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") { // solo superadmin
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
  }

  const config = await prisma.rankingConfig.upsert({
    where: { key: RANKING_CONFIG_KEY },
    update: parsed.data,
    create: { key: RANKING_CONFIG_KEY, ...parsed.data },
  });

  return NextResponse.json(config);
}
