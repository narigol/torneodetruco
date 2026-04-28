import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@tdt/db";
import Link from "next/link";
import { NuevoEquipoForm } from "@/components/ui/NuevoEquipoForm";

type Params = { params: { id: string } };

export default async function NuevoEquipoPage({ params }: Params) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") redirect(`/torneos/${params.id}`);

  const [tournament, players] = await Promise.all([
    prisma.tournament.findUnique({
      where: { id: params.id },
      select: { id: true, name: true, status: true },
    }),
    prisma.player.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  if (!tournament) notFound();
  if (tournament.status === "FINISHED") redirect(`/torneos/${params.id}`);

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <Link
          href={`/torneos/${params.id}`}
          className="text-gray-400 hover:text-gray-600 text-sm"
        >
          ← {tournament.name}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">Nuevo equipo</h1>
      </div>

      <NuevoEquipoForm tournamentId={params.id} players={players} />
    </div>
  );
}
