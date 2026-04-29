import { Session } from "next-auth";

export function canManageTournament(session: Session | null, tournamentAdminId: string): boolean {
  if (!session?.user?.id) return false;
  if (session.user.role === "ADMIN") return true;
  return session.user.id === tournamentAdminId;
}

export const FREE_TOURNAMENT_LIMIT = 5;
export const FREE_PEOPLE_LIMIT = 10;
