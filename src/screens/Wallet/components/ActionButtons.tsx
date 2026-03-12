import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';

type Props = { onDeposit: () => void; onWithdraw?: () => void; onOpenWithdrawals?: () => void; withdrawalsCount?: number };

export default function ActionButtons({ onDeposit, onWithdraw, onOpenWithdrawals, withdrawalsCount = 0 }: Props) {
  const navigation = useNavigation<any>();

  function handleWithdraw() {
    if (onWithdraw) return onWithdraw();
    navigation.navigate('Withdraw');
  }

  function handleOpenWithdrawals() {
    if (onOpenWithdrawals) return onOpenWithdrawals();
    // fallback: do nothing
  }

  return (
    <View className="flex-row items-center mt-4">
      <TouchableOpacity className="flex-1 bg-info-lighter py-3 rounded-lg items-center mx-1" onPress={onDeposit}>
        <Text className="text-info-darker font-semibold">Nạp tiền</Text>
      </TouchableOpacity>

      <TouchableOpacity className="flex-1 bg-danger-20 py-3 rounded-lg items-center mx-1" onPress={handleWithdraw}>
        <Text className="text-danger-darker font-semibold">Rút tiền</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleOpenWithdrawals} className="ml-2 rounded-full bg-white px-4 py-2 border shadow-sm flex-row items-center">
        <View className="bg-pink-100 rounded-full w-8 h-8 items-center justify-center mr-3">
          <Text className="text-pink-600 font-bold">đ</Text>
        </View>
        <View>
          <Text className="font-semibold text-black">Yêu cầu rút</Text>
          <Text className="text-xs text-gray-500">{withdrawalsCount} lệnh</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}
