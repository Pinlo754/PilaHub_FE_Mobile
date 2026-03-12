import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import TransactionList from './TransactionList';

type Tx = { id: string; title: string; amount: number; date: string; type: 'deposit' | 'withdraw'; raw?: any };

export default function TransactionHistory({
  transactions,
  filtered,
  loading,
  onReload,
  onItemPress,
}: {
  transactions: Tx[];
  filtered: Tx[];
  loading: boolean;
  onReload?: () => void;
  onItemPress?: (tx: Tx) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const total = transactions.length;
  const filteredCount = filtered.length;

  return (
    <View>
      <TouchableOpacity className="flex-row items-center justify-between bg-white p-3 rounded-lg" onPress={() => setExpanded(v => !v)}>
        <View>
          <Text className="font-semibold">Lịch sử giao dịch</Text>
          <Text className="text-xs text-gray-500">Tổng {total} — Hiển thị {filteredCount}</Text>
        </View>

        <Text className="text-sm text-gray-500">{expanded ? 'Ẩn' : 'Xem'}</Text>
      </TouchableOpacity>

      {expanded && (
        <View className="mt-3">
          {loading ? (
            <View className="py-4 items-center">
              <ActivityIndicator />
            </View>
          ) : (
            <>
              {filteredCount === 0 && total > 0 ? (
                <View className="p-3 bg-gray-50 rounded">
                  <Text className="text-sm text-gray-500">Bộ lọc đang trả về 0 kết quả — hiển thị dữ liệu thô (một vài mục):</Text>
                  <Text className="text-xs text-gray-400 mt-2">{JSON.stringify(transactions.slice(0, 5), null, 2)}</Text>
                  {onReload && (
                    <TouchableOpacity onPress={onReload} className="mt-2 py-2 px-3 bg-teal-500 rounded">
                      <Text className="text-white">Tải lại</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : ( 
                
                <TransactionList transactions={filtered} onItemPress={onItemPress} />
              )}

              {filteredCount === 0 && total === 0 && (
                <View className="p-3 bg-gray-50 rounded mt-3">
                  <Text className="text-sm text-gray-500">Chưa có giao dịch — thử bấm Tải lại.</Text>
                  {onReload && (
                    <TouchableOpacity onPress={onReload} className="mt-2 py-2 px-3 bg-teal-500 rounded">
                      <Text className="text-white">Tải lại</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </>
          )}
        </View>
      )}
    </View>
  );
}
