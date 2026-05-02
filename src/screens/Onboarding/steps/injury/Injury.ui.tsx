import React from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useInjuryLogic } from './Injury.logic';
import Toast from '../../../../components/Toast';
import ModalPopup from '../../../../components/ModalPopup';

export default function InjuryUI() {
  const {
    filteredInjuries,
    selected,
    selectInjury,
    notes,
    setNotes,
    loading,
    searchText,
    setSearchText,
    onBack,
    onSkip,
    onNext,
    canContinue,
    toastVisible,
    toastMsg,
    toastType,
    setToastVisible,
    modalVisible,
    modalTitle,
    modalMessage,
    modalIconName,
    modalIconBg,
    setModalVisible,
  } = useInjuryLogic();

  return (
    <View className="flex-1 bg-background w-full">
      <Pressable onPress={onBack} className="mb-6 pt-6 px-6">
        <Text className="text-secondaryText text-base">← Quay lại</Text>
      </Pressable>

      <Text className="text-xl font-semibold text-foreground text-center px-6">
        Chấn thương
      </Text>

      <Text className="text-sm text-secondaryText text-center mt-2 px-6">
        Chọn chấn thương bạn đã từng gặp nếu có. Bạn có thể bỏ qua nếu không.
      </Text>

      <View className="flex-1 px-6 mt-4">
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator />
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 190 }}
          >
            <View className="mb-4">
              <Text className="text-sm text-secondaryText mb-2">
                Tìm kiếm chấn thương
              </Text>

              <TextInput
                value={searchText}
                onChangeText={setSearchText}
                placeholder="Nhập tên chấn thương cần tìm"
                className="h-12 px-4 rounded-xl bg-white text-foreground border border-background-sub2"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {(filteredInjuries || []).map((inj: any) => {
              const id = inj.injuryId ?? inj.id;
              const sel = selected as any;

              const isSelected = Array.isArray(sel)
                ? sel.some((s: any) => (s?.injuryId ?? s?.id) === id)
                : sel && (sel?.injuryId ?? sel?.id) === id;

              return (
                <Pressable
                  key={id}
                  onPress={() => selectInjury(inj)}
                  className={`p-4 rounded-xl mb-3 border ${
                    isSelected
                      ? 'bg-foreground/10 border-foreground'
                      : 'bg-white border-background-sub2'
                  }`}
                >
                  <Text className="text-base text-foreground font-medium">
                    {inj.name}
                  </Text>

                  <Text className="text-sm text-secondaryText mt-1">
                    {inj.description}
                  </Text>
                </Pressable>
              );
            })}

            <View className="mt-6 mb-8">
              <Text className="text-sm text-secondaryText mb-2">
                Ghi chú nếu muốn
              </Text>

              <TextInput
                value={notes}
                onChangeText={setNotes}
                className="min-h-[72px] px-4 py-3 rounded-xl bg-white text-foreground border border-background-sub2"
                placeholder="Mô tả ngắn về chấn thương"
                placeholderTextColor="#9CA3AF"
                multiline
                textAlignVertical="top"
              />
            </View>
          </ScrollView>
        )}
      </View>

      <View className="absolute left-0 right-0 bottom-0 px-6 pb-6 pt-3 bg-background">
        <View className="w-full bg-white rounded-2xl p-4 border border-background-sub2 shadow-lg">
          <Pressable
            onPress={canContinue ? onNext : undefined}
            disabled={!canContinue}
            className={`h-14 rounded-xl items-center justify-center mb-3 ${
              canContinue ? 'bg-foreground' : 'bg-gray-300'
            }`}
          >
            <Text
              className={`font-semibold text-base ${
                canContinue ? 'text-white' : 'text-gray-500'
              }`}
            >
              Lưu & Tiếp tục
            </Text>
          </Pressable>

          <Pressable
            onPress={onSkip}
            className="h-14 rounded-xl items-center justify-center border border-background-sub2 bg-white"
          >
            <Text className="text-foreground font-semibold text-base">
              Bỏ qua
            </Text>
          </Pressable>
        </View>
      </View>

      <Toast
        visible={toastVisible}
        message={toastMsg}
        type={toastType}
        onHidden={() => setToastVisible(false)}
      />

      <ModalPopup
        visible={modalVisible}
        mode="noti"
        titleText={modalTitle}
        contentText={modalMessage}
        iconName={modalIconName}
        iconBgColor={modalIconBg as any}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}