import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@tdt/db";
import Link from "next/link";
import { NuevoEquipoForm } from "@/components/ui/NuevoEquipoForm";
import { canManageTournament } from "@/lib/tournament-auth";

type Params = { params: Promise<{ id: string }> };

export default async function NuevoEquipoPage({ params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const [tournament, assignedPlayerIds, followedUsers] = await Promise.all([
    prisma.tournament.findUnique({
      where: { id },
      select: { id: true, name: true, status: true, playersPerTeam: true, adminId: true },
    }),
    prisma.teamPlayer.findMany({
      where: { team: { tournamentId: id } },
      select: { playerId: true },
    }),
    session?.user?.id
      ? prisma.follow.findMany({
          where: { followerId: session.user.id },
          select: { followingId: true },
        })
      : Promise.resolve([]),
  ]);

  if (!tournament) notFound();
  if (!canManageTournament(session, tournament.adminId)) redirect(`/torneos/${id}`);

  const assignedIds = new Set(assignedPlayerIds.map((tp) => tp.playerId));
  const followedIds = new Set(followedUsers.map((follow) => follow.followingId));
  const players = await prisma.player.findMany({
    where: { id: { notIn: [...assignedIds] } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, userId: true },
  });

  const sortedPlayers = [...players].sort((a, b) => {
    const aFollowed = a.userId ? followedIds.has(a.userId) : false;
    const bFollowed = b.userId ? followedIds.has(b.userId) : false;
    if (aFollowed !== bFollowed) return aFollowed ? -1 : 1;
    return a.name.localeCompare(b.name, "es", { sensitivity: "base" });
  });

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
        players={sortedPlayers.map(({ id, name, userId }) => ({
          id,
          name,
          isFollowed: userId ? followedIds.has(userId) : false,
        }))}
        playersPerTeam={tournament.playersPerTeam}
      />
    </div>
  );
}
