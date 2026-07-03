import { Keyboard, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";

type Props = {
  current: number;
  total: number;
  onBack?: () => void;
};

export default function StepHeader({ current, total, onBack }: Props) {
  const router = useRouter();

  const handleBack = () => {
    Keyboard.dismiss();
    if (onBack) onBack();
    else router.back();
  };

  return (
    <View className="mb-6 flex-row items-center justify-between">
      <Pressable onPress={handleBack} className="h-10 w-10 justify-center">
        <FontAwesome6 name="chevron-left" size={24} color="black" />
      </Pressable>
      <Text className="text-base text-gray-500">
        Paso {current} de {total}
      </Text>
    </View>
  );
}
