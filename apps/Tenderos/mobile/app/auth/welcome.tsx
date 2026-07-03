import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AntDesign from '@expo/vector-icons/AntDesign';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1">
      {/* ── Top: branding ── */}
      <View className="flex-1 items-center justify-center px-6">
        <Text
          className="text-5xl font-semibold tracking-widest"
        >
          SAVANHI
        </Text>
        <Text className="mt-2 text-base text-gray-500">
          Conecta con tu casero
        </Text>
      </View>

      {/* ── Bottom: actions ── */}
      <View className="px-6 pb-12">
        {/* Grid: 2 buttons side by side */}
        <View className="gap-4">
          {/* Google */}
          <Pressable
            className="rounded-full flex-row justify-between items-center px-6 py-4 border border-gray-200 bg-[#ffae58]"
          >
            <AntDesign name="google" color="#fde047" size={22} />
            <Text className="text-base uppercase tracking-wide text-black">
              Continuar con Google
            </Text>
            <Text className="text-xs font-semibold uppercase tracking-wide text-black">
              
            </Text>
          </Pressable>

          {/* Email */}
          <Pressable
            className="rounded-full flex-row justify-between items-center px-6 py-4 border border-gray-200 bg-[#0000002a]"
            onPress={() => router.push("/auth/enter-email")}
          >
            <MaterialIcons name="email" size={22} color="black" />
            <Text className="text-base uppercase tracking-wide text-black">
              Continuar con email
            </Text>
            <Text className="text-xs font-semibold uppercase tracking-wide text-black">
            </Text>
          </Pressable>
          
        </View>

        {/* Terms */}
        <Text className="mt-8 text-center text-base leading-5 text-gray-400">
          Al registrarte, aceptas nuestros{" "}
          <Text className="font-semibold text-orange-400">Terminos</Text> y{" "}
          <Text className="font-semibold text-orange-400">
            Politica de Privacidad
          </Text>
        </Text>
      </View>
    </SafeAreaView>
  );
}
