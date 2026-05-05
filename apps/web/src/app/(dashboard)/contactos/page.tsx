import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@tdt/db";
import { isOrganizer } from "@/lib/tournament-auth";
import { ContactosPageClient } from "@/components/ui/ContactosPageClient";

export default async function ContactosPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isOrganizer(session.user.role)) redirect("/torneos");

  const torneos = await prisma.tournament.findMany({
    where: { adminId: session.user.id },
    select: {
      id: true,
      name: true,
      teams: {
        where: { registrationStatus: "APPROVED" },
        select: {
          teamPlayers: {
            select: {
              player: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true,
                  dni: true,
                  locality: true,
                  provincia: true,
                  userId: true,
                },
              },
            },
          },
        },
      },
    },
  });

  // Deduplicate players, tracking which tournaments they've been in
  const playerMap = new Map<string, {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    dni: string | null;
    locality: string | null;
    provincia: string | null;
    userId: string | null;
    torneos: string[];
  }>();

  for (const torneo of torneos) {
    for (const team of torneo.teams) {
      for (const tp of team.teamPlayers) {
        const p = tp.player;
        if (!playerMap.has(p.id)) {
          playerMap.set(p.id, { ...p, torneos: [] });
        }
        const entry = playerMap.get(p.id)!;
        if (!entry.torneos.includes(torneo.name)) {
          entry.torneos.push(torneo.name);
        }
      }
    }
  }

  const contactos = [...playerMap.values()].sort((a, b) =>
    a.name.localeCompare(b.name, "es")
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contactos</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Jugadores que participaron en tus torneos · {contactos.length} contacto{contactos.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <ContactosPageClient contactos={contactos} />
    </div>
  );
}
