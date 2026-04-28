export type {
  User,
  Player,
  Tournament,
  Team,
  TeamPlayer,
  Group,
  GroupStanding,
  Match,
} from "@tdt/db";

export {
  Role,
  TournamentFormat,
  TournamentStatus,
  MatchStatus,
  Phase,
} from "@tdt/db";

// API response types
export type ApiResponse<T> = {
  data?: T;
  error?: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
};

// Tournament with relations
export type TournamentWithDetails = {
  id: string;
  name: string;
  description: string | null;
  format: import("@tdt/db").TournamentFormat;
  status: import("@tdt/db").TournamentStatus;
  startDate: Date | null;
  endDate: Date | null;
  admin: { id: string; name: string };
  _count: { teams: number; matches: number };
};

// Match with teams
export type MatchWithTeams = {
  id: string;
  phase: import("@tdt/db").Phase;
  status: import("@tdt/db").MatchStatus;
  homeScore: number | null;
  awayScore: number | null;
  round: number | null;
  homeTeam: { id: string; name: string };
  awayTeam: { id: string; name: string };
  winner: { id: string; name: string } | null;
};

// Bracket node for knockout display
export type BracketMatch = {
  id: string;
  round: number;
  phase: import("@tdt/db").Phase;
  homeTeam: { id: string; name: string } | null;
  awayTeam: { id: string; name: string } | null;
  homeScore: number | null;
  awayScore: number | null;
  winnerId: string | null;
};
