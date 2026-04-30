import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@tdt/db";
import Link from "next/link";
import { JugadoresFilter } from "@/components/ui/JugadoresFilter";

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
        <div className="text-center py-16 text-gray-400">
          <p>No hay jugadores registrados</p>
          {isAdmin && (
            <Link href="/jugadores/nuevo" className="mt-2 inline-block text-red-600 hover:underline text-sm">
              Registrar el primero
            </Link>
          )}
        </div>
      ) : (
        <JugadoresFilter jugadores={jugadores} isAdmin={isAdmin} />
      )}
    </div>
  );
}
