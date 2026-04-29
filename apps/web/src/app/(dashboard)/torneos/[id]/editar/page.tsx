import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@tdt/db";
import Link from "next/link";
import { EditarTorneoForm } from "@/components/ui/EditarTorneoForm";

type Params = { params: Promise<{ id: string }> };

export default async function EditarTorneoPage({ params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") redirect(`/torneos/${id}`);

  const torneo = await prisma.tournament.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      format: true,
      status: true,
      startDate: true,
      matchPoints: true,
      qualifyPerGroup: true,
      playersPerTeam: true,
      seriesFormat: true,
      regularGamePoints: true,
      tiebreakerPoints: true,
    },
  });

  if (!torneo) notFound();
  if (torneo.status === "FINISHED") redirect(`/torneos/${id}`);

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <Link href={`/torneos/${id}`} className="text-gray-400 hover:text-gray-600 text-sm">
          ← {torneo.name}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">Editar torneo</h1>
      </div>

      <EditarTorneoForm
        torneo={{
          ...torneo,
          description: torneo.description,
          startDate: torneo.startDate ? torneo.startDate.toISOString() : null,
          seriesFormat: torneo.seriesFormat,
        }}
      />
    </div>
  );
}
