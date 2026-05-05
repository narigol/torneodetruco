import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@tdt/db";
import { isOrganizer } from "@/lib/tournament-auth";
import { ContactosPageClient } from "@/components/ui/ContactosPageClient";
import { resolveContact } from "@/lib/resolve-player";

export default async function ContactosPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isOrganizer(session.user.role)) redirect("/torneos");

  const [torneos, seguidores, manualContacts] = await Promise.all([
    prisma.tournament.findMany({
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
                  user: { select: { email: true, phone: true, locality: true, province: true, dni: true } },
                },
              },
            },
          },
        },
      },
    },
    }),
    prisma.follow.findMany({
      where: { followingId: session.user.id },
      select: {
        follower: {
          select: { id: true, name: true, email: true, phone: true, locality: true, province: true, dni: true },
        },
      },
    }),
    prisma.organizerContact.findMany({
      where: { organizerId: session.user.id },
      select: { id: true, name: true, phone: true, email: true, dni: true, locality: true, province: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

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
    manualContactId?: string;
  }>();

  for (const torneo of torneos) {
    for (const team of torneo.teams) {
      for (const tp of team.teamPlayers) {
        const p = resolveContact(tp.player);
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

  // Add followers who aren't already in the map as tournament players
  const linkedUserIds = new Set(
    [...playerMap.values()].map((c) => c.userId).filter(Boolean)
  );
  for (const { follower } of seguidores) {
    if (linkedUserIds.has(follower.id)) continue;
    playerMap.set(`u:${follower.id}`, {
      id: follower.id,
      name: follower.name,
      email: follower.email,
      phone: follower.phone,
      locality: follower.locality,
      provincia: follower.province,
      dni: follower.dni,
      userId: follower.id,
      torneos: [],
    });
  }

  // Add manual contacts that aren't already tracked
  for (const mc of manualContacts) {
    playerMap.set(`mc:${mc.id}`, {
      id: mc.id,
      name: mc.name,
      email: mc.email ?? null,
      phone: mc.phone ?? null,
      locality: mc.locality ?? null,
      provincia: mc.province ?? null,
      dni: mc.dni ?? null,
      userId: null,
      torneos: [],
      manualContactId: mc.id,
    });
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
            Jugadores de tus torneos y seguidores · {contactos.length} contacto{contactos.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <ContactosPageClient contactos={contactos} />
    </div>
  );
}
