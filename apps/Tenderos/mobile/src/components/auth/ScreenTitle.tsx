import { Text } from "react-native";

type Props = {
  children: string;
};

export default function ScreenTitle({ children }: Props) {
  return (
    <Text className="text-4xl font-medium text-[#25262a]">{children}</Text>
  );
}
