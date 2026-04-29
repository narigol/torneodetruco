import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@tdt/db";
import Link from "next/link";
import { DeleteButton } from "@/components/ui/DeleteButton";

export default async function JugadoresPage() {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === "ADMIN";

  const jugadores = await prisma.player.findMany({
    orderBy: { name: "asc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
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
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase border-b border-gray-100">
                <th className="text-left px-5 py-3 font-medium">Nombre</th>
                <th className="text-left px-5 py-3 font-medium">DNI</th>
                <th className="text-left px-5 py-3 font-medium">Email</th>
                <th className="text-left px-5 py-3 font-medium">Localidad</th>
                <th className="text-left px-5 py-3 font-medium">Estado</th>
                <th className="text-left px-5 py-3 font-medium">Equipos</th>
                {isAdmin && <th className="px-5 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {jugadores.map((j) => (
                <tr key={j.id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3 font-medium text-gray-900">{j.name}</td>
                  <td className="px-5 py-3 text-gray-500">
                    {j.dni ?? <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {j.email ? (
                      <a href={`mailto:${j.email}`} className="hover:text-red-600 transition-colors">
                        {j.email}
                      </a>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {[j.locality, j.province].filter(Boolean).join(", ") || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-5 py-3">
                    {j.confirmed ? (
                      <span className="inline-flex items-center gap-1.5 text-xs bg-green-50 text-green-700 border border-green-100 px-2 py-0.5 rounded-full font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        {j.user?.name ?? "Confirmado"}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs bg-yellow-50 text-yellow-700 border border-yellow-100 px-2 py-0.5 rounded-full font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                        Pendiente
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {j.teamPlayers.length === 0 ? (
                      <span className="text-gray-300">Sin equipo</span>
                    ) : (
                      j.teamPlayers
                        .map((tp) => `${tp.team.name} (${tp.team.tournament.name})`)
                        .join(", ")
                    )}
                  </td>
                  {isAdmin && (
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/jugadores/${j.id}/editar`}
                          className="text-xs text-gray-400 hover:text-gray-700"
                        >
                          Editar
                        </Link>
                        <DeleteButton
                          url={`/api/jugadores/${j.id}`}
                          label="Eliminar"
                          confirmText={`¿Eliminar a ${j.name}?`}
                        />
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
