import Link from "next/link";
import { Phase, TournamentFormat, TournamentStatus } from "@tdt/db";
import { ResultadoModal } from "@/components/ui/ResultadoModal";

type TeamSummary = {
  id: string;
  name: string;
};

type MatchSummary = {
  id: string;
  phase: Phase;
  round: number | null;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  homeTeam: TeamSummary;
  awayTeam: TeamSummary | null;
  winner: TeamSummary | null;
};

type GroupSummary = {
  id: string;
  name: string;
  matches: MatchSummary[];
};

type Props = {
  tournament: {
    id: string;
    format: TournamentFormat;
    status: TournamentStatus;
    qualifyPerGroup: number;
    teams: TeamSummary[];
    groups: GroupSummary[];
    matches: MatchSummary[];
  };
};

const PHASE_ORDER: Phase[] = ["GROUP", "ROUND_OF_16", "QUARTERFINAL", "SEMIFINAL", "FINAL"];

const PHASE_LABEL: Record<Phase, string> = {
  GROUP: "Fase de grupos",
  ROUND_OF_16: "Octavos",
  QUARTERFINAL: "Cuartos",
  SEMIFINAL: "Semifinal",
  FINAL: "Final",
};

export function TournamentOverview({ tournament }: Props) {
  const allMatches = [...tournament.groups.flatMap((group) => group.matches), ...tournament.matches];
  const playedMatches = allMatches.filter((match) => match.status === "FINISHED");
  const pendingMatches = allMatches
    .filter((match) => match.status !== "FINISHED")
    .sort(compareMatches);

  const currentPhase = getCurrentPhase(tournament, allMatches);
  const completion = allMatches.length > 0
    ? Math.round((playedMatches.length / allMatches.length) * 100)
    : 0;

  const readyState = getReadyState(tournament, allMatches);

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <OverviewCard
          title="Equipos inscriptos"
          value={String(tournament.teams.length)}
          detail={tournament.teams.length === 1 ? "1 equipo cargado" : `${tournament.teams.length} equipos cargados`}
        />
        <OverviewCard
          title="Partidos jugados"
          value={`${playedMatches.length}/${allMatches.length}`}
          detail={allMatches.length > 0 ? `${completion}% completado` : "Todavia no hay partidos generados"}
        />
        <OverviewCard
          title="Fase actual"
          value={currentPhase}
          detail={statusDetail(tournament.status)}
        />
        <OverviewCard
          title="Resultados pendientes"
          value={String(pendingMatches.length)}
          detail={pendingMatches.length === 0 ? "No hay carga pendiente" : "Partidos esperando resultado"}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Partidos pendientes</h2>
              <p className="text-sm text-gray-500 mt-1">
                {pendingMatches.length === 0
                  ? "Todo al dia."
                  : `${pendingMatches.length} partido${pendingMatches.length !== 1 ? "s" : ""} sin resultado.`}
              </p>
            </div>
            <Link
              href={`/torneos/${tournament.id}?tab=${tournament.format === "GROUPS_AND_KNOCKOUT" ? "grupos" : "llave"}`}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Ver estructura
            </Link>
          </div>

          {pendingMatches.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-gray-400">
              No hay partidos pendientes por cargar.
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {pendingMatches.slice(0, 8).map((match) => (
                <PendingMatchRow key={match.id} match={match} />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <h2 className="text-lg font-semibold text-gray-900">Estado del torneo</h2>
            <p className="text-sm text-gray-500 mt-1">{readyState.title}</p>
            <p className="text-sm text-gray-700 mt-4 leading-relaxed">{readyState.description}</p>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <h2 className="text-lg font-semibold text-gray-900">Atajos</h2>
            <div className="mt-4 space-y-3 text-sm">
              <ShortcutLink href={`/torneos/${tournament.id}?tab=equipos`} label="Ver equipos" />
              {tournament.format === "GROUPS_AND_KNOCKOUT" && (
                <ShortcutLink href={`/torneos/${tournament.id}?tab=grupos`} label="Ir a grupos" />
              )}
              <ShortcutLink href={`/torneos/${tournament.id}?tab=llave`} label="Ir a llave" />
              <ShortcutLink href={`/torneos/${tournament.id}/editar`} label="Editar torneo" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function OverviewCard({
  title,
  value,
  detail,
}: {
  title: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{title}</p>
      <p className="text-3xl font-bold text-gray-900 mt-3">{value}</p>
      <p className="text-sm text-gray-500 mt-2">{detail}</p>
    </div>
  );
}

function PendingMatchRow({ match }: { match: MatchSummary }) {
  return (
    <div className="px-5 py-4 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">
            {PHASE_LABEL[match.phase]}
          </span>
          {typeof match.round === "number" && (
            <span className="text-xs text-gray-400">Ronda {match.round + 1}</span>
          )}
        </div>
        <p className="text-sm font-medium text-gray-900 mt-2">
          {match.homeTeam.name} vs {match.awayTeam?.name ?? "Equipo libre"}
        </p>
      </div>
      {match.awayTeam && (
        <ResultadoModal
          matchId={match.id}
          homeTeam={match.homeTeam.name}
          awayTeam={match.awayTeam.name}
        />
      )}
    </div>
  );
}

function ShortcutLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-3 text-gray-700 hover:border-gray-200 hover:bg-gray-50 transition-colors"
    >
      <span>{label}</span>
      <span className="text-gray-300">+</span>
    </Link>
  );
}

function getCurrentPhase(tournament: Props["tournament"], matches: MatchSummary[]) {
  if (tournament.status === "DRAFT") return "Borrador";
  if (tournament.status === "REGISTRATION") return "Inscripcion";

  const pendingGroup = tournament.groups.some((group) => group.matches.some((match) => match.status !== "FINISHED"));
  if (pendingGroup) return "Fase de grupos";

  const nextKnockout = matches
    .filter((match) => match.phase !== "GROUP" && match.status !== "FINISHED")
    .sort(compareMatches)[0];

  if (nextKnockout) return PHASE_LABEL[nextKnockout.phase];
  if (tournament.status === "FINISHED") return "Finalizado";
  return tournament.matches.length > 0 ? "Eliminatoria" : "Esperando estructura";
}

function getReadyState(tournament: Props["tournament"], matches: MatchSummary[]) {
  if (tournament.status === "DRAFT") {
    return {
      title: "Preparando apertura",
      description: "El torneo todavia esta en borrador. Cuando tengas definidos los equipos base y la configuracion, podes abrir la inscripcion.",
    };
  }

  if (tournament.status === "REGISTRATION") {
    return {
      title: "Inscripcion abierta",
      description: `Hay ${tournament.teams.length} equipo${tournament.teams.length !== 1 ? "s" : ""} cargado${tournament.teams.length !== 1 ? "s" : ""}. Cuando cierres inscripcion, vas a poder avanzar y generar la estructura deportiva.`,
    };
  }

  if (tournament.status === "IN_PROGRESS" && matches.length === 0) {
    return {
      title: "Falta generar partidos",
      description: "El torneo ya esta en curso, pero todavia no hay partidos creados. Usa las acciones del encabezado para generar grupos o llave segun el formato.",
    };
  }

  if (tournament.status === "IN_PROGRESS" && matches.some((match) => match.status !== "FINISHED")) {
    return {
      title: "Esperando resultados",
      description: "Todavia hay partidos en juego o pendientes. Cuando se completen, el torneo podra seguir avanzando de fase automaticamente donde corresponda.",
    };
  }

  if (tournament.status === "FINISHED") {
    return {
      title: "Torneo cerrado",
      description: "La competencia ya termino. Desde aca podes revisar la llave, los grupos y el historial de resultados.",
    };
  }

  return {
    title: "Listo para avanzar",
    description: "No quedan resultados pendientes. Revisa la estructura actual y usa las acciones del encabezado para seguir con la siguiente etapa.",
  };
}

function statusDetail(status: TournamentStatus) {
  switch (status) {
    case "DRAFT":
      return "Configuracion inicial";
    case "REGISTRATION":
      return "Aceptando inscripciones";
    case "IN_PROGRESS":
      return "Competencia en curso";
    case "FINISHED":
      return "Competencia cerrada";
  }
}

function compareMatches(a: MatchSummary, b: MatchSummary) {
  const phaseDiff = PHASE_ORDER.indexOf(a.phase) - PHASE_ORDER.indexOf(b.phase);
  if (phaseDiff !== 0) return phaseDiff;
  return (a.round ?? 0) - (b.round ?? 0);
}
