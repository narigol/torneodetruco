import { Session } from "next-auth";

export const isSuperAdmin = (role: string) => role === "ADMIN";
export const isOrganizer = (role: string) => role === "ORGANIZER" || role === "ADMIN";

export function canCreateTournament(session: Session | null): boolean {
  if (!session?.user?.id) return false;
  return isSuperAdmin(session.user.role) || session.user.role === "ORGANIZER" || session.user.role === "PLAYER";
}

export function canManageTournament(session: Session | null, tournamentAdminId: string): boolean {
  if (!session?.user?.id) return false;
  if (isSuperAdmin(session.user.role)) return true;
  return session.user.id === tournamentAdminId;
}

export function canPublishTournament(session: Session | null): boolean {
  return isOrganizer(session?.user?.role ?? "");
}

export function canInviteTournament(session: Session | null): boolean {
  return isOrganizer(session?.user?.role ?? "");
}

export function canGenerateGroups(session: Session | null): boolean {
  return isOrganizer(session?.user?.role ?? "");
}

export const FREE_TOURNAMENT_LIMIT = 5;
export const FREE_PEOPLE_LIMIT = 10;
