import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Keyboard,
  KeyboardEvent,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/components/AuthProvider";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import StepHeader from "@/src/components/auth/StepHeader";

export default function StoreNameScreen() {
  const { saveProfile, user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [storeName, setStoreName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const valid = storeName.trim().length > 0;

  // ── Manual keyboard tracking (bypasses KeyboardAvoidingView bugs on Android) ──
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e: KeyboardEvent) => setKeyboardHeight(e.endCoordinates.height),
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardHeight(0),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // ── Fade + slide animation ──
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
    const result = await saveProfile({ name: user?.fullName || "", storeName });
    if (result.success) {
      router.push("/auth/location-permissions" as any);
      setTimeout(() => setLoading(false), 400);
    } else {
      setLoading(false);
      setError(result.error ?? "Error al guardar datos");
    }
  };

  return (
    <View className="flex-1 bg-white">
      <Animated.View
        className="flex-1"
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          paddingBottom: keyboardHeight,
        }}
      >
        {/* ── Content area (flex-1 pushes CTA to the bottom) ── */}
        <View className="flex-1 px-6" style={{ paddingTop: insets.top + 24 }}>
          <StepHeader current={2} total={5} />

          {/* ── Title ── */}
          <Text className="text-4xl pb-10 font-medium text-gray-900">
            ¿Cuál es el nombre de tu negocio?
          </Text>

          {/* ── Input ── */}
          <TextInput
            value={storeName}
            onChangeText={(v) => {
              setStoreName(v);
              if (error) setError("");
            }}
            placeholder="Nombre de tu tienda"
            placeholderTextColor="#9ca3af"
            autoCapitalize="words"
            autoFocus
            className="h-16 px-4 border rounded-2xl border-gray-900 text-lg  text-gray-900"
          />

          {error ? (
            <Text className="text-base pt-4 leading-5 text-red-400">
              {error}
            </Text>
          ) : (
            <Text className="text-base pt-4 leading-5 text-gray-600">
              Así encontrarán tu negocio en la app. Puedes cambiarlo después
              desde la configuración de tu perfil.
            </Text>
          )}
        </View>

        {/* ── Bottom-pinned CTA ── */}
        <View className="px-6" style={{ paddingBottom: insets.bottom + 16 }}>
          <Pressable
            onPress={handleSubmit}
            disabled={!valid || loading}
            className={`h-16 items-center justify-center rounded-full ${
              valid && !loading ? "bg-black" : "bg-gray-100"
            }`}
          >
            <Text
              className={`text-lg ${
                valid && !loading ? "text-white" : "text-gray-400"
              }`}
            >
              Siguiente
            </Text>
          </Pressable>
          <Text className="text-center flex items-center justify-center text-sm pt-4">
            <MaterialCommunityIcons
              name="folder-alert"
              size={12}
              color="black"
            />{" "}
            Esta información ayuda a personalizar tu sesión
          </Text>
        </View>
      </Animated.View>

      {/* ── Loading overlay ── */}
      {loading && (
        <View className="absolute inset-0 z-50">
          <View className="flex-1 items-center justify-center bg-white">
            <Image
              source={require("../../assets/images/logo.png")}
              className="h-40 w-40"
              resizeMode="contain"
            />
          </View>
        </View>
      )}
    </View>
  );
}
