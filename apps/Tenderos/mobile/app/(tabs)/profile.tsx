import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MobileTopBar } from "@/src/components/MobileTopBar";
import { useAuth } from "@/src/features/auth";

export default function ProfileTab() {
  const { user, logout, isReady } = useAuth();

  if (!isReady) return null;

  return (
    <SafeAreaView className="flex-1 bg-orange-50">
      <MobileTopBar
        title="Perfil"
        subtitle="Datos de cuenta y configuracion principal"
      />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 12 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full max-w-xl self-center rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <Text className="text-lg font-semibold text-slate-900">Tu cuenta</Text>
          <Text className="mt-4 text-sm text-slate-500">Nombre</Text>
          <Text className="text-base text-slate-900">{user?.fullName ?? "-"}</Text>
          <Text className="mt-3 text-sm text-slate-500">Correo</Text>
          <Text className="text-base text-slate-900">{user?.email ?? "-"}</Text>

          <Pressable
            onPress={logout}
            className="mt-6 min-h-[44px] items-center justify-center rounded-xl bg-rose-500"
          >
            <Text className="text-base font-semibold text-white">Cerrar sesion</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
