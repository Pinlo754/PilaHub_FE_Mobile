import React from 'react';
import { View, Text } from 'react-native';

type Props = { balance: number };

export default function BalanceCard({ balance }: Props) {
  const formatted = balance.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (
    <View className="bg-foreground rounded-xl p-4">
      <Text className="text-white text-xs">Số dư ví</Text>
      <Text className="text-white text-2xl font-extrabold mt-2">{formatted} đ</Text>
    </View>
  );
}
