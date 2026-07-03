import { Text, View } from "react-native";

type Props = {
  current: number;
  total: number;
};

export default function ProgressBar({ current, total }: Props) {
  return (
    <View className="px-6 pb-2">
      <View className="flex-row gap-1.5">
        {Array.from({ length: total }, (_, i) => (
          <View
            key={i}
            className={`h-1.5 flex-1 rounded-full ${
              i < current ? "bg-orange-400" : "bg-gray-200"
            }`}
          />
        ))}
      </View>
    </View>
  );
}
