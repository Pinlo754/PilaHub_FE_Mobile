import { View, TouchableOpacity, Text, ActivityIndicator } from "react-native";
import { useNavigation } from '@react-navigation/native';

type Props = {
  onSave?: () => void;
  saving?: boolean;

  onAccept?: () => void;
  showAccept?: boolean;
  accepting?: boolean;
};

export default function BottomActionBar({
  onSave,
  saving,
  onAccept,
  showAccept,
  accepting,
  showSave = true, // 👈 default
}: Props & { showSave?: boolean }) {
  const navigation: any = useNavigation();
  return (
    <View className="absolute bottom-5 left-5 right-5">

      {/* Accept button */}
      {showAccept && (
        <TouchableOpacity
          onPress={onAccept}
          disabled={accepting}
          className="bg-green-600 p-4 rounded-2xl mb-10 items-center"
        >
          {accepting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-bold">Đồng ý roadmap</Text>
          )}
        </TouchableOpacity>
      )}

      {/* Row buttons */}
      <View className="flex-row">
        {showSave && (
          <TouchableOpacity
            onPress={() => onSave && onSave()}
            className="flex-1 bg-[#8B4513] p-4 rounded-2xl mr-3 items-center"
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold">Lưu</Text>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={() => navigation.navigate('CreateRoadmap')} className="flex-1 bg-[#E5D5C3] p-4 rounded-2xl items-center">
          <Text className="font-bold">Tạo lại</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}