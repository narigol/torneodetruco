import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import type { TournamentWithDetails } from "@tdt/types";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

const statusLabel: Record<string, string> = {
  DRAFT: "Borrador",
  REGISTRATION: "Inscripción",
  IN_PROGRESS: "En curso",
  FINISHED: "Finalizado",
};

export default function TorneosScreen() {
  const [torneos, setTorneos] = useState<TournamentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const token = await SecureStore.getItemAsync("token");
      const res = await fetch(`${API_URL}/api/torneos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setTorneos(data);
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
      data={torneos}
      keyExtractor={(t) => t.id}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.status}>{statusLabel[item.status]}</Text>
          </View>
          <Text style={styles.meta}>
            {item._count.teams} equipos · {item._count.matches} partidos
          </Text>
          <Text style={styles.admin}>Organizado por {item.admin.name}</Text>
        </TouchableOpacity>
      )}
      ListEmptyComponent={
        <Text style={styles.empty}>No hay torneos disponibles</Text>
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
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  name: { fontSize: 15, fontWeight: "600", color: "#111827", flex: 1 },
  status: { fontSize: 12, color: "#6b7280" },
  meta: { fontSize: 13, color: "#6b7280", marginBottom: 2 },
  admin: { fontSize: 12, color: "#9ca3af" },
  empty: { textAlign: "center", color: "#9ca3af", marginTop: 40, fontSize: 15 },
});
