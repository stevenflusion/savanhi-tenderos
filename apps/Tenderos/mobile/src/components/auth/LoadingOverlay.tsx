import { Image, Modal, View } from "react-native";

type Props = {
  visible: boolean;
};

export default function LoadingOverlay({ visible }: Props) {
  return (
    <Modal visible={visible} transparent animationType="none">
      <View className="flex-1 items-center justify-center bg-white">
        <Image
          source={require("../../../assets/images/logo.png")}
          className="h-40 w-40"
          resizeMode="contain"
        />
      </View>
    </Modal>
  );
}
