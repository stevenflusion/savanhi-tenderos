import { Redirect, Tabs } from "expo-router";
import {
  createTabBarButton,
  useNavBarScreenOptions,
  renderNavIcon,
} from "@/src/components/NavBar";
import { useAuth } from "@/src/components/AuthProvider";

type TabButtonArg = {
  accessibilityState?: {
    selected?: boolean;
  };
};

export default function TabsLayout() {
  const { isLoggedIn, isReady } = useAuth();
  const navBarScreenOptions = useNavBarScreenOptions();
  if (!isReady) return null;
  if (!isLoggedIn) return <Redirect href="/auth/welcome" />;

  return (
    <Tabs initialRouteName="index" screenOptions={navBarScreenOptions}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color }: { color: string; size: number }) =>
            renderNavIcon("HOME", color),
          tabBarButton: (props: TabButtonArg) =>
            createTabBarButton(props.accessibilityState?.selected === true)(
              props
            ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Productos",
          tabBarIcon: ({ color }: { color: string; size: number }) =>
            renderNavIcon("ORD", color),
          tabBarButton: (props: TabButtonArg) =>
            createTabBarButton(props.accessibilityState?.selected === true)(
              props
            ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color }: { color: string; size: number }) =>
            renderNavIcon("PER", color),
          tabBarButton: (props: TabButtonArg) =>
            createTabBarButton(props.accessibilityState?.selected === true)(
              props
            ),
        }}
      />
    </Tabs>
  );
}
