import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/components/AuthProvider";
import * as ImagePicker from "expo-image-picker";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import StepHeader from "@/src/components/auth/StepHeader";

const MAX_SLOTS = 3;

export default function StorePhotosScreen() {
  const { savePhotos } = useAuth();
  const router = useRouter();
  const [photos, setPhotos] = useState<(string | null)[]>(
    Array(MAX_SLOTS).fill(null),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filledCount = photos.filter((p) => p !== null).length;
  const visibleCount = filledCount >= 1 ? MAX_SLOTS : 2;
  const valid = filledCount >= 1;

  // ── Fade + slide animation ──
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const insets = useSafeAreaInsets();

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

  const handleSkip = async () => {
    if (loading) return;
    Keyboard.dismiss();
    setLoading(true);
    setError("");
    const result = await savePhotos([]);
    if (result.success) {
      router.push("/auth/payment-method" as any);
      setTimeout(() => setLoading(false), 400);
    } else {
      setLoading(false);
      setError(result.error ?? "Error al guardar");
    }
  };

  const pickImage = (slotIndex: number) => {
    Alert.alert("Agregar foto", "Elige una opción", [
      {
        text: "Cámara",
        onPress: async () => {
          try {
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ["images"],
              allowsEditing: true,
              quality: 0.8,
            });
            if (!result.canceled && result.assets[0]) {
              const asset = result.assets[0];
              setPhotos((prev) => {
                const next = [...prev];
                next[slotIndex] = asset.uri;
                return next;
              });
            }
          } catch {
            setError("No pudimos acceder a la cámara");
          }
        },
      },
      {
        text: "Galería",
        onPress: async () => {
          try {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ["images"],
              allowsEditing: true,
              quality: 0.8,
            });
            if (!result.canceled && result.assets[0]) {
              const asset = result.assets[0];
              setPhotos((prev) => {
                const next = [...prev];
                next[slotIndex] = asset.uri;
                return next;
              });
            }
          } catch {
            setError("No pudimos acceder a la galería");
          }
        },
      },
      { text: "Cancelar", style: "cancel" },
    ]);
  };

  const handleSubmit = async () => {
    if (!valid || loading) return;
    Keyboard.dismiss();
    setLoading(true);
    setError("");
    const uris = photos.filter((p): p is string => p !== null);
    const result = await savePhotos(uris);
    if (result.success) {
      router.push("/auth/payment-method" as any);
      setTimeout(() => setLoading(false), 400);
    } else {
      setLoading(false);
      setError(result.error ?? "Error al guardar fotos");
    }
  };

  return (
    <View className="flex-1 bg-white">
      <Animated.View
        className="flex-1"
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <View className="flex-1 px-6" style={{ paddingTop: insets.top + 24 }}>
          <StepHeader current={4} total={5} />

          {/* ── Title ── */}
          <Text className="text-4xl pb-6 font-medium text-gray-900">
            Fotos de tu local
          </Text>

          {/* ── Subtitle ── */}
          <Text className="text-base leading-5 text-gray-600">
            Agrega fotos de tu negocio para que los clientes lo conozcan mejor y
            se animen a comprar.
          </Text>

          {/* ── Photo Slots (2 top, 3rd below) ── */}
          <View className="mt-8 flex-row flex-wrap justify-center gap-x-4 gap-y-4">
            {[...Array(visibleCount)].map((_, slotIndex) => (
              <Pressable
                key={slotIndex}
                onPress={() => pickImage(slotIndex)}
                className="h-52 w-40 items-center justify-center overflow-hidden rounded-xl bg-gray-100"
              >
                {photos[slotIndex] ? (
                  <>
                    <Image
                      source={{ uri: photos[slotIndex]! }}
                      className="h-full w-full"
                      resizeMode="cover"
                    />

                    {/* White circle with + in bottom-left */}
                    <View className="absolute bottom-2 left-2 h-7 w-7 items-center justify-center rounded-full bg-white shadow-sm">
                      <MaterialIcons name="add" size={18} color="black" />
                    </View>
                  </>
                ) : (
                  <>
                    <MaterialIcons
                      name="camera-alt"
                      size={24}
                      color="#9ca3af"
                    />

                    {/* White circle with + in bottom-left */}
                    <View className="absolute bottom-2 left-2 h-7 w-7 items-center justify-center rounded-full bg-white shadow-sm">
                      <MaterialIcons name="add" size={18} color="black" />
                    </View>
                  </>
                )}
              </Pressable>
            ))}
          </View>
        </View>

        <View className="px-6 pb-6">
          <Pressable
            onPress={valid ? handleSubmit : handleSkip}
            disabled={loading}
            className="h-16 items-center justify-center rounded-full bg-black"
          >
            <Text className="text-lg text-white">
              {valid ? "Siguiente" : "Omitir por ahora"}
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
