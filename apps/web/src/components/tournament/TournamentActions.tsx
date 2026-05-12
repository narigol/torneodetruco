"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TournamentStatus, TournamentFormat } from "@tdt/db";
import { Sheet } from "@/components/ui/Sheet";

type TeamItem = { id: string; name: string };

// Each group's standings already sorted by wins desc (as returned from DB)
type GroupStanding = { teams: TeamItem[] };

type Props = {
  tournamentId: string;
  status: TournamentStatus;
  format: TournamentFormat;
  teamCount: number;
  hasGroups: boolean;
  hasBracket: boolean;
  hasPlayedGroupMatches: boolean;
  hasWinner?: boolean;
  canGenerateGroups?: boolean;
  bracketTeams?: TeamItem[];
  groupsSorted?: GroupStanding[];
  initialQualifyPerGroup?: number;
};

const NEXT_STATUS: Partial<Record<TournamentStatus, TournamentStatus>> = {
  DRAFT: "REGISTRATION",
  ANNOUNCED: "REGISTRATION",
  REGISTRATION: "IN_PROGRESS",
  IN_PROGRESS: "FINISHED",
};

const NEXT_STATUS_LABEL: Partial<Record<TournamentStatus, string>> = {
  DRAFT: "Abrir inscripción",
  ANNOUNCED: "Abrir inscripción",
  REGISTRATION: "Iniciar torneo",
  IN_PROGRESS: "Finalizar torneo",
};

function clientShuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function TournamentActions({
  tournamentId,
  status,
  format,
  teamCount,
  hasGroups,
  hasBracket,
  hasPlayedGroupMatches,
  hasWinner = false,
  canGenerateGroups = true,
  bracketTeams = [],
  groupsSorted = [],
  initialQualifyPerGroup = 1,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showBracketModal, setShowBracketModal] = useState(false);
  const [numGroupsStr, setNumGroupsStr] = useState("2");
  const [qualifyPerGroupStr, setQualifyPerGroupStr] = useState("1");
  const [teamOrder, setTeamOrder] = useState<TeamItem[]>([]);
  const [localQualifyStr, setLocalQualifyStr] = useState(String(initialQualifyPerGroup));

  const localQualify = parseInt(localQualifyStr, 10) || 0;

  function computeTeamsForQualify(n: number): TeamItem[] {
    if (groupsSorted.length > 0) {
      return groupsSorted.flatMap((g) => g.teams.slice(0, n));
    }
    return bracketTeams;
  }

  function handleLocalQualifyChange(val: string) {
    setLocalQualifyStr(val);
    const n = parseInt(val, 10);
    if (n >= 1) {
      setTeamOrder(computeTeamsForQualify(n));
    }
  }

  const numGroups = parseInt(numGroupsStr, 10) || 0;
  const qualifyPerGroup = parseInt(qualifyPerGroupStr, 10) || 0;
  const teamsPerGroup = numGroups > 0 ? Math.ceil(teamCount / numGroups) : 0;
  const maxQualify = teamsPerGroup;
  const groupConfigValid = numGroups >= 2 && qualifyPerGroup >= 1 && teamsPerGroup >= 1 && qualifyPerGroup <= teamsPerGroup;

  // For the bracket modal: max qualify = smallest group size
  const minGroupSize = groupsSorted.length > 0
    ? Math.min(...groupsSorted.map((g) => g.teams.length))
    : Infinity;
  const localQualifyValid = localQualify >= 1 && localQualify <= minGroupSize;

  function handleNumGroupsChange(val: string) {
    setNumGroupsStr(val);
    const n = parseInt(val, 10);
    if (!n || n < 2) return;
    const newTeamsPerGroup = Math.ceil(teamCount / n);
    if (qualifyPerGroup >= newTeamsPerGroup) {
      setQualifyPerGroupStr(String(newTeamsPerGroup - 1));
    }
  }

  function moveTeam(idx: number, dir: -1 | 1) {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= teamOrder.length) return;
    const next = [...teamOrder];
    [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
    setTeamOrder(next);
  }

  const nextStatus = NEXT_STATUS[status];
  const nextLabel = NEXT_STATUS_LABEL[status];
  const isInProgress = status === "IN_PROGRESS";
  const needsGroups =
    isInProgress &&
    format === TournamentFormat.GROUPS_AND_KNOCKOUT &&
    !hasGroups;
  const showGenerateBracket =
    isInProgress &&
    !hasBracket &&
    (format === TournamentFormat.SINGLE_ELIMINATION ||
      (format === TournamentFormat.GROUPS_AND_KNOCKOUT && hasGroups));

  const bracketPendingResults =
    format === TournamentFormat.GROUPS_AND_KNOCKOUT && hasGroups && !hasPlayedGroupMatches;

  async function advanceStatus() {
    if (!nextStatus) return;
    setLoading(true);
    await fetch(`/api/torneos/${tournamentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    setLoading(false);
    router.refresh();
  }

  async function generateGroups() {
    setLoading(true);
    setShowGroupModal(false);
    await fetch(`/api/torneos/${tournamentId}/generar-grupos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ numGroups, qualifyPerGroup }),
    });
    setLoading(false);
    router.push(`/torneos/${tournamentId}?tab=grupos`);
  }

  async function deleteTournament() {
    setDeleteLoading(true);
    await fetch(`/api/torneos/${tournamentId}`, { method: "DELETE" });
    setDeleteLoading(false);
    router.push("/torneos");
    router.refresh();
  }

  async function generateBracket() {
    setLoading(true);
    setShowBracketModal(false);
    await fetch(`/api/torneos/${tournamentId}/generar-bracket`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teamOrder: teamOrder.map((t) => t.id),
        ...(format === TournamentFormat.GROUPS_AND_KNOCKOUT && localQualify !== initialQualifyPerGroup
          ? { qualifyPerGroup: localQualify }
          : {}),
      }),
    });
    setLoading(false);
    router.push(`/torneos/${tournamentId}?tab=llave`);
  }

  // Matchup preview: pairs from teamOrder
  const matchupPairs: [TeamItem, TeamItem | null][] = [];
  for (let i = 0; i < teamOrder.length; i += 2) {
    matchupPairs.push([teamOrder[i], teamOrder[i + 1] ?? null]);
  }

  return (
    <>
      <div className="flex gap-2 flex-wrap">
        {needsGroups && canGenerateGroups && (
          <button
            onClick={() => setShowGroupModal(true)}
            disabled={loading || teamCount < 4}
            className="px-4 py-2 text-sm font-medium bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Generar grupos
          </button>
        )}

        {showGenerateBracket && (
          <div className="flex flex-col items-start gap-0.5">
            <button
              onClick={() => {
                if (bracketPendingResults) return;
                setLocalQualifyStr(String(initialQualifyPerGroup));
                setTeamOrder(computeTeamsForQualify(initialQualifyPerGroup));
                setShowBracketModal(true);
              }}
              disabled={loading || teamCount < 2 || bracketPendingResults}
              className="px-4 py-2 text-sm font-medium bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Generar eliminatoria
            </button>
            {bracketPendingResults && (
              <p className="text-xs text-amber-600 pl-1">Debe cargarse al menos un resultado</p>
            )}
          </div>
        )}

        {status === "DRAFT" && !showFinishConfirm && (
          <button
            onClick={async () => {
              setLoading(true);
              await fetch(`/api/torneos/${tournamentId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "ANNOUNCED" }),
              });
              setLoading(false);
              router.refresh();
            }}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "..." : "Anunciar torneo"}
          </button>
        )}

        {nextStatus && !showFinishConfirm && (
          <button
            onClick={() => {
              if (nextStatus === "FINISHED" && !hasWinner) {
                setShowFinishConfirm(true);
              } else {
                advanceStatus();
              }
            }}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "..." : nextLabel}
          </button>
        )}

        {showFinishConfirm && (
          <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl max-w-sm">
            <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-amber-800">No hay ganador registrado</p>
              <p className="text-xs text-amber-700 mt-0.5">
                La final no tiene resultado cargado. ¿Querés finalizar el torneo igual?
              </p>
              <div className="flex gap-2 mt-2.5">
                <button
                  onClick={() => setShowFinishConfirm(false)}
                  className="text-xs px-3 py-1.5 border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => { setShowFinishConfirm(false); advanceStatus(); }}
                  disabled={loading}
                  className="text-xs px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors font-medium"
                >
                  Finalizar igual
                </button>
              </div>
            </div>
          </div>
        )}

        {status === "DRAFT" && !showDeleteConfirm && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleteLoading}
            className="px-4 py-2 text-sm font-medium bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            Eliminar torneo
          </button>
        )}
        {showDeleteConfirm && (
          <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
            <span className="text-xs text-red-700 font-medium">¿Eliminar torneo?</span>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-white transition-colors"
            >
              No
            </button>
            <button
              onClick={deleteTournament}
              disabled={deleteLoading}
              className="text-xs text-white bg-red-600 hover:bg-red-700 px-2 py-1 rounded disabled:opacity-50 transition-colors font-medium"
            >
              {deleteLoading ? "..." : "Sí, eliminar"}
            </button>
          </div>
        )}
      </div>

      {/* Sheet: generar grupos */}
      <Sheet
        open={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        title="Generar grupos"
        description="Los grupos se fijarán con los equipos actuales."
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-2">Cantidad de grupos</label>
            <input
              type="text"
              inputMode="numeric"
              value={numGroupsStr}
              onChange={(e) => handleNumGroupsChange(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">
              {teamCount} equipos → {teamsPerGroup > 0 ? `~${teamsPerGroup}` : "—"} por grupo
            </p>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-2">Clasificados por grupo</label>
            <input
              type="text"
              inputMode="numeric"
              value={qualifyPerGroupStr}
              onChange={(e) => setQualifyPerGroupStr(e.target.value)}
              className={`w-full border rounded-lg px-3 py-2 text-sm ${!groupConfigValid ? "border-red-300 bg-red-50" : "border-gray-300"}`}
            />
            {!groupConfigValid ? (
              <p className="text-xs text-red-500 mt-1">
                Con {teamsPerGroup} equipo{teamsPerGroup !== 1 ? "s" : ""} por grupo, el máximo es {maxQualify} clasificado{maxQualify !== 1 ? "s" : ""} por grupo
              </p>
            ) : (
              <p className="text-xs text-gray-400 mt-1">
                Clasifican {qualifyPerGroup * numGroups} equipos en total a la eliminatoria
              </p>
            )}
          </div>
          <p className="text-xs text-amber-600">Esta acción es irreversible.</p>
          <button
            onClick={generateGroups}
            disabled={!groupConfigValid}
            className="w-full px-3 py-2.5 text-sm bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 font-semibold transition-colors"
          >
            Generar grupos
          </button>
        </div>
      </Sheet>

      {/* Sheet: generar bracket */}
      <Sheet
        open={showBracketModal}
        onClose={() => setShowBracketModal(false)}
        title="Generar eliminatoria"
        description="Ordená los equipos para definir los cruces, o sorteá al azar."
      >
        <div className="space-y-4">
          {format === TournamentFormat.GROUPS_AND_KNOCKOUT && groupsSorted.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Clasificados por grupo
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  value={localQualifyStr}
                  onChange={(e) => handleLocalQualifyChange(e.target.value)}
                  className={`w-24 border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 ${!localQualifyValid ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                />
                {localQualifyValid && (
                  <span className="text-xs text-gray-400">
                    {localQualify * groupsSorted.length} equipos clasifican
                  </span>
                )}
              </div>
              {!localQualifyValid && localQualify > 0 && (
                <p className="text-xs text-red-500 mt-1">
                  El grupo más pequeño tiene {minGroupSize} equipo{minGroupSize !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          )}

          {teamOrder.length > 0 ? (
            <>
              <div className="space-y-1.5">
                {teamOrder.map((team, idx) => (
                  <div key={team.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                    <span className="text-xs font-bold text-gray-400 w-5 text-center">{idx + 1}</span>
                    <span className="flex-1 text-sm font-medium text-gray-800 truncate">{team.name}</span>
                    <div className="flex gap-0.5">
                      <button
                        onClick={() => moveTeam(idx, -1)}
                        disabled={idx === 0}
                        className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-700 disabled:opacity-20 rounded"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveTeam(idx, 1)}
                        disabled={idx === teamOrder.length - 1}
                        className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-700 disabled:opacity-20 rounded"
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Cruces</p>
                <div className="space-y-1">
                  {matchupPairs.map(([a, b], i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                      <span className="text-gray-400 w-4">P{i + 1}</span>
                      <span className="font-medium truncate max-w-[120px]">{a.name}</span>
                      <span className="text-gray-300">vs</span>
                      <span className={`truncate max-w-[120px] ${b ? "font-medium" : "text-gray-300 italic"}`}>
                        {b?.name ?? "Pase libre"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setTeamOrder(clientShuffle(teamOrder))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Sortear al azar
              </button>
            </>
          ) : (
            <p className="text-sm text-gray-400">
              Se sortearán los {teamCount} equipos para armar la llave.
            </p>
          )}

          <p className="text-xs text-amber-600">Esta acción es irreversible.</p>

          <button
            onClick={generateBracket}
            disabled={groupsSorted.length > 0 && !localQualifyValid}
            className="w-full px-3 py-2.5 text-sm bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 font-semibold transition-colors"
          >
            Confirmar
          </button>
        </div>
      </Sheet>
    </>
  );
}
