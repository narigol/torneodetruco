"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TournamentStatus, TournamentFormat } from "@tdt/db";

type Props = {
  tournamentId: string;
  status: TournamentStatus;
  format: TournamentFormat;
  teamCount: number;
  hasGroups: boolean;
  hasBracket: boolean;
  hasPlayedGroupMatches: boolean;
  canGenerateGroups?: boolean;
};

const NEXT_STATUS: Partial<Record<TournamentStatus, TournamentStatus>> = {
  DRAFT: "REGISTRATION",
  REGISTRATION: "IN_PROGRESS",
  IN_PROGRESS: "FINISHED",
};

const NEXT_STATUS_LABEL: Partial<Record<TournamentStatus, string>> = {
  DRAFT: "Abrir inscripción",
  REGISTRATION: "Iniciar torneo",
  IN_PROGRESS: "Finalizar torneo",
};

export function TournamentActions({
  tournamentId,
  status,
  format,
  teamCount,
  hasGroups,
  hasBracket,
  hasPlayedGroupMatches,
  canGenerateGroups = true,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showBracketModal, setShowBracketModal] = useState(false);
  const [numGroups, setNumGroups] = useState(2);
  const [qualifyPerGroup, setQualifyPerGroup] = useState(1);

  const teamsPerGroup = Math.ceil(teamCount / numGroups);
  const maxQualify = teamsPerGroup - 1;
  const groupConfigValid = qualifyPerGroup >= 1 && qualifyPerGroup < teamsPerGroup;

  function handleNumGroupsChange(val: number) {
    setNumGroups(val);
    const newTeamsPerGroup = Math.ceil(teamCount / val);
    if (qualifyPerGroup >= newTeamsPerGroup) {
      setQualifyPerGroup(newTeamsPerGroup - 1);
    }
  }

  const nextStatus = NEXT_STATUS[status];
  const nextLabel = NEXT_STATUS_LABEL[status];
  const isInProgress = status === "IN_PROGRESS";
  const needsGroups =
    isInProgress &&
    format === TournamentFormat.GROUPS_AND_KNOCKOUT &&
    !hasGroups;
  const canGenerateBracket =
    isInProgress &&
    (format === TournamentFormat.SINGLE_ELIMINATION ||
      (format === TournamentFormat.GROUPS_AND_KNOCKOUT && hasGroups && hasPlayedGroupMatches)) &&
    !hasBracket;

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
    router.refresh();
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
    });
    setLoading(false);
    router.refresh();
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

        {canGenerateBracket && (
          <button
            onClick={() => setShowBracketModal(true)}
            disabled={loading || teamCount < 2}
            className="px-4 py-2 text-sm font-medium bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Generar eliminatoria
          </button>
        )}

        {nextStatus && (
          <button
            onClick={advanceStatus}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "..." : nextLabel}
          </button>
        )}

        {status === "DRAFT" && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleteLoading}
            className="px-4 py-2 text-sm font-medium bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            Eliminar torneo
          </button>
        )}
      </div>

      {/* Modal: confirmar eliminar */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-80 shadow-xl">
            <h3 className="font-semibold text-gray-900 mb-1">Eliminar torneo</h3>
            <p className="text-sm text-gray-500 mb-5">
              Esta acción es irreversible. Se eliminarán el torneo y todos sus datos.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={deleteTournament}
                disabled={deleteLoading}
                className="flex-1 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleteLoading ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: generar grupos */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-80 shadow-xl">
            <h3 className="font-semibold text-gray-900 mb-1">Generar grupos</h3>
            <p className="text-xs text-gray-400 mb-4">
              Esta acción es irreversible. Los grupos se fijarán con los equipos actuales.
            </p>
            <label className="block text-sm text-gray-600 mb-2">
              Cantidad de grupos
            </label>
            <input
              type="number"
              min={2}
              max={Math.floor(teamCount / 2)}
              value={numGroups}
              onChange={(e) => handleNumGroupsChange(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-2"
            />
            <p className="text-xs text-gray-400 mb-4">
              {teamCount} equipos → ~{teamsPerGroup} por grupo
            </p>
            <label className="block text-sm text-gray-600 mb-2">
              Clasificados por grupo
            </label>
            <input
              type="number"
              min={1}
              max={maxQualify}
              value={qualifyPerGroup}
              onChange={(e) => setQualifyPerGroup(Number(e.target.value))}
              className={`w-full border rounded-lg px-3 py-2 text-sm mb-1 ${!groupConfigValid ? "border-red-300 bg-red-50" : "border-gray-300"}`}
            />
            {!groupConfigValid ? (
              <p className="text-xs text-red-500 mb-4">
                Con {teamsPerGroup} equipo{teamsPerGroup !== 1 ? "s" : ""} por grupo, el máximo es {maxQualify} clasificado{maxQualify !== 1 ? "s" : ""}
              </p>
            ) : (
              <p className="text-xs text-gray-400 mb-4">
                Clasifican {qualifyPerGroup * numGroups} equipos en total a la eliminatoria
              </p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => setShowGroupModal(false)}
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={generateGroups}
                disabled={!groupConfigValid}
                className="flex-1 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Generar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: generar bracket */}
      {showBracketModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-80 shadow-xl">
            <h3 className="font-semibold text-gray-900 mb-1">Generar eliminatoria</h3>
            <p className="text-sm text-gray-500 mb-1">
              Se sortearán los{" "}
              {format === TournamentFormat.GROUPS_AND_KNOCKOUT
                ? "clasificados de cada grupo"
                : `${teamCount} equipos`}{" "}
              para armar la llave eliminatoria.
            </p>
            <p className="text-xs text-gray-400 mb-5">
              Esta acción es irreversible.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowBracketModal(false)}
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={generateBracket}
                className="flex-1 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Sortear y generar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
