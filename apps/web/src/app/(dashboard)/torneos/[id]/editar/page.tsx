import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@tdt/db";
import Link from "next/link";
import { EditarTorneoForm } from "@/components/ui/EditarTorneoForm";
import { canManageTournament } from "@/lib/tournament-auth";

type Params = { params: Promise<{ id: string }> };

export default async function EditarTorneoPage({ params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const torneo = await prisma.tournament.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      format: true,
      status: true,
      startDate: true,
      startTime: true,
      location: true,
      locality: true,
      province: true,
      playersPerTeam: true,
      maxPlayers: true,
      adminId: true,
      reglamentoId: true,
    },
  });

  if (!torneo) notFound();
  if (!canManageTournament(session, torneo.adminId)) redirect(`/torneos/${id}`);
  if (torneo.status === "FINISHED") redirect(`/torneos/${id}`);

  const reglamentos = await prisma.reglamento.findMany({
    where: {
      OR: [
        { adminId: session!.user.id },
        { admin: { role: "ADMIN" } },
      ],
    },
    select: { id: true, nombre: true },
    orderBy: { nombre: "asc" },
  });

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <Link href={`/torneos/${id}`} className="text-gray-400 hover:text-gray-600 text-sm">
          ← {torneo.name}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">Editar torneo</h1>
      </div>

      <EditarTorneoForm
        torneo={{
          ...torneo,
          startDate: torneo.startDate ? torneo.startDate.toISOString() : null,
        }}
        reglamentos={reglamentos}
      />
    </div>
  );
}
