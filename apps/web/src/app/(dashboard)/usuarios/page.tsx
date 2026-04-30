import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@tdt/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { isOrganizer, isSuperAdmin } from "@/lib/tournament-auth";
import { UsuariosClient } from "@/components/ui/UsuariosClient";

export default async function UsuariosPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isOrganizer(session.user.role)) redirect("/torneos");

  const isAdmin = isSuperAdmin(session.user.role);

  const usuarios = await prisma.user.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      dni: true,
      phone: true,
      locality: true,
      province: true,
      role: true,
      plan: true,
      pendingActivation: true,
      createdAt: true,
      player: {
        select: {
          id: true,
          confirmed: true,
          teamPlayers: {
            select: {
              team: {
                select: {
                  name: true,
                  tournament: { select: { name: true } },
                },
              },
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
          <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-gray-500 text-sm mt-1">
            {usuarios.length} usuario{usuarios.length !== 1 ? "s" : ""}
          </p>
        </div>
        {isAdmin && (
          <Link
            href="/usuarios/nuevo"
            className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
          >
            + Nuevo usuario
          </Link>
        )}
      </div>

      <UsuariosClient usuarios={usuarios} isAdmin={isAdmin} />
    </div>
  );
}
