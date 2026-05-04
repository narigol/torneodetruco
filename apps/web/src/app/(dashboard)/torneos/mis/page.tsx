import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@tdt/db";
import { TorneosFilter } from "@/components/ui/TorneosFilter";

export default async function MisTorneosPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { player: { select: { id: true } } },
  });

  const playerId = user?.player?.id;

  const tournamentSelect = {
    id: true,
    name: true,
    status: true,
    format: true,
    adminId: true,
    published: true,
    locality: true,
    province: true,
    startDate: true,
    admin: { select: { id: true, name: true } },
    _count: { select: { teams: true, matches: true } },
  } as const;

  const [playerTorneos, organizerTorneos] = await Promise.all([
    playerId
      ? prisma.tournament.findMany({
          orderBy: { createdAt: "desc" },
          where: {
            teams: { some: { teamPlayers: { some: { playerId } } } },
          },
          select: tournamentSelect,
        })
      : [],
    prisma.tournament.findMany({
      orderBy: { createdAt: "desc" },
      where: { adminId: session.user.id },
      select: tournamentSelect,
    }),
  ]);

  // Combinar deduplicando: si aparece en ambos, priorizamos el rol organizador
  const byId = new Map<string, (typeof playerTorneos[0]) & { _rol: "jugador" | "organizador" }>();
  for (const t of playerTorneos) byId.set(t.id, { ...t, _rol: "jugador" });
  for (const t of organizerTorneos) byId.set(t.id, { ...t, _rol: "organizador" });

  const torneos = [...byId.values()].sort(
    (a, b) => new Date(b.startDate ?? 0).getTime() - new Date(a.startDate ?? 0).getTime()
  );

  const hasOrganizer = organizerTorneos.length > 0;
  const hasPlayer = playerTorneos.length > 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis torneos</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {torneos.length} torneo{torneos.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/torneos" className="text-sm text-red-600 hover:underline font-medium">
          Ver todos los torneos →
        </Link>
      </div>

      <TorneosFilter
        torneos={torneos}
        showRolFilter={hasOrganizer && hasPlayer}
        showDraft
      />
    </div>
  );
}
