import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import type { TournamentWithDetails } from "@tdt/types";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

const statusLabel: Record<string, string> = {
  DRAFT: "Borrador",
  REGISTRATION: "Inscripción",
  IN_PROGRESS: "En curso",
  FINISHED: "Finalizado",
};

const statusColor: Record<string, string> = {
  DRAFT: "#9ca3af",
  REGISTRATION: "#3b82f6",
  IN_PROGRESS: "#16a34a",
  FINISHED: "#6b7280",
};

export default function TorneosScreen() {
  const [torneos, setTorneos] = useState<TournamentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const token = await SecureStore.getItemAsync("token");
        const res = await fetch(`${API_URL}/api/torneos`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        setTorneos(Array.isArray(data) ? data : []);
      } catch {
        setError("No se pudo cargar los torneos");
      } finally {
        setLoading(false);
      }
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

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={styles.list}
      data={torneos}
      keyExtractor={(t) => t.id}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push(`/torneos/${item.id}`)}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
            <View style={[styles.badge, { backgroundColor: statusColor[item.status] + "22" }]}>
              <Text style={[styles.badgeText, { color: statusColor[item.status] }]}>
                {statusLabel[item.status]}
              </Text>
            </View>
          </View>
          {item.description ? (
            <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
          ) : null}
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
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
    gap: 8,
  },
  name: { fontSize: 15, fontWeight: "600", color: "#111827", flex: 1 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: "600" },
  description: { fontSize: 13, color: "#6b7280", marginBottom: 6, lineHeight: 18 },
  meta: { fontSize: 12, color: "#9ca3af", marginBottom: 2 },
  admin: { fontSize: 12, color: "#9ca3af" },
  empty: { textAlign: "center", color: "#9ca3af", marginTop: 40, fontSize: 15 },
  errorText: { color: "#dc2626", fontSize: 14 },
});
