import { prisma } from "@tdt/db";

type UserWithPlayer = { id: string; player: { id: string } | null } | null;

/** Finds an existing user by email OR dni to link to a player. */
export async function findUserToLink(
  email: string | null | undefined,
  dni: string | null | undefined
): Promise<UserWithPlayer> {
  if (email) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, player: { select: { id: true } } },
    });
    if (user) return user;
  }
  if (dni) {
    const user = await prisma.user.findFirst({
      where: { dni },
      select: { id: true, player: { select: { id: true } } },
    });
    if (user) return user;
  }
  return null;
}
