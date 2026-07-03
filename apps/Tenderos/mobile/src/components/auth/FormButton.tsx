import { ActivityIndicator, Pressable, Text, View } from "react-native";

type Props = {
  label: string;
  loadingLabel?: string;
  valid: boolean;
  loading: boolean;
  onPress: () => void;
};

export default function FormButton({
  label,
  loadingLabel,
  valid,
  loading,
  onPress,
}: Props) {
  const disabled = !valid || loading;

  return (
    <View className="px-6 pb-5">
      <Pressable
        onPress={onPress}
        disabled={disabled}
        className={`h-16 items-center justify-center rounded-full ${
          valid ? "bg-black" : "bg-gray-100"
        }`}
      >
        {loading ? (
          <>
            <ActivityIndicator
              size="small"
              color={valid ? "#ffffff" : "#9ca3af"}
              className="mr-2"
            />
            <Text
              className={`text-lg ${
                valid && !loading ? "text-white" : "text-gray-400"
              }`}
            >
              {loadingLabel ?? label}
            </Text>
          </>
        ) : (
          <Text
            className={`text-lg ${
              valid && !loading ? "text-white" : "text-gray-400"
            }`}
          >
            {label}
          </Text>
        )}
      </Pressable>
    </View>
  );
}
