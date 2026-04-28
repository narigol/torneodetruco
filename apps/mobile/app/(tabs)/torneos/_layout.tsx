import { Stack } from "expo-router";

export default function TorneosLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#fff" },
        headerTitleStyle: { fontWeight: "700" },
        headerTintColor: "#dc2626",
      }}
    >
      <Stack.Screen name="index" options={{ title: "Torneos" }} />
      <Stack.Screen name="[id]" options={{ title: "Detalle" }} />
    </Stack>
  );
}
