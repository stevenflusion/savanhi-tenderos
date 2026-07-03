import { Keyboard, Pressable } from "react-native";
import { useRouter } from "expo-router";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";

type Props = {
  onPress?: () => void;
};

export default function BackButton({ onPress }: Props) {
  const router = useRouter();

  const handlePress = () => {
    Keyboard.dismiss();
    if (onPress) onPress();
    else router.back();
  };

  return (
    <Pressable onPress={handlePress} className="h-14 w-14 flex justify-center">
      <FontAwesome6 name="chevron-left" size={24} color="#25262a" />
    </Pressable>
  );
}
