import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useRef, useEffect } from "react";
import { TextInput, View, Text } from "react-native";

type Props = {
  value: string;
  onChange: (code: string) => void;
  error?: string;
};

const CELLS = 6;

export default function OtpInput({ value, onChange, error }: Props) {
  const refs = useRef<(TextInput | null)[]>(Array(CELLS).fill(null));

  // Auto-focus first cell on mount
  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  const handleChangeText = (text: string, index: number) => {
    // Paste: text has more than 1 character
    if (text.length > 1) {
      const digits = text.replace(/\D/g, "").slice(0, CELLS);
      onChange(digits);
      const nextIndex = Math.min(digits.length, CELLS - 1);
      refs.current[nextIndex]?.focus();
      return;
    }

    const digit = text.replace(/\D/g, "");
    if (digit) {
      const newVal = value.slice(0, index) + digit + value.slice(index + 1);
      onChange(newVal);
      if (index < CELLS - 1) {
        refs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace") {
      if (value[index]) {
        // Clear current cell content
        const newVal = value.slice(0, index) + value.slice(index + 1);
        onChange(newVal);
      } else if (index > 0) {
        // Go back and clear previous cell
        const newVal = value.slice(0, index - 1) + value.slice(index);
        onChange(newVal);
        refs.current[index - 1]?.focus();
      }
    }
  };

  return (
    <View>
      <View className="flex-row justify-center gap-3">
        {Array.from({ length: CELLS }, (_, i) => (
          <TextInput
            key={i}
            ref={(r) => {
              refs.current[i] = r;
            }}
            value={value[i] ?? ""}
            onChangeText={(t) => handleChangeText(t, i)}
            onKeyPress={({ nativeEvent: { key } }) => handleKeyPress(key, i)}
            keyboardType="number-pad"
            maxLength={CELLS}
            className={`h-16 w-14 text-gray-600 rounded-2xl border text-center text-2xl font-medium ${
              error ? "border-red-400" : "border-gray-900"
            }`}
            textContentType="oneTimeCode"
          />
        ))}
      </View>
      {error ? (
        <Text className="text-sm pt-4 ml-4 leading-5 text-red-400">
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={18}
            color="#f87171"
          />{" "}
          {error}
        </Text>
      ) : null}
    </View>
  );
}
