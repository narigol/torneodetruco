import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

type UserInfo = {
  id: string;
  name: string;
  email: string;
  role: string;
  plan: string;
};

export default function PerfilScreen() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, []);

  async function fetchUser() {
    try {
      const token = await SecureStore.getItemAsync("token");
      if (!token) {
        router.replace("/(auth)/login");
        return;
      }
      const res = await fetch(`${API_URL}/api/mobile/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        router.replace("/(auth)/login");
        return;
      }
      setUser(await res.json());
    } catch {
      // sin conexión, mostrar datos vacíos
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    Alert.alert("Cerrar sesión", "¿Seguro que querés cerrar sesión?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Cerrar sesión",
        style: "destructive",
        onPress: async () => {
          await SecureStore.deleteItemAsync("token");
          await SecureStore.deleteItemAsync("role");
          router.replace("/(auth)/login");
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#dc2626" />
      </View>
    );
  }

  const initials = user?.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? "?";

  const roleLabel = user?.role === "ADMIN" ? "Organizador" : "Jugador";
  const planLabel = user?.plan === "PRO" ? "Plan Organizador PRO" : "Plan Gratuito";
  const isPro = user?.plan === "PRO";

  return (
    <View style={styles.container}>
      {/* Avatar */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      {/* Info cards */}
      <View style={styles.card}>
        <Row label="Rol" value={roleLabel} />
        <View style={styles.divider} />
        <Row
          label="Plan"
          value={planLabel}
          valueStyle={isPro ? styles.proBadge : undefined}
        />
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

function Row({
  label,
  value,
  valueStyle,
}: {
  label: string;
  value: string;
  valueStyle?: object;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, valueStyle]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: {
    flex: 1,
    backgroundColor: "#f6f5f3",
    padding: 20,
  },
  avatarSection: {
    alignItems: "center",
    paddingVertical: 32,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#fee2e2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#dc2626",
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  email: {
    fontSize: 13,
    color: "#9ca3af",
    marginTop: 4,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f3f4f6",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: "#f3f4f6",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
  },
  rowLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  rowValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  proBadge: {
    color: "#d97706",
  },
  logoutButton: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#fecaca",
    paddingVertical: 14,
    alignItems: "center",
  },
  logoutText: {
    color: "#dc2626",
    fontWeight: "600",
    fontSize: 15,
  },
});
