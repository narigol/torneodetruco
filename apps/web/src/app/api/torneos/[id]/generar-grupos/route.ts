import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, TournamentFormat } from "@tdt/db";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const schema = z.object({
  numGroups: z.number().int().min(2).max(16),
});

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: { teams: true, groups: true },
  });

  if (!tournament) {
    return NextResponse.json({ error: "Torneo no encontrado" }, { status: 404 });
  }

  if (tournament.format !== TournamentFormat.GROUPS_AND_KNOCKOUT) {
    return NextResponse.json(
      { error: "Este torneo no tiene fase de grupos" },
      { status: 400 }
    );
  }

  if (tournament.groups.length > 0) {
    return NextResponse.json({ error: "Los grupos ya fueron generados" }, { status: 400 });
  }

  const { numGroups } = parsed.data;
  const shuffled = shuffle(tournament.teams);

  const groupLetters = Array.from({ length: numGroups }, (_, i) =>
    String.fromCharCode(65 + i)
  );

  await prisma.$transaction(async (tx) => {
    for (let g = 0; g < numGroups; g++) {
      const teamsInGroup = shuffled.filter((_, i) => i % numGroups === g);
      if (teamsInGroup.length < 2) continue;

      const group = await tx.group.create({
        data: {
          tournamentId: id,
          name: `Grupo ${groupLetters[g]}`,
          standings: {
            create: teamsInGroup.map((t) => ({ teamId: t.id })),
          },
        },
      });

      const matchData = [];
      for (let i = 0; i < teamsInGroup.length; i++) {
        for (let j = i + 1; j < teamsInGroup.length; j++) {
          matchData.push({
            tournamentId: id,
            groupId: group.id,
            phase: "GROUP" as const,
            round: 1,
            homeTeamId: teamsInGroup[i].id,
            awayTeamId: teamsInGroup[j].id,
          });
        }
      }

      await tx.match.createMany({ data: matchData });
    }
  });

  return NextResponse.json({ groups: numGroups });
}
