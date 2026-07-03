import { useEffect, useRef, useState } from "react";
import { Animated, Image, Keyboard, Pressable, Text, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import AntDesign from "@expo/vector-icons/AntDesign";

export default function AccountCreatedScreen() {
  const router = useRouter();

  // ── Fade + slide animation ──
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleStart = () => {
    router.replace("/(tabs)");
  };

  const handleBack = () => {
    Keyboard.dismiss();
    setTimeout(() => router.back(), 50);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Animated.View
        className="flex-1"
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          paddingBottom: keyboardHeight,
        }}
      >
        <View className="flex-1 px-6" style={{ paddingTop: insets.top }}>
          {/* ── Checkmark icon ── */}
          <Pressable
            onPress={handleBack}
            className="mb-10 h-10 w-10 justify-center"
          >
            <AntDesign name="close" size={26} color="black" />
          </Pressable>

          <View className="flex gap-1">
            <Image
              source={require("../../assets/images/logo.png")}
              className="h-16 w-16"
              resizeMode="cover"
            />
            {/* ── Title ── */}
            <Text className="mt-6 text-4xl text-gray-900">
              Te damos la bienvenida a Savanhi.
            </Text>
            <Text className="flex text-gray-400 justify-center text-base pb-4">
              Por favor, sigue estas normas
            </Text>

            {/* ── Subtitle ── */}
            <View className="flex gap-1 pb-4">
              <Text className="flex  text-gray-900 justify-center text-lg">
                Mantén tu información actualizada.
              </Text>
              <Text className="flex text-gray-400 justify-center text-base -pt-4">
                Asegúrate de que el nombre, dirección, horarios y datos de
                contacto sean correctos.
              </Text>
            </View>
            <View className="flex gap-1 pb-4">
              <Text className="flex  text-gray-900 justify-center text-lg ">
                Usa fotos reales.
              </Text>
              <Text className="flex text-gray-400 justify-center text-base -pt-4">
                Comparte imágenes claras y actuales de tu local y de tus
                productos para generar confianza.
              </Text>
            </View>
            <View className="flex gap-1 pb-4">
              <Text className="flex  text-gray-900 justify-center text-lg ">
                Brinda una buena atención.
              </Text>
              <Text className="flex text-gray-400 justify-center text-base -pt-4">
                Responde los pedidos y consultas lo antes posible para ofrecer
                una mejor experiencia a tus clientes.
              </Text>
            </View>
            <View className="flex gap-1 pb-4">
              <Text className="flex  text-gray-900 justify-center text-lg ">
                Mantén tu catálogo al día.
              </Text>
              <Text className="flex text-gray-400 justify-center text-base -pt-4">
                Actualiza los productos, precios y disponibilidad para evitar
                inconvenientes con los pedidos.
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* ── Bottom CTA ── */}
      <View className="px-6 pb-4">
        <Pressable
          onPress={handleStart}
          className="h-16 items-center justify-center rounded-full bg-black"
        >
          <Text className="text-lg text-white">Comenzar</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
