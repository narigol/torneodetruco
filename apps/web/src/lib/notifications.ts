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
