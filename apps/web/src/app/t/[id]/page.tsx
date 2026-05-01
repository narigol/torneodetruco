import Link from "next/link";
import { headers } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@tdt/db";
import { notFound } from "next/navigation";
import { PublicTournamentActions } from "@/components/tournament/PublicTournamentActions";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PublicTournamentPage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const tournament = await prisma.tournament.findFirst({
    where: { id, published: true },
    include: {
      admin: { select: { name: true } },
      _count: { select: { teams: true } },
    },
  });

  if (!tournament) notFound();

  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3001";
  const protocol = headersList.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const publicUrl = `${protocol}://${host}/t/${tournament.id}`;

  return (
    <main className="min-h-screen bg-stone-100 px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/torneos" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
            Volver a TdT
          </Link>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-red-600 border border-red-100">
            Link publico
          </span>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-sm">
          <div className="bg-red-600 px-8 py-10 text-white">
            <p className="text-sm uppercase tracking-[0.25em] text-red-100">Torneos de Truco</p>
            <h1 className="mt-3 text-4xl font-bold leading-tight">{tournament.name}</h1>
            {tournament.description && (
              <p className="mt-3 max-w-2xl text-sm text-red-50">{tournament.description}</p>
            )}
          </div>

          <div className="grid gap-8 px-8 py-8 lg:grid-cols-[1.1fr_0.9fr]">
            <section>
              <h2 className="text-lg font-semibold text-gray-900">Informacion del torneo</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <InfoCard label="Organiza" value={tournament.admin.name} />
                <InfoCard label="Formato" value={tournament.format === "GROUPS_AND_KNOCKOUT" ? "Grupos + eliminatoria" : "Eliminacion directa"} />
                <InfoCard label="Modalidad" value={`${tournament.playersPerTeam} vs ${tournament.playersPerTeam}`} />
                <InfoCard label="Equipos anotados" value={`${tournament._count.teams}`} />
                <InfoCard
                  label="Fecha"
                  value={tournament.startDate ? new Date(tournament.startDate).toLocaleDateString("es-AR") : "A definir"}
                />
                <InfoCard label="Hora" value={tournament.startTime || "A definir"} />
              </div>

              {tournament.location && (
                <div className="mt-5 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Lugar</p>
                  <p className="mt-2 text-sm text-gray-700">{tournament.location}</p>
                </div>
              )}

              <div className="mt-6 rounded-2xl border border-gray-100 bg-stone-50 p-5">
                <p className="text-sm font-semibold text-gray-900">Como funciona</p>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  Si el torneo esta en etapa de inscripcion, podes anotarte desde aca. Si jugas en pareja o equipos, te vamos a pedir los datos de tu companero al confirmar.
                </p>
              </div>
            </section>

            <aside className="space-y-4">
              <div className="rounded-3xl border border-gray-100 bg-stone-50 p-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Estado</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {tournament.status === "REGISTRATION"
                    ? "Inscripcion abierta"
                    : tournament.status === "IN_PROGRESS"
                      ? "Torneo en juego"
                      : tournament.status === "FINISHED"
                        ? "Torneo finalizado"
                        : "Proximamente"}
                </p>
                <p className="mt-3 text-sm text-gray-600">
                  {tournament.status === "REGISTRATION"
                    ? "Anotate ahora y reserva tu lugar."
                    : tournament.status === "IN_PROGRESS"
                      ? "La competencia ya empezo, pero igual podes seguirla desde TdT."
                      : tournament.status === "FINISHED"
                        ? "Este torneo ya cerro, pero podes revisar sus resultados en la plataforma."
                        : "El organizador todavia esta preparando todo."}
                </p>
              </div>

              <div className="rounded-3xl border border-gray-100 bg-white p-6">
                <h2 className="text-lg font-semibold text-gray-900">Inscripcion</h2>
                <p className="mt-2 text-sm text-gray-500">
                  El acceso se completa con tu cuenta de TdT para asociar correctamente a los jugadores.
                </p>

                <div className="mt-5">
                  {tournament.status === "REGISTRATION" ? (
                    <PublicTournamentActions
                      tournamentId={tournament.id}
                      playersPerTeam={tournament.playersPerTeam}
                      loggedIn={Boolean(session?.user?.id)}
                      callbackUrl={publicUrl}
                    />
                  ) : (
                    <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-500">
                      La inscripcion no esta disponible en este momento.
                    </div>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</p>
      <p className="mt-2 text-sm font-medium text-gray-800">{value}</p>
    </div>
  );
}
