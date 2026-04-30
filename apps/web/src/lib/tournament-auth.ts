import { Session } from "next-auth";

export const isSuperAdmin = (role: string) => role === "ADMIN";
export const isOrganizer = (role: string) => role === "ORGANIZER" || role === "ADMIN";

export function canManageTournament(session: Session | null, tournamentAdminId: string): boolean {
  if (!session?.user?.id) return false;
  if (isSuperAdmin(session.user.role)) return true;
  if (session.user.role === "ORGANIZER") return session.user.id === tournamentAdminId;
  return false;
}

export const FREE_TOURNAMENT_LIMIT = 5;
export const FREE_PEOPLE_LIMIT = 10;
