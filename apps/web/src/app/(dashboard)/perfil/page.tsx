import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@tdt/db";
import { notFound } from "next/navigation";
import { PerfilSettings } from "@/components/ui/PerfilSettings";

export default async function PerfilPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) notFound();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      role: true,
      plan: true,
      dni: true,
      acceptsLocationInvites: true,
      player: { select: { provincia: true, locality: true } },
    },
  });
  if (!user) notFound();

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Mi perfil</h1>
      <p className="text-gray-400 text-sm mb-8">Tus datos y preferencias de notificación</p>

      {/* Datos básicos */}
      <div className="bg-white border border-gray-100 rounded-xl p-6 mb-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Información de la cuenta</h2>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-400">Nombre</dt>
            <dd className="font-medium text-gray-900">{user.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-400">Email</dt>
            <dd className="text-gray-700">{user.email}</dd>
          </div>
          {user.dni && (
            <div className="flex justify-between">
              <dt className="text-gray-400">DNI</dt>
              <dd className="text-gray-700">{user.dni}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-gray-400">Rol</dt>
            <dd className="text-gray-700">{user.role === "ADMIN" ? "Organizador" : "Jugador"}</dd>
          </div>
          {user.player?.provincia && (
            <div className="flex justify-between">
              <dt className="text-gray-400">Provincia</dt>
              <dd className="text-gray-700">{user.player.provincia}</dd>
            </div>
          )}
          {user.player?.locality && (
            <div className="flex justify-between">
              <dt className="text-gray-400">Localidad</dt>
              <dd className="text-gray-700">{user.player.locality}</dd>
            </div>
          )}
        </dl>
      </div>

      <PerfilSettings acceptsLocationInvites={user.acceptsLocationInvites} />
    </div>
  );
}
