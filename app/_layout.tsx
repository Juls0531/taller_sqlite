import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { initDB } from "../database/db";

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const load = async () => {
      await initDB();
      setReady(true);
    };

    load();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerTitleAlign: "center" }}>
      <Stack.Screen name="programas/index" options={{ title: "Programas universitarios" }} />
      <Stack.Screen name="estudiantes/index" options={{ title: "Estudiantes" }} />
    </Stack>
  );
}