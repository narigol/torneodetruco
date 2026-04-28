import { TournamentStatus } from "@tdt/db";

const config: Record<TournamentStatus, { label: string; className: string }> = {
  DRAFT: { label: "Borrador", className: "bg-gray-100 text-gray-600" },
  REGISTRATION: { label: "Inscripción", className: "bg-blue-100 text-blue-700" },
  IN_PROGRESS: { label: "En curso", className: "bg-green-100 text-green-700" },
  FINISHED: { label: "Finalizado", className: "bg-gray-100 text-gray-500" },
};

export function TournamentStatusBadge({ status }: { status: TournamentStatus }) {
  const { label, className } = config[status];
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${className}`}>
      {label}
    </span>
  );
}
