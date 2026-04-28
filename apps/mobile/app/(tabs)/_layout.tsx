import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#dc2626",
        tabBarInactiveTintColor: "#9ca3af",
        headerStyle: { backgroundColor: "#fff" },
        headerTitleStyle: { fontWeight: "700" },
      }}
    >
      <Tabs.Screen
        name="torneos"
        options={{ title: "Torneos", tabBarLabel: "Torneos" }}
      />
      <Tabs.Screen
        name="equipos"
        options={{ title: "Equipos", tabBarLabel: "Equipos" }}
      />
    </Tabs>
  );
}
