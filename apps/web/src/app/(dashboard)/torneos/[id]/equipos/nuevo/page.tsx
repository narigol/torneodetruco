import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@tdt/db";
import Link from "next/link";
import { NuevoEquipoForm } from "@/components/ui/NuevoEquipoForm";

type Params = { params: Promise<{ id: string }> };

export default async function NuevoEquipoPage({ params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") redirect(`/torneos/${id}`);

  const [tournament, assignedPlayerIds] = await Promise.all([
    prisma.tournament.findUnique({
      where: { id },
      select: { id: true, name: true, status: true, playersPerTeam: true },
    }),
    prisma.teamPlayer.findMany({
      where: { team: { tournamentId: id } },
      select: { playerId: true },
    }),
  ]);

  const assignedIds = new Set(assignedPlayerIds.map((tp) => tp.playerId));
  const players = await prisma.player.findMany({
    where: { id: { notIn: [...assignedIds] } },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  if (!tournament) notFound();
  if (tournament.status === "FINISHED") redirect(`/torneos/${id}`);

  const modalidad = tournament.playersPerTeam === 1
    ? "Mano a mano (1 vs 1)"
    : tournament.playersPerTeam === 2
    ? "Parejas (2 vs 2)"
    : "Tríos (3 vs 3)";

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <Link
          href={`/torneos/${id}`}
          className="text-gray-400 hover:text-gray-600 text-sm"
        >
          ← {tournament.name}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">Nuevo equipo</h1>
        <p className="text-sm text-gray-400 mt-1">{modalidad}</p>
      </div>

      <NuevoEquipoForm
        tournamentId={id}
        players={players}
        playersPerTeam={tournament.playersPerTeam}
      />
    </div>
  );
}
