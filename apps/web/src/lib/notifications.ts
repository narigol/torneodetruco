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
    select: { province: true, locality: true },
  });

  let province = tournament?.province ?? null;
  let locality = tournament?.locality ?? null;

  if (!province) {
    const organizer = await prisma.user.findUnique({
      where: { id: organizerId },
      select: { province: true, locality: true },
    });
    province = organizer?.province ?? null;
    locality = organizer?.locality ?? null;
  }

  if (!province) return;

  // Find existing notification recipients to avoid duplicates (e.g. followers)
  const alreadyNotified = await prisma.notification.findMany({
    where: { tournamentId },
    select: { userId: true },
  });
  const alreadyNotifiedIds = new Set(alreadyNotified.map((n) => n.userId));

  // Users who opted in by locality (exact match) or by province (broader)
  const byLocality = locality
    ? await prisma.user.findMany({
        where: { id: { not: organizerId }, acceptsLocalityInvites: true, province, locality },
        select: { id: true },
      })
    : [];

  const byProvince = await prisma.user.findMany({
    where: { id: { not: organizerId }, acceptsProvinceInvites: true, province },
    select: { id: true },
  });

  const byCountry = await prisma.user.findMany({
    where: { id: { not: organizerId }, acceptsCountryInvites: true },
    select: { id: true },
  });

  const localityIds = new Set(byLocality.map((u) => u.id));
  const provinceDeduped = byProvince.filter((u) => !localityIds.has(u.id));
  const seenSoFar = new Set([...localityIds, ...provinceDeduped.map((u) => u.id)]);
  const countryDeduped = byCountry.filter((u) => !seenSoFar.has(u.id));
  const combined = [...byLocality, ...provinceDeduped, ...countryDeduped];

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
