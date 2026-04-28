import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
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
  awayTeam: TeamSmall;
  winner: TeamSmall | null;
};

type GroupStanding = {
  id: string;
  points: number;
  wins: number;
  losses: number;
  draws: number;
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
  startDate: string | null;
  admin: { name: string };
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

type Tab = "equipos" | "grupos" | "llave";

export default function TorneoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();

  const [torneo, setTorneo] = useState<TournamentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("equipos");

  useEffect(() => {
    async function load() {
      try {
        const token = await SecureStore.getItemAsync("token");
        const res = await fetch(`${API_URL}/api/torneos/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
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
    }
    load();
  }, [id]);

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

  const hasGroups = torneo.format === "GROUPS_AND_KNOCKOUT";
  const tabs: Tab[] = ["equipos", ...(hasGroups ? ["grupos" as Tab] : []), "llave"];

  return (
    <View style={styles.container}>
      {/* Info del torneo */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.status}>{STATUS_LABEL[torneo.status]}</Text>
          <Text style={styles.meta}>{torneo._count.teams} equipos</Text>
        </View>
        {torneo.description ? (
          <Text style={styles.description}>{torneo.description}</Text>
        ) : null}
        <Text style={styles.organizer}>Organizado por {torneo.admin.name}</Text>
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

      {/* Contenido */}
      <ScrollView contentContainerStyle={styles.content}>
        {activeTab === "equipos" && (
          <EquiposTab teams={torneo.teams} />
        )}
        {activeTab === "grupos" && (
          <GruposTab groups={torneo.groups} />
        )}
        {activeTab === "llave" && (
          <LlaveTab matches={torneo.matches} />
        )}
      </ScrollView>
    </View>
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

function GruposTab({ groups }: { groups: GroupDetail[] }) {
  if (groups.length === 0) {
    return <Text style={styles.empty}>Los grupos aún no fueron generados</Text>;
  }
  return (
    <View style={{ gap: 20 }}>
      {groups.map((group) => (
        <View key={group.id}>
          <Text style={styles.groupTitle}>{group.name}</Text>

          {/* Standings */}
          <View style={styles.standingsTable}>
            <View style={[styles.standingsRow, styles.standingsHeader]}>
              <Text style={[styles.standingsCell, styles.standingsTeamCell, styles.standingsHeaderText]}>Equipo</Text>
              <Text style={[styles.standingsCell, styles.standingsHeaderText]}>PJ</Text>
              <Text style={[styles.standingsCell, styles.standingsHeaderText]}>G</Text>
              <Text style={[styles.standingsCell, styles.standingsHeaderText]}>E</Text>
              <Text style={[styles.standingsCell, styles.standingsHeaderText]}>P</Text>
              <Text style={[styles.standingsCell, styles.standingsHeaderText]}>Pts</Text>
            </View>
            {group.standings.map((s, idx) => {
              const pj = s.wins + s.losses + s.draws;
              const isTop2 = idx < 2;
              return (
                <View key={s.id} style={[styles.standingsRow, isTop2 && styles.standingsTop2]}>
                  <Text style={[styles.standingsCell, styles.standingsTeamCell]} numberOfLines={1}>
                    {s.team.name}
                  </Text>
                  <Text style={styles.standingsCell}>{pj}</Text>
                  <Text style={styles.standingsCell}>{s.wins}</Text>
                  <Text style={styles.standingsCell}>{s.draws}</Text>
                  <Text style={styles.standingsCell}>{s.losses}</Text>
                  <Text style={[styles.standingsCell, styles.standingsPts]}>{s.points}</Text>
                </View>
              );
            })}
          </View>

          {/* Partidos del grupo */}
          {group.matches.length > 0 && (
            <View style={styles.matchList}>
              {group.matches.map((m) => (
                <MatchRow key={m.id} match={m} />
              ))}
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

function LlaveTab({ matches }: { matches: MatchDetail[] }) {
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
              <MatchRow key={m.id} match={m} />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

function MatchRow({ match }: { match: MatchDetail }) {
  const finished = match.status === "FINISHED";
  return (
    <View style={styles.matchRow}>
      <Text style={[styles.matchTeam, match.winner?.id === match.homeTeam.id && styles.matchWinner]} numberOfLines={1}>
        {match.homeTeam.name}
      </Text>
      <View style={styles.matchScore}>
        {finished ? (
          <Text style={styles.matchScoreText}>
            {match.homeScore} – {match.awayScore}
          </Text>
        ) : (
          <Text style={styles.matchPending}>vs</Text>
        )}
      </View>
      <Text style={[styles.matchTeam, styles.matchTeamRight, match.winner?.id === match.awayTeam.id && styles.matchWinner]} numberOfLines={1}>
        {match.awayTeam.name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { color: "#dc2626", fontSize: 14 },

  header: { backgroundColor: "#fff", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 4 },
  status: { fontSize: 12, fontWeight: "600", color: "#dc2626" },
  meta: { fontSize: 12, color: "#9ca3af" },
  description: { fontSize: 13, color: "#6b7280", marginBottom: 4, lineHeight: 18 },
  organizer: { fontSize: 12, color: "#9ca3af" },

  tabBar: { flexDirection: "row", backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  tab: { flex: 1, alignItems: "center", paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabActive: { borderBottomColor: "#dc2626" },
  tabText: { fontSize: 13, color: "#9ca3af", fontWeight: "500" },
  tabTextActive: { color: "#dc2626", fontWeight: "700" },

  content: { padding: 16, paddingBottom: 32 },
  empty: { textAlign: "center", color: "#9ca3af", marginTop: 32, fontSize: 14 },

  teamGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  teamCard: { backgroundColor: "#fff", borderRadius: 10, padding: 12, width: "47%", borderWidth: 1, borderColor: "#f3f4f6" },
  teamName: { fontSize: 14, fontWeight: "600", color: "#111827", marginBottom: 4 },
  teamPlayers: { fontSize: 12, color: "#9ca3af" },

  groupTitle: { fontSize: 14, fontWeight: "700", color: "#111827", marginBottom: 8 },

  standingsTable: { backgroundColor: "#fff", borderRadius: 10, overflow: "hidden", marginBottom: 12 },
  standingsRow: { flexDirection: "row", paddingVertical: 8, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  standingsHeader: { backgroundColor: "#f9fafb" },
  standingsTop2: { backgroundColor: "#fef2f2" },
  standingsHeaderText: { color: "#6b7280", fontWeight: "600", fontSize: 11 },
  standingsCell: { fontSize: 12, color: "#374151", textAlign: "center", width: 28 },
  standingsTeamCell: { flex: 1, textAlign: "left" },
  standingsPts: { fontWeight: "700", color: "#111827" },

  matchList: { gap: 8 },
  matchRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: "#f3f4f6" },
  matchTeam: { flex: 1, fontSize: 13, color: "#374151" },
  matchTeamRight: { textAlign: "right" },
  matchWinner: { fontWeight: "700", color: "#111827" },
  matchScore: { paddingHorizontal: 12 },
  matchScoreText: { fontSize: 13, fontWeight: "700", color: "#111827" },
  matchPending: { fontSize: 12, color: "#9ca3af" },
});
