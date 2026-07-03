import { Text, TextInput, View } from "react-native";

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  error?: string;
  hint?: string;
  /** Shown as a green confirmation when the field value is valid */
  success?: string;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  keyboardType?: "default" | "number-pad" | "email-address";
  maxLength?: number;
  autoFocus?: boolean;
};

export default function FormField({
  value,
  onChangeText,
  placeholder,
  error,
  hint,
  success,
  autoCapitalize = "sentences",
  keyboardType = "default",
  maxLength,
  autoFocus = false,
}: Props) {
  return (
    <View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        maxLength={maxLength}
        autoFocus={autoFocus}
        className="h-16 mt-8 border-2 border-[#6e6e6e] px-5 rounded-3xl text-lg text-gray-900"
      />

      {error ? (
        <Text className="mt-5 text-sm text-red-500">{error}</Text>
      ) : success && value.length > 0 ? (
        <Text className="mt-5 text-sm text-green-600">{success}</Text>
      ) : hint ? (
        <Text className="mt-6 text-gray-500 px-2 text-base leading-5">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
