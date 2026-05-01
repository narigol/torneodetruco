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
  const organizer = await prisma.user.findUnique({
    where: { id: organizerId },
    select: { province: true, locality: true },
  });

  const province = organizer?.province;
  if (!province) return;

  const locality = organizer?.locality;

  // Find existing notification recipients to avoid duplicates (e.g. followers)
  const alreadyNotified = await prisma.notification.findMany({
    where: { tournamentId },
    select: { userId: true },
  });
  const alreadyNotifiedIds = new Set(alreadyNotified.map((n) => n.userId));

  // Find users who opted in and are in the same province (and locality if set)
  const targets = await prisma.user.findMany({
    where: {
      id: { not: organizerId },
      acceptsLocationInvites: true,
      province,
      ...(locality ? { locality } : {}),
    },
    select: { id: true },
  });

  const newTargets = targets.filter((u) => !alreadyNotifiedIds.has(u.id));
  if (newTargets.length === 0) return;

  await prisma.notification.createMany({
    data: newTargets.map((u) => ({
      userId: u.id,
      tournamentId,
      type: "LOCATION_INVITE" as NotificationType,
    })),
  });
}
