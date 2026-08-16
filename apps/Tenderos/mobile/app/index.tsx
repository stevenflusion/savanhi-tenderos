import { Redirect } from "expo-router";
import { useAuth } from "@/src/features/auth";

export default function IndexScreen() {
  const { isLoggedIn, isReady } = useAuth();
  if (!isReady) return null;
  return <Redirect href={(isLoggedIn ? "/(tabs)" : "/auth/welcome") as never} />;
}
