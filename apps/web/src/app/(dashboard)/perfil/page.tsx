import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@tdt/db";
import { notFound } from "next/navigation";
import { PerfilForm } from "@/components/ui/PerfilForm";
import { PerfilSettings } from "@/components/ui/PerfilSettings";

export default async function PerfilPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) notFound();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      plan: true,
      planExpiresAt: true,
      dni: true,
      phone: true,
      locality: true,
      province: true,
      acceptsLocationInvites: true,
      acceptsEmailNotifications: true,
      player: {
        select: {
          provincia: true,
          locality: true,
          teamPlayers: {
            select: {
              team: {
                select: {
                  name: true,
                  tournament: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                  homeMatches: {
                    where: {
                      scheduledAt: { not: null },
                      status: { not: "FINISHED" },
                    },
                    select: {
                      id: true,
                      scheduledAt: true,
                      location: true,
                      homeTeam: { select: { name: true } },
                      awayTeam: { select: { name: true } },
                    },
                    orderBy: { scheduledAt: "asc" },
                  },
                  awayMatches: {
                    where: {
                      scheduledAt: { not: null },
                      status: { not: "FINISHED" },
                    },
                    select: {
                      id: true,
                      scheduledAt: true,
                      location: true,
                      homeTeam: { select: { name: true } },
                      awayTeam: { select: { name: true } },
                    },
                    orderBy: { scheduledAt: "asc" },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
  if (!user) notFound();

  const nextMatches = (user.player?.teamPlayers ?? [])
    .flatMap(({ team }) =>
      [...team.homeMatches, ...team.awayMatches].map((match) => ({
        ...match,
        teamName: team.name,
        tournamentId: team.tournament.id,
        tournamentName: team.tournament.name,
      }))
    )
    .sort((a, b) => {
      const timeA = a.scheduledAt ? new Date(a.scheduledAt).getTime() : Number.MAX_SAFE_INTEGER;
      const timeB = b.scheduledAt ? new Date(b.scheduledAt).getTime() : Number.MAX_SAFE_INTEGER;
      return timeA - timeB;
    })
    .slice(0, 6);

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Mi perfil</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
        <div>
          <PerfilForm
            id={user.id}
            name={user.name}
            email={user.email}
            role={user.role}
            plan={user.plan}
            planExpiresAt={user.planExpiresAt?.toISOString() ?? null}
            dni={user.dni ?? null}
            phone={user.phone ?? null}
            locality={user.locality ?? user.player?.locality ?? null}
            province={user.province ?? user.player?.provincia ?? null}
          />

          <div className="mt-5">
            <PerfilSettings
              acceptsLocationInvites={user.acceptsLocationInvites}
              acceptsEmailNotifications={user.acceptsEmailNotifications}
            />
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-6 h-fit">
          <h2 className="text-lg font-semibold text-gray-900">Mis proximos partidos</h2>
          <p className="text-sm text-gray-500 mt-1">
            Agenda rapida con los cruces ya programados.
          </p>

          <div className="mt-5 space-y-3">
            {nextMatches.length === 0 ? (
              <p className="text-sm text-gray-400">
                Todavia no tenes partidos programados.
              </p>
            ) : (
              nextMatches.map((match) => (
                <div key={match.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-xs text-gray-400">{match.tournamentName}</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    {match.homeTeam.name} vs {match.awayTeam?.name ?? "Por definir"}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Equipo: {match.teamName}
                  </p>
                  <p className="text-sm text-gray-700 mt-2">
                    {match.scheduledAt ? new Date(match.scheduledAt).toLocaleString("es-AR") : "Horario a definir"}
                  </p>
                  {match.location && (
                    <p className="text-xs text-gray-500 mt-1">{match.location}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
