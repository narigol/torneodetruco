import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import * as SecureStore from "expo-secure-store";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

type Team = {
  id: string;
  name: string;
  teamPlayers: { player: { id: string; name: string } }[];
};

export default function EquiposScreen() {
  const [equipos, setEquipos] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const token = await SecureStore.getItemAsync("token");
      const res = await fetch(`${API_URL}/api/equipos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setEquipos(data);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#dc2626" />
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={styles.list}
      data={equipos}
      keyExtractor={(e) => e.id}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.players}>
            {item.teamPlayers.map((tp) => tp.player.name).join(", ")}
          </Text>
        </View>
      )}
      ListEmptyComponent={
        <Text style={styles.empty}>No hay equipos disponibles</Text>
      }
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  name: { fontSize: 15, fontWeight: "600", color: "#111827", marginBottom: 4 },
  players: { fontSize: 13, color: "#6b7280" },
  empty: { textAlign: "center", color: "#9ca3af", marginTop: 40, fontSize: 15 },
});
