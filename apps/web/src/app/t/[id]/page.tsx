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
    where: { id },
    include: {
      admin: { select: { name: true, phone: true, acceptsWhatsAppContact: true } },
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
                <div className="rounded-2xl border border-gray-100 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Organiza</p>
                  <p className="mt-2 text-sm font-medium text-gray-800">{tournament.admin.name}</p>
                  {tournament.admin.phone && tournament.admin.acceptsWhatsAppContact && (
                    <a
                      href={`https://wa.me/${tournament.admin.phone.replace(/\D/g, "").replace(/^0/, "").replace(/^(?!54)/, "549")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-2 text-xs font-medium text-green-600 hover:text-green-700 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      Contactar por WhatsApp
                    </a>
                  )}
                </div>
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
