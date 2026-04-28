import { TournamentStatus } from "@tdt/db";

const config: Record<TournamentStatus, { label: string; dot: string; text: string; bg: string }> = {
  DRAFT:        { label: "Borrador",    dot: "bg-gray-400",  text: "text-gray-600",  bg: "bg-gray-100" },
  REGISTRATION: { label: "Inscripción", dot: "bg-blue-400",  text: "text-blue-700",  bg: "bg-blue-50" },
  IN_PROGRESS:  { label: "En curso",    dot: "bg-green-400", text: "text-green-700", bg: "bg-green-50" },
  FINISHED:     { label: "Finalizado",  dot: "bg-gray-300",  text: "text-gray-500",  bg: "bg-gray-100" },
};

export function TournamentStatusBadge({ status }: { status: TournamentStatus }) {
  const { label, dot, text, bg } = config[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${bg} ${text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
