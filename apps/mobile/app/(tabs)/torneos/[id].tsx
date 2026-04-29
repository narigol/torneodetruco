import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
} from "react-native";
import { useLocalSearchParams, useNavigation } from "expo-router";
import * as SecureStore from "expo-secure-store";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

type TeamSmall = { id: string; name: string };

type MatchDetail = {
  id: string;
  phase: string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  round: number | null;
  homeTeam: TeamSmall;
  awayTeam: TeamSmall | null;
  winner: TeamSmall | null;
};

type GroupStanding = {
  id: string;
  wins: number;
  losses: number;
  scored: number;
  against: number;
  team: TeamSmall;
};

type GroupDetail = {
  id: string;
  name: string;
  standings: GroupStanding[];
  matches: MatchDetail[];
};

type TournamentDetail = {
  id: string;
  name: string;
  description: string | null;
  format: string;
  status: string;
  seriesFormat: string;
  matchPoints: number;
  regularGamePoints: number;
  tiebreakerPoints: number;
  qualifyPerGroup: number;
  startDate: string | null;
  admin: { id: string; name: string };
  teams: {
    id: string;
    name: string;
    teamPlayers: { player: { id: string; name: string } }[];
  }[];
  groups: GroupDetail[];
  matches: MatchDetail[];
  _count: { teams: number; matches: number };
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Borrador",
  REGISTRATION: "Inscripción",
  IN_PROGRESS: "En curso",
  FINISHED: "Finalizado",
};

const PHASE_LABEL: Record<string, string> = {
  GROUP: "Fase de grupos",
  ROUND_OF_16: "Octavos",
  QUARTERFINAL: "Cuartos",
  SEMIFINAL: "Semifinal",
  FINAL: "Final",
};

const STATUS_NEXT: Record<string, string> = {
  DRAFT: "REGISTRATION",
  REGISTRATION: "IN_PROGRESS",
  IN_PROGRESS: "FINISHED",
};

const STATUS_NEXT_LABEL: Record<string, string> = {
  DRAFT: "Abrir inscripción",
  REGISTRATION: "Iniciar torneo",
  IN_PROGRESS: "Finalizar torneo",
};

type Tab = "equipos" | "grupos" | "llave";

export default function TorneoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();

  const [torneo, setTorneo] = useState<TournamentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("equipos");
  const [isAdmin, setIsAdmin] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const storedToken = await SecureStore.getItemAsync("token");
      const storedRole = await SecureStore.getItemAsync("role");
      setToken(storedToken);
      setIsAdmin(storedRole === "ADMIN");

      const res = await fetch(`${API_URL}/api/torneos/${id}`, {
        headers: storedToken ? { Authorization: `Bearer ${storedToken}` } : {},
      });
      if (!res.ok) {
        setError("No se pudo cargar el torneo");
        return;
      }
      const data: TournamentDetail = await res.json();
      setTorneo(data);
      navigation.setOptions({ title: data.name });
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAdvanceStatus() {
    if (!torneo || !token) return;
    const next = STATUS_NEXT[torneo.status];
    if (!next) return;

    Alert.alert(
      STATUS_NEXT_LABEL[torneo.status],
      `¿Cambiar el estado a "${STATUS_LABEL[next]}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: async () => {
            setAdminLoading(true);
            try {
              await fetch(`${API_URL}/api/torneos/${torneo.id}`, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status: next }),
              });
              await load();
            } catch {
              Alert.alert("Error", "No se pudo actualizar el estado");
            } finally {
              setAdminLoading(false);
            }
          },
        },
      ]
    );
  }

  async function handleGenerarGrupos() {
    if (!torneo || !token) return;
    const numGroups = Math.ceil(torneo.teams.length / 3);
    Alert.alert(
      "Generar grupos",
      `¿Generar ${numGroups} grupos con ${torneo.teams.length} equipos?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Generar",
          onPress: async () => {
            setAdminLoading(true);
            try {
              const res = await fetch(
                `${API_URL}/api/torneos/${torneo.id}/generar-grupos`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({ numGroups }),
                }
              );
              if (!res.ok) {
                const d = await res.json();
                Alert.alert("Error", d.error ?? "No se pudieron generar los grupos");
              } else {
                await load();
                setActiveTab("grupos");
              }
            } catch {
              Alert.alert("Error", "Error de conexión");
            } finally {
              setAdminLoading(false);
            }
          },
        },
      ]
    );
  }

  async function handleGenerarBracket() {
    if (!torneo || !token) return;
    Alert.alert("Generar bracket", "¿Generar la llave eliminatoria?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Generar",
        onPress: async () => {
          setAdminLoading(true);
          try {
            const res = await fetch(
              `${API_URL}/api/torneos/${torneo.id}/generar-bracket`,
              {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            if (!res.ok) {
              const d = await res.json();
              Alert.alert("Error", d.error ?? "No se pudo generar el bracket");
            } else {
              await load();
              setActiveTab("llave");
            }
          } catch {
            Alert.alert("Error", "Error de conexión");
          } finally {
            setAdminLoading(false);
          }
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#dc2626" />
      </View>
    );
  }

  if (error || !torneo) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error || "Torneo no encontrado"}</Text>
      </View>
    );
  }

  const hasGroupFormat = torneo.format === "GROUPS_AND_KNOCKOUT";
  const tabs: Tab[] = ["equipos", ...(hasGroupFormat ? ["grupos" as Tab] : []), "llave"];
  const canAdvance = isAdmin && torneo.status !== "FINISHED";
  const canGenerarGrupos =
    isAdmin &&
    torneo.status === "IN_PROGRESS" &&
    hasGroupFormat &&
    torneo.groups.length === 0;
  const canGenerarBracket =
    isAdmin &&
    torneo.status === "IN_PROGRESS" &&
    torneo.matches.length === 0 &&
    (!hasGroupFormat || torneo.groups.length > 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.status}>{STATUS_LABEL[torneo.status]}</Text>
          <Text style={styles.meta}>{torneo._count.teams} equipos</Text>
        </View>
        {torneo.description ? (
          <Text style={styles.description}>{torneo.description}</Text>
        ) : null}
        <Text style={styles.organizer}>Organizado por {torneo.admin.name}</Text>

        {/* Acciones admin */}
        {isAdmin && (
          <View style={styles.adminActions}>
            {canGenerarGrupos && (
              <AdminBtn
                label="Generar grupos"
                onPress={handleGenerarGrupos}
                loading={adminLoading}
              />
            )}
            {canGenerarBracket && (
              <AdminBtn
                label="Generar bracket"
                onPress={handleGenerarBracket}
                loading={adminLoading}
              />
            )}
            {canAdvance && (
              <AdminBtn
                label={STATUS_NEXT_LABEL[torneo.status]}
                onPress={handleAdvanceStatus}
                loading={adminLoading}
                secondary
              />
            )}
          </View>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const labels: Record<Tab, string> = {
            equipos: `Equipos (${torneo.teams.length})`,
            grupos: "Grupos",
            llave: "Llave",
          };
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {labels[tab]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {activeTab === "equipos" && <EquiposTab teams={torneo.teams} />}
        {activeTab === "grupos" && (
          <GruposTab
            groups={torneo.groups}
            qualifyPerGroup={torneo.qualifyPerGroup}
            isAdmin={isAdmin}
            token={token}
            seriesFormat={torneo.seriesFormat}
            matchPoints={torneo.matchPoints}
            regularGamePoints={torneo.regularGamePoints}
            tiebreakerPoints={torneo.tiebreakerPoints}
            onResultLoaded={load}
          />
        )}
        {activeTab === "llave" && (
          <LlaveTab
            matches={torneo.matches}
            isAdmin={isAdmin}
            token={token}
            seriesFormat={torneo.seriesFormat}
            matchPoints={torneo.matchPoints}
            regularGamePoints={torneo.regularGamePoints}
            tiebreakerPoints={torneo.tiebreakerPoints}
            onResultLoaded={load}
          />
        )}
      </ScrollView>
    </View>
  );
}

function AdminBtn({
  label,
  onPress,
  loading,
  secondary,
}: {
  label: string;
  onPress: () => void;
  loading: boolean;
  secondary?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.adminBtn, secondary && styles.adminBtnSecondary]}
      onPress={onPress}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color={secondary ? "#6b7280" : "#fff"} />
      ) : (
        <Text style={[styles.adminBtnText, secondary && styles.adminBtnTextSecondary]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

function EquiposTab({ teams }: { teams: TournamentDetail["teams"] }) {
  if (teams.length === 0) {
    return <Text style={styles.empty}>No hay equipos inscriptos</Text>;
  }
  return (
    <View style={styles.teamGrid}>
      {teams.map((team) => (
        <View key={team.id} style={styles.teamCard}>
          <Text style={styles.teamName}>{team.name}</Text>
          <Text style={styles.teamPlayers}>
            {team.teamPlayers.map((tp) => tp.player.name).join(", ")}
          </Text>
        </View>
      ))}
    </View>
  );
}

function GruposTab({
  groups,
  qualifyPerGroup,
  isAdmin,
  token,
  seriesFormat,
  matchPoints,
  regularGamePoints,
  tiebreakerPoints,
  onResultLoaded,
}: {
  groups: GroupDetail[];
  qualifyPerGroup: number;
  isAdmin: boolean;
  token: string | null;
  seriesFormat: string;
  matchPoints: number;
  regularGamePoints: number;
  tiebreakerPoints: number;
  onResultLoaded: () => void;
}) {
  if (groups.length === 0) {
    return <Text style={styles.empty}>Los grupos aún no fueron generados</Text>;
  }
  return (
    <View style={{ gap: 20 }}>
      {groups.map((group) => {
        const sorted = [...group.standings].sort((a, b) => {
          if (b.wins !== a.wins) return b.wins - a.wins;
          return (b.scored - b.against) - (a.scored - a.against);
        });
        return (
          <View key={group.id}>
            <Text style={styles.groupTitle}>{group.name}</Text>

            <View style={styles.standingsTable}>
              <View style={[styles.standingsRow, styles.standingsHeader]}>
                <Text style={[styles.standingsCell, styles.standingsTeamCell, styles.standingsHeaderText]}>Equipo</Text>
                <Text style={[styles.standingsCell, styles.standingsHeaderText]}>PJ</Text>
                <Text style={[styles.standingsCell, styles.standingsHeaderText]}>G</Text>
                <Text style={[styles.standingsCell, styles.standingsHeaderText]}>P</Text>
                <Text style={[styles.standingsCell, styles.standingsHeaderText]}>DF</Text>
              </View>
              {sorted.map((s, idx) => {
                const pj = s.wins + s.losses;
                const df = s.scored - s.against;
                const qualifies = idx < qualifyPerGroup;
                return (
                  <View key={s.id} style={[styles.standingsRow, qualifies && styles.standingsTop]}>
                    <Text style={[styles.standingsCell, styles.standingsTeamCell]} numberOfLines={1}>
                      {s.team.name}
                    </Text>
                    <Text style={styles.standingsCell}>{pj}</Text>
                    <Text style={styles.standingsCell}>{s.wins}</Text>
                    <Text style={styles.standingsCell}>{s.losses}</Text>
                    <Text style={[styles.standingsCell, df > 0 ? styles.dfPos : df < 0 ? styles.dfNeg : {}]}>
                      {df > 0 ? `+${df}` : df}
                    </Text>
                  </View>
                );
              })}
            </View>

            {group.matches.length > 0 && (
              <View style={styles.matchList}>
                {group.matches.map((m) => (
                  <MatchRow
                    key={m.id}
                    match={m}
                    isAdmin={isAdmin}
                    token={token}
                    seriesFormat={seriesFormat}
                    matchPoints={matchPoints}
                    regularGamePoints={regularGamePoints}
                    tiebreakerPoints={tiebreakerPoints}
                    onResultLoaded={onResultLoaded}
                  />
                ))}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

function LlaveTab({
  matches,
  isAdmin,
  token,
  seriesFormat,
  matchPoints,
  regularGamePoints,
  tiebreakerPoints,
  onResultLoaded,
}: {
  matches: MatchDetail[];
  isAdmin: boolean;
  token: string | null;
  seriesFormat: string;
  matchPoints: number;
  regularGamePoints: number;
  tiebreakerPoints: number;
  onResultLoaded: () => void;
}) {
  if (matches.length === 0) {
    return <Text style={styles.empty}>La llave aún no fue generada</Text>;
  }

  const byPhase = matches.reduce<Record<string, MatchDetail[]>>((acc, m) => {
    if (!acc[m.phase]) acc[m.phase] = [];
    acc[m.phase].push(m);
    return acc;
  }, {});

  const phaseOrder = ["ROUND_OF_16", "QUARTERFINAL", "SEMIFINAL", "FINAL"];
  const phases = phaseOrder.filter((p) => byPhase[p]);

  return (
    <View style={{ gap: 20 }}>
      {phases.map((phase) => (
        <View key={phase}>
          <Text style={styles.groupTitle}>{PHASE_LABEL[phase] ?? phase}</Text>
          <View style={styles.matchList}>
            {byPhase[phase].map((m) => (
              <MatchRow
                key={m.id}
                match={m}
                isAdmin={isAdmin}
                token={token}
                seriesFormat={seriesFormat}
                matchPoints={matchPoints}
                regularGamePoints={regularGamePoints}
                tiebreakerPoints={tiebreakerPoints}
                onResultLoaded={onResultLoaded}
              />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

function MatchRow({
  match,
  isAdmin,
  token,
  seriesFormat,
  matchPoints,
  regularGamePoints,
  tiebreakerPoints,
  onResultLoaded,
}: {
  match: MatchDetail;
  isAdmin: boolean;
  token: string | null;
  seriesFormat: string;
  matchPoints: number;
  regularGamePoints: number;
  tiebreakerPoints: number;
  onResultLoaded: () => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const finished = match.status === "FINISHED";
  const isBye = match.awayTeam === null;

  return (
    <>
      <TouchableOpacity
        style={styles.matchRow}
        onPress={() => {
          if (isAdmin && !finished && !isBye) setModalOpen(true);
        }}
        activeOpacity={isAdmin && !finished && !isBye ? 0.7 : 1}
      >
        <Text
          style={[styles.matchTeam, match.winner?.id === match.homeTeam.id && styles.matchWinner]}
          numberOfLines={1}
        >
          {match.homeTeam.name}
        </Text>
        <View style={styles.matchScore}>
          {finished ? (
            <Text style={styles.matchScoreText}>
              {match.homeScore} – {match.awayScore}
            </Text>
          ) : isBye ? (
            <Text style={styles.matchBye}>Bye</Text>
          ) : (
            <Text style={[styles.matchPending, isAdmin && styles.matchPendingAdmin]}>
              {isAdmin ? "Cargar" : "vs"}
            </Text>
          )}
        </View>
        <Text
          style={[
            styles.matchTeam,
            styles.matchTeamRight,
            match.winner?.id === match.awayTeam?.id && styles.matchWinner,
          ]}
          numberOfLines={1}
        >
          {match.awayTeam?.name ?? ""}
        </Text>
      </TouchableOpacity>

      {modalOpen && (
        <ResultadoModal
          match={match}
          token={token}
          seriesFormat={seriesFormat}
          matchPoints={matchPoints}
          regularGamePoints={regularGamePoints}
          tiebreakerPoints={tiebreakerPoints}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            onResultLoaded();
          }}
        />
      )}
    </>
  );
}

function ResultadoModal({
  match,
  token,
  seriesFormat,
  matchPoints,
  regularGamePoints,
  tiebreakerPoints,
  onClose,
  onSaved,
}: {
  match: MatchDetail;
  token: string | null;
  seriesFormat: string;
  matchPoints: number;
  regularGamePoints: number;
  tiebreakerPoints: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isBest3 = seriesFormat === "BEST_OF_3";
  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");
  const [games, setGames] = useState([
    { home: "", away: "" },
    { home: "", away: "" },
    { home: "", away: "" },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const homeWins = isBest3
    ? games.filter((g) => parseInt(g.home) > parseInt(g.away)).length
    : 0;
  const awayWins = isBest3
    ? games.filter((g) => parseInt(g.away) > parseInt(g.home)).length
    : 0;
  const needsGame3 = isBest3 && homeWins === 1 && awayWins === 1;
  const game3Locked = isBest3 && !needsGame3;

  async function handleSubmit() {
    setError("");
    setLoading(true);
    try {
      let body: Record<string, unknown>;

      if (isBest3) {
        const activeGames = needsGame3 ? games.slice(0, 3) : games.slice(0, 2);
        body = { games: activeGames.map((g) => ({ home: parseInt(g.home), away: parseInt(g.away) })) };
      } else {
        body = { homeScore: parseInt(homeScore), awayScore: parseInt(awayScore) };
      }

      const res = await fetch(`${API_URL}/api/partidos/${match.id}/resultado`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Error al guardar");
        return;
      }
      onSaved();
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <View style={modal.overlay}>
        <View style={modal.card}>
          <Text style={modal.title}>Resultado</Text>
          <Text style={modal.subtitle}>
            {match.homeTeam.name} vs {match.awayTeam?.name}
          </Text>

          {isBest3 ? (
            <View style={{ gap: 12 }}>
              {[0, 1, 2].map((i) => {
                const locked = i === 2 && game3Locked;
                const pts = i < 2 ? regularGamePoints : tiebreakerPoints;
                return (
                  <View key={i} style={modal.gameRow}>
                    <Text style={modal.gameLabel}>
                      {i === 2 ? `J3 (desempate · ${pts} pts)` : `J${i + 1} · ${pts} pts`}
                    </Text>
                    <View style={modal.scoreRow}>
                      <TextInput
                        style={[modal.scoreInput, locked && modal.inputDisabled]}
                        keyboardType="numeric"
                        value={games[i].home}
                        onChangeText={(v) =>
                          setGames((prev) =>
                            prev.map((g, idx) => (idx === i ? { ...g, home: v } : g))
                          )
                        }
                        editable={!locked}
                        placeholder="0"
                      />
                      <Text style={modal.scoreSep}>–</Text>
                      <TextInput
                        style={[modal.scoreInput, locked && modal.inputDisabled]}
                        keyboardType="numeric"
                        value={games[i].away}
                        onChangeText={(v) =>
                          setGames((prev) =>
                            prev.map((g, idx) => (idx === i ? { ...g, away: v } : g))
                          )
                        }
                        editable={!locked}
                        placeholder="0"
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={modal.singleScoreRow}>
              <View style={modal.teamScoreCol}>
                <Text style={modal.teamLabel} numberOfLines={1}>{match.homeTeam.name}</Text>
                <TextInput
                  style={modal.scoreInput}
                  keyboardType="numeric"
                  value={homeScore}
                  onChangeText={setHomeScore}
                  placeholder="0"
                />
              </View>
              <Text style={[modal.scoreSep, { marginTop: 24 }]}>–</Text>
              <View style={modal.teamScoreCol}>
                <Text style={modal.teamLabel} numberOfLines={1}>{match.awayTeam?.name}</Text>
                <TextInput
                  style={modal.scoreInput}
                  keyboardType="numeric"
                  value={awayScore}
                  onChangeText={setAwayScore}
                  placeholder="0"
                />
              </View>
            </View>
          )}

          {!isBest3 && (
            <Text style={modal.hint}>El ganador debe tener {matchPoints} puntos</Text>
          )}

          {error ? <Text style={modal.error}>{error}</Text> : null}

          <View style={modal.actions}>
            <TouchableOpacity style={modal.cancelBtn} onPress={onClose}>
              <Text style={modal.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[modal.submitBtn, loading && modal.submitDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={modal.submitText}>Guardar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f5f3" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { color: "#dc2626", fontSize: 14 },

  header: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 4 },
  status: { fontSize: 12, fontWeight: "600", color: "#dc2626" },
  meta: { fontSize: 12, color: "#9ca3af" },
  description: { fontSize: 13, color: "#6b7280", marginBottom: 4, lineHeight: 18 },
  organizer: { fontSize: 12, color: "#9ca3af" },

  adminActions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  adminBtn: {
    backgroundColor: "#dc2626",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  adminBtnSecondary: { backgroundColor: "#f3f4f6" },
  adminBtnText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  adminBtnTextSecondary: { color: "#374151" },

  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: { borderBottomColor: "#dc2626" },
  tabText: { fontSize: 13, color: "#9ca3af", fontWeight: "500" },
  tabTextActive: { color: "#dc2626", fontWeight: "700" },

  content: { padding: 16, paddingBottom: 32 },
  empty: { textAlign: "center", color: "#9ca3af", marginTop: 32, fontSize: 14 },

  teamGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  teamCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    width: "47%",
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  teamName: { fontSize: 14, fontWeight: "600", color: "#111827", marginBottom: 4 },
  teamPlayers: { fontSize: 12, color: "#9ca3af" },

  groupTitle: { fontSize: 14, fontWeight: "700", color: "#111827", marginBottom: 8 },

  standingsTable: {
    backgroundColor: "#fff",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 12,
  },
  standingsRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  standingsHeader: { backgroundColor: "#f9fafb" },
  standingsTop: { backgroundColor: "#f0fdf4" },
  standingsHeaderText: { color: "#6b7280", fontWeight: "600", fontSize: 11 },
  standingsCell: { fontSize: 12, color: "#374151", textAlign: "center", width: 28 },
  standingsTeamCell: { flex: 1, textAlign: "left" },
  dfPos: { color: "#16a34a", fontWeight: "600" },
  dfNeg: { color: "#dc2626" },

  matchList: { gap: 8 },
  matchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  matchTeam: { flex: 1, fontSize: 13, color: "#374151" },
  matchTeamRight: { textAlign: "right" },
  matchWinner: { fontWeight: "700", color: "#111827" },
  matchScore: { paddingHorizontal: 12 },
  matchScoreText: { fontSize: 13, fontWeight: "700", color: "#111827" },
  matchPending: { fontSize: 12, color: "#9ca3af" },
  matchPendingAdmin: { color: "#dc2626", fontWeight: "600" },
  matchBye: { fontSize: 11, color: "#d1d5db", fontStyle: "italic" },
});

const modal = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  card: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
    gap: 16,
  },
  title: { fontSize: 18, fontWeight: "700", color: "#111827" },
  subtitle: { fontSize: 13, color: "#6b7280", marginTop: -8 },
  hint: { fontSize: 12, color: "#9ca3af" },
  error: { fontSize: 13, color: "#dc2626" },

  singleScoreRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    gap: 16,
  },
  teamScoreCol: { alignItems: "center", flex: 1 },
  teamLabel: { fontSize: 12, color: "#6b7280", marginBottom: 6, textAlign: "center" },

  gameRow: { gap: 6 },
  gameLabel: { fontSize: 12, color: "#6b7280" },
  scoreRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  scoreInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingVertical: 10,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  inputDisabled: { backgroundColor: "#f9fafb", color: "#d1d5db" },
  scoreSep: { fontSize: 16, color: "#9ca3af", fontWeight: "600" },

  actions: { flexDirection: "row", gap: 12, marginTop: 4 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelText: { color: "#6b7280", fontWeight: "600" },
  submitBtn: {
    flex: 1,
    backgroundColor: "#dc2626",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { color: "#fff", fontWeight: "700" },
});
