import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTargetLogic } from './Target.logic';

export default function TargetUI() {
  const {
    targets,
    loading,
    primarySelected,
    secondarySelected,
    togglePrimary,
    toggleSecondary,
    onFinish,
    onBack,
  } = useTargetLogic();

  const [openPrimary, setOpenPrimary] = useState(false);
  const [openSecondary, setOpenSecondary] = useState(false);

  const findTitle = (key: string) => {
    const f = targets.find((t) => t.key === key);
    return f ? f.title : key;
  };

  const availableForPrimary = targets.filter((t) => !secondarySelected.includes(t.key));
  const availableForSecondary = targets.filter((t) => t.key !== primarySelected && !secondarySelected.includes(t.key));

  return (
    <View className="flex-1 bg-background w-full">
      {/* BACK */}
      <Pressable onPress={onBack} className="mb-6 ">
        <Text className="text-secondaryText text-base">← Quay lại</Text>
      </Pressable>

      {/* TITLE */}
      <Text className="text-xl font-semibold text-foreground text-center">
        Mục Tiêu Của Bạn?
      </Text>

      <Text className="text-sm text-secondaryText text-center mt-2 px-6">
        Chọn một mục tiêu chính và các mục tiêu phụ (nếu cần).
      </Text>

      {/* SELECTORS */}
      <ScrollView
        className="mt-6 px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#CD853F" />
        ) : (
          <View>
            {/* Primary selector */}
            <Text className="text-sm text-secondaryText mb-2">Mục tiêu chính</Text>
            <TouchableOpacity
              onPress={() => setOpenPrimary((s) => !s)}
              className={`w-full bg-white border rounded-xl p-3 mb-4 ${primarySelected ? 'border-foreground' : 'border-gray-200'}`}
            >
              <Text className={`${primarySelected ? 'text-foreground font-semibold' : 'text-secondaryText'}`}>
                {primarySelected ? findTitle(primarySelected) : 'Chọn mục tiêu chính'}
              </Text>
            </TouchableOpacity>

            {openPrimary && (
              <View style={styles.dropdownContainer} className="bg-white rounded-xl border border-gray-200 p-2 mb-4">
                <ScrollView nestedScrollEnabled style={styles.dropdown} contentContainerStyle={styles.dropdownContent}>
                  {availableForPrimary.map((t) => (
                    <Pressable
                      key={t.key}
                      onPress={() => {
                        togglePrimary(t.key);
                        setOpenPrimary(false);
                      }}
                      className="p-3 border-b border-gray-100"
                    >
                      <Text className="font-medium">{t.title}</Text>
                      <Text className="text-xs text-secondaryText">{t.description}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
                {availableForPrimary.length === 0 && (
                  <Text className="text-xs text-secondaryText p-3">Không còn lựa chọn</Text>
                )}
              </View>
            )}

            {/* Secondary selector */}
            <Text className="text-sm text-secondaryText mb-2">Mục tiêu phụ (có thể chọn nhiều)</Text>

            {/* chips */}
            <View className="flex-row flex-wrap mb-3">
              {secondarySelected.length > 0 ? (
                secondarySelected.map((key) => (
                  <View key={key} className="flex-row items-center bg-gray-100 px-3 py-1 mr-2 mb-2 rounded-full border border-gray-200">
                    <Text className="mr-2">{findTitle(key)}</Text>
                    <Pressable onPress={() => toggleSecondary(key)} className="px-1">
                      <Text className="text-sm text-secondaryText">✕</Text>
                    </Pressable>
                  </View>
                ))
              ) : (
                <Text className="text-xs text-secondaryText">Chưa có mục tiêu phụ</Text>
              )}
            </View>

            <TouchableOpacity
              onPress={() => setOpenSecondary((s) => !s)}
              className="w-full bg-white border border-gray-200 rounded-xl p-3 mb-4"
            >
              <Text className="text-secondaryText">Thêm mục tiêu phụ</Text>
            </TouchableOpacity>

            {openSecondary && (
              <View style={styles.dropdownContainer} className="bg-white rounded-xl border border-gray-200 p-2 mb-4">
                <ScrollView nestedScrollEnabled style={styles.dropdown} contentContainerStyle={styles.dropdownContent}>
                  {availableForSecondary.map((t) => (
                    <Pressable
                      key={t.key}
                      onPress={() => {
                        toggleSecondary(t.key);
                      }}
                      className="p-3 border-b border-gray-100"
                    >
                      <Text className="font-medium">{t.title}</Text>
                      <Text className="text-xs text-secondaryText">{t.description}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
                {availableForSecondary.length === 0 && (
                  <Text className="text-xs text-secondaryText p-3">Không còn lựa chọn</Text>
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* CONTINUE */}
      <View className="mt-6 mb-6 px-6 w-full">
        <Pressable
          onPress={onFinish}
          disabled={!primarySelected}
          className={`h-14 rounded-xl items-center justify-center ${
            primarySelected ? 'bg-foreground' : 'bg-foreground/40'
          }`}
        >
          <Text className="text-white font-semibold text-base">Hoàn tất</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { paddingBottom: 20 },
  dropdownContainer: { overflow: 'hidden' },
  dropdown: { maxHeight: 240 },
  dropdownContent: { paddingBottom: 8 },
});
