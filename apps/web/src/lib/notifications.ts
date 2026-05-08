import { prisma } from "@tdt/db";
import type { NotificationType } from "@tdt/db";

export async function notifyFollowers(
  organizerId: string,
  tournamentId: string,
  type: NotificationType
) {
  const followers = await prisma.follow.findMany({
    where: { followingId: organizerId },
    select: { followerId: true },
  });

  if (followers.length === 0) return;

  await prisma.notification.createMany({
    data: followers.map((f) => ({
      userId: f.followerId,
      tournamentId,
      type,
    })),
  });
}

export async function notifyByLocation(organizerId: string, tournamentId: string) {
  // Prefer tournament location; fall back to organizer's location
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { provincia: true, locality: true },
  });

  let provincia = tournament?.provincia ?? null;
  let locality = tournament?.locality ?? null;

  if (!provincia) {
    const organizer = await prisma.user.findUnique({
      where: { id: organizerId },
      select: { provincia: true, locality: true },
    });
    provincia = organizer?.provincia ?? null;
    locality = organizer?.locality ?? null;
  }

  if (!provincia) return;

  // Find existing notification recipients to avoid duplicates (e.g. followers)
  const alreadyNotified = await prisma.notification.findMany({
    where: { tournamentId },
    select: { userId: true },
  });
  const alreadyNotifiedIds = new Set(alreadyNotified.map((n) => n.userId));

  // Users who opted in by locality (exact match) or by provincia (broader)
  const byLocality = locality
    ? await prisma.user.findMany({
        where: { id: { not: organizerId }, acceptsLocalityInvites: true, provincia, locality },
        select: { id: true },
      })
    : [];

  const byProvincia = await prisma.user.findMany({
    where: { id: { not: organizerId }, acceptsProvinciaInvites: true, provincia },
    select: { id: true },
  });

  const byCountry = await prisma.user.findMany({
    where: { id: { not: organizerId }, acceptsCountryInvites: true },
    select: { id: true },
  });

  const localityIds = new Set(byLocality.map((u) => u.id));
  const provinciaDeduped = byProvincia.filter((u) => !localityIds.has(u.id));
  const seenSoFar = new Set([...localityIds, ...provinciaDeduped.map((u) => u.id)]);
  const countryDeduped = byCountry.filter((u) => !seenSoFar.has(u.id));
  const combined = [...byLocality, ...provinciaDeduped, ...countryDeduped];

  const newTargets = combined.filter((u) => !alreadyNotifiedIds.has(u.id));
  if (newTargets.length === 0) return;

  await prisma.notification.createMany({
    data: newTargets.map((u) => ({
      userId: u.id,
      tournamentId,
      type: "LOCATION_INVITE" as NotificationType,
    })),
  });
}
