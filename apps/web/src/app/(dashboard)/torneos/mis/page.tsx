import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@tdt/db";
import { TorneosFilter } from "@/components/ui/TorneosFilter";

export default async function MisTorneosPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { player: { select: { id: true } } },
  });

  const playerId = user?.player?.id;
  const torneos = playerId
    ? await prisma.tournament.findMany({
        orderBy: { createdAt: "desc" },
        where: {
          teams: {
            some: {
              teamPlayers: {
                some: { playerId },
              },
            },
          },
        },
        include: {
          admin: { select: { id: true, name: true } },
          _count: { select: { teams: true, matches: true } },
        },
      })
    : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis torneos</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {torneos.length} torneo{torneos.length !== 1 ? "s" : ""} jugado{torneos.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/torneos"
          className="text-sm text-red-600 hover:underline font-medium"
        >
          Ver todos los torneos →
        </Link>
      </div>

      <TorneosFilter
        torneos={torneos}
      />
      {torneos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-white border border-gray-100 rounded-2xl">
          <div className="text-5xl mb-4">🃏</div>
          <p className="text-gray-500 font-medium">
            {playerId
              ? "Todavía no participaste en ningún torneo."
              : "No hay un jugador vinculado a tu cuenta."
            }
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Para ver los torneos que jugaste, vinculá tu usuario a un jugador en tu perfil.
          </p>
        </div>
      )}
    </div>
  );
}
