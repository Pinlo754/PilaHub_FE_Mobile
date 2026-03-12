import React from 'react';
import { Pressable, View, Text } from 'react-native';

type Transaction = { id: string; title: string; amount: number; date: string; type: 'deposit' | 'withdraw'; raw?: any };

export default function TransactionItem({ tx, onPress }: { tx: Transaction; onPress?: () => void }) {
  const sign = tx.type === 'deposit' ? '+' : '-';
  const colorClass = tx.type === 'deposit' ? 'text-success' : 'text-danger';
  const formatted = tx.amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return (
    <View>
      
      <Pressable onPress={onPress} className="flex-row justify-between items-center p-4 border-b border-gray-100">
      <View>
        <Text className="font-semibold">{tx.title}</Text>
        <Text className="text-gray-400 text-xs">{tx.date}</Text>
      </View>

      <Text className={`${colorClass} font-bold`}>{sign}{formatted} đ</Text>
    </Pressable></View>
    
  );
}
