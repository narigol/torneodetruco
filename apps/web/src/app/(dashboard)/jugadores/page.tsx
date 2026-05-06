import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@tdt/db";
import Link from "next/link";
import { JugadoresFilter } from "@/components/ui/JugadoresFilter";
import { EmptyState } from "@/components/ui/EmptyState";
import { resolveContact } from "@/lib/resolve-player";

export default async function JugadoresPage() {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === "ADMIN";

  const jugadores = await prisma.player.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      locality: true,
      provincia: true,
      userId: true,
      user: { select: { email: true, phone: true, locality: true, provincia: true } },
      teamPlayers: {
        include: {
          team: {
            select: {
              name: true,
              tournament: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Jugadores</h1>
          <p className="text-gray-500 text-sm mt-1">
            {jugadores.length} jugador{jugadores.length !== 1 ? "es" : ""}
          </p>
        </div>
        {isAdmin && (
          <Link
            href="/jugadores/nuevo"
            className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
          >
            + Nuevo jugador
          </Link>
        )}
      </div>

      {jugadores.length === 0 ? (
        <EmptyState
          message="No hay jugadores registrados"
          submessage={isAdmin ? undefined : undefined}
        />
      ) : (
        <JugadoresFilter
          jugadores={jugadores.map((j) => ({ ...resolveContact(j), teamPlayers: j.teamPlayers }))}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
}
