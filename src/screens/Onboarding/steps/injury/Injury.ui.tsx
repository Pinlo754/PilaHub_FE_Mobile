import React from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, TextInput } from 'react-native';
import { useInjuryLogic } from './Injury.logic';
import Toast from '../../../../components/Toast';

export default function InjuryUI() {
  const { filteredInjuries, selected, selectInjury, notes, setNotes, loading, searchText, setSearchText, onBack, onSkip, onNext, toastVisible, toastMsg, toastType, setToastVisible } = useInjuryLogic();

  return (
    <View className="flex-1 bg-background w-full">
      <Pressable onPress={onBack} className="mb-6 pt-6">
        <Text className="text-secondaryText text-base">← Quay lại</Text>
      </Pressable>

      <Text className="text-xl font-semibold text-foreground text-center px-6">Chấn thương</Text>
      <Text className="text-sm text-secondaryText text-center mt-2 px-6">Chọn chấn thương bạn đã từng gặp (nếu có). Bạn có thể bỏ qua nếu không.</Text>

      <View className="flex-1 px-6 mt-4">
        {loading ? (
          <View className="flex-1 items-center justify-center"><ActivityIndicator /></View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Search input */}
            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Tìm chấn thương"
              className="h-12 px-4 mb-4 rounded-xl bg-white text-foreground"
            />

            {(filteredInjuries || []).map((inj: any) => {
              const id = inj.injuryId ?? inj.id;
              const sel = selected as any;
              const isSelected = Array.isArray(sel)
                ? sel.some((s: any) => ((s?.injuryId ?? s?.id) === id))
                : (sel && ((sel?.injuryId ?? sel?.id) === id));
              return (
                <Pressable
                  key={id}
                  onPress={() => selectInjury(inj)}
                  className={`p-4 rounded-xl mb-3 border ${isSelected ? 'bg-foreground/10 border-foreground' : 'bg-white border-background-sub2'}`}>
                  <Text className="text-base text-foreground font-medium">{inj.name}</Text>
                  <Text className="text-sm text-secondaryText mt-1">{inj.description}</Text>
                </Pressable>
              );
            })}

            <View className="mt-4">
              <Text className="text-sm text-secondaryText mb-2">Ghi chú (nếu muốn)</Text>
              <TextInput value={notes} onChangeText={setNotes} className="h-14 px-4 rounded-xl bg-white text-foreground" placeholder="Mô tả ngắn về chấn thương" />
            </View>

            <View className="h-32" />
          </ScrollView>
        )}
      </View>

      <View className="absolute left-0 right-0 bottom-0 px-6 py-4 bg-transparent">
        <View className="w-full">
          <Pressable onPress={onNext} className={`h-14 rounded-xl items-center justify-center mb-3 bg-foreground`}>
            <Text className="text-white font-semibold text-base">Lưu & Tiếp tục</Text>
          </Pressable>

          <Pressable onPress={onSkip} className="h-14 rounded-xl items-center justify-center border border-background-sub2 bg-white">
            <Text className="text-foreground font-semibold text-base">Bỏ qua</Text>
          </Pressable>
        </View>
      </View>

      <Toast visible={toastVisible} message={toastMsg} type={toastType} onHidden={() => setToastVisible(false)} />

    </View>
  );
}
