import { Pressable, Text, View } from "react-native";

type Props = {
  label: string;
  selected: boolean;
  onSelect: () => void;
};

export default function RadioOption({ label, selected, onSelect }: Props) {
  return (
    <Pressable onPress={onSelect} accessibilityRole="button" className="flex-row items-center py-4">
      <View
        className={`h-6 w-6 items-center justify-center rounded-full border-2 ${
          selected
            ? "border-orange-400 bg-orange-400"
            : "border-gray-300 bg-white"
        }`}
      >
        {selected && <View className="h-2.5 w-2.5 rounded-full bg-white" />}
      </View>
      <Text className="ml-3 text-lg text-gray-900">{label}</Text>
    </Pressable>
  );
}
