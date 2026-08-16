import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Animated, Image, Keyboard, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/src/features/auth";

import authLogo from "../assets/auth-logo";
import StepHeader from "../components/StepHeader";

type PaymentMethod = "efectivo" | "pichincha";

const OPTIONS: { label: string; value: PaymentMethod }[] = [
  { label: "Efectivo", value: "efectivo" },
  { label: "Banco Pichincha", value: "pichincha" },
];

export default function PaymentMethodScreen() {
  const { savePaymentMethod } = useAuth();
  const router = useRouter();
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const insets = useSafeAreaInsets();
  const valid = method !== null;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleSubmit = async () => {
    if (!valid || loading) return;
    Keyboard.dismiss();
    setLoading(true);
    setError("");

    const result = await savePaymentMethod({ method });
    if (result.success) {
      router.push("/auth/account-created" as any);
      setTimeout(() => setLoading(false), 400);
    } else {
      setLoading(false);
      setError(result.error ?? "Error al guardar método de pago");
    }
  };

  return (
    <View className="flex-1 bg-white">
      <Animated.View
        className="flex-1"
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        <View className="flex-1 px-6" style={{ paddingTop: insets.top + 24 }}>
          <StepHeader current={5} total={5} />

          <Text className="pb-5 text-4xl font-medium text-gray-900">
            Método de cobro principal
          </Text>

          <Text className="text-base leading-5 text-gray-600">
            Elegí el método que prefieras para recibir el dinero de tus ventas.
            Podrás cambiarlo más adelante desde tu perfil.
          </Text>

          <View className="mt-8">
            {OPTIONS.map(({ label, value }) => {
              const selected = method === value;
              return (
                <Pressable
                  key={value}
                  onPress={() => {
                    setMethod(value);
                    if (error) setError("");
                  }}
                  className="flex-row items-center py-4 pl-9"
                >
                  <View
                    className={`absolute left-2 h-6 w-6 items-center justify-center rounded-full border-2 ${
                      selected ? "border-black" : "border-gray-300"
                    }`}
                  >
                    {selected ? <View className="h-3 w-3 rounded-full bg-black" /> : null}
                  </View>

                  <Text className="ml-2 text-lg text-gray-900">{label}</Text>
                </Pressable>
              );
            })}
          </View>

          {error ? <Text className="pt-4 text-base leading-5 text-red-400">{error}</Text> : null}
        </View>

        <View className="px-6 pb-5">
          <Pressable
            onPress={handleSubmit}
            disabled={!valid || loading}
            className={`h-16 items-center justify-center rounded-full ${
              valid && !loading ? "bg-black" : "bg-gray-100"
            }`}
          >
            <Text className={`text-lg ${valid && !loading ? "text-white" : "text-gray-400"}`}>
              {loading ? "Guardando..." : "Finalizar"}
            </Text>
          </Pressable>
          <Text className="flex items-center justify-center pb-4 pt-4 text-center text-sm">
            <MaterialIcons name="lock" size={12} color="black" /> Nunca compartiremos tu email con nadie
          </Text>
        </View>
      </Animated.View>

      {loading ? (
        <View className="absolute inset-0 z-50">
          <View className="flex-1 items-center justify-center bg-white">
            <Image source={authLogo} className="h-40 w-40" resizeMode="contain" />
          </View>
        </View>
      ) : null}
    </View>
  );
}
