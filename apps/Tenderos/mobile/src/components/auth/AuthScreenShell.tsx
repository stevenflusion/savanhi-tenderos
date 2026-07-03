import { useEffect, useRef, type ReactNode } from "react";
import { Animated, KeyboardAvoidingView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePathname } from "expo-router";
import ProgressBar from "./ProgressBar";
import BackButton from "@/src/components/auth/BackButton";

type Props = {
  children: ReactNode;
  currentStep?: number;
  totalSteps?: number;
  headerCenter?: ReactNode;
};

const ROUTE_TO_STEP: Record<string, number> = {
  "person-name": 1,
  "store-name": 2,
  "business-location": 3,
  "store-photos": 4,
  "payment-method": 5,
};

export default function AuthScreenShell({
  children,
  currentStep,
  totalSteps = 6,
  headerCenter,
}: Props) {
  const pathname = usePathname();
  const segment = pathname.split("/").pop() ?? "";
  const step = currentStep ?? ROUTE_TO_STEP[segment];

  // ── Subtle entrance fade (plays alongside Stack slide_from_right) ──
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, pathname]);

  return (
    <View className="flex-1">
      <SafeAreaView className="flex-1 bg-white">
        <KeyboardAvoidingView behavior="padding" className="flex-1">
          {/* ── Header row: back button + center slot + step counter ── */}
          <View className="flex-row items-center justify-between px-6 pt-5">
            <BackButton />
            {headerCenter && (
              <View className="flex-1 mx-3">{headerCenter}</View>
            )}
            {step !== undefined && (
              <Text className="text-sm text-gray-400">
                Paso {step} de {totalSteps}
              </Text>
            )}
          </View>

          <Animated.View className="flex-1" style={{ opacity: fadeAnim }}>
            {children}
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
