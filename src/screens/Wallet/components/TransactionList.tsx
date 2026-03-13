import React from 'react';
import { FlatList, Text } from 'react-native';
import TransactionItem from './TransactionItem';

type Transaction = { id: string; title: string; amount: number; date: string; type: 'deposit' | 'withdraw'; raw?: any };

function Empty() {
  return <Text className="text-gray-400 p-5 text-center">Chưa có giao dịch</Text>;
}

export default function TransactionList({ transactions, onItemPress }: { transactions: Transaction[]; onItemPress?: (tx: Transaction) => void }) {
  return (
  
    <FlatList
      data={transactions}
      keyExtractor={t => t.id}
      renderItem={({ item }) => <TransactionItem tx={item} onPress={() => onItemPress && onItemPress(item)} />}
      ListEmptyComponent={Empty}
    />
  );
}
