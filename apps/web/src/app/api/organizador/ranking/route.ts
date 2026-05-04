import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isOrganizer } from "@/lib/tournament-auth";
import { getRankingConfig, getRankingRows } from "@/lib/ranking";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !isOrganizer(session.user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const config = await getRankingConfig();
  const rows = await getRankingRows(config, session.user.id);

  return NextResponse.json(rows);
}
