import React from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useTargetLogic } from './Target.logic';

export default function TargetUI() {
  const {
    targets,
    loading,
    selected,
    toggleTarget,
    onFinish,
    onBack,
    allowMulti,
  } = useTargetLogic();

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
        {allowMulti
          ? 'Chọn một hoặc nhiều mục tiêu chính của bạn. Chúng tôi sẽ dùng các mục tiêu này để đề xuất chương trình và bài tập phù hợp.'
          : 'Chọn mục tiêu chính để hệ thống ưu tiên lộ trình và bài tập phù hợp.'}
      </Text>

      {/* TARGET LIST */}
      <ScrollView
        className="mt-10"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        <View className=" items-center ">
          {loading ? (
            <ActivityIndicator size="large" color="#CD853F" />
          ) : (
            targets.map((item) => {
              const isActive = selected.includes(item.key);

              return (
                <Pressable
                  key={item.key}
                  onPress={() => toggleTarget(item.key)}
                  className={`flex-row items-center p-4 w-full max-w-[420px] mb-4 rounded-xl border shadow-sm  ${
                    isActive
                      ? 'bg-warning/20 border-warning'
                      : 'bg-white border-background-sub2 '
                  }`}
                >
                  {/* ICON */}
                  <Text className="text-2xl mr-4">{item.icon ?? '🏁'}</Text>

                  {/* TEXT */}
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-foreground">
                      {item.title}
                    </Text>
                    <Text className="text-sm text-secondaryText">
                      {item.description}
                    </Text>
                  </View>

                  {/* CHECK */}
                  {isActive && (
                    <Text className="text-warning text-xl">✓</Text>
                  )}
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* CONTINUE */}
      <View className="mt-6 mb-6 px-6 w-full">
        <Pressable
          onPress={onFinish}
          disabled={selected.length === 0}
          className={`h-14 rounded-xl items-center justify-center ${
            selected.length
              ? 'bg-foreground'
              : 'bg-foreground/40'
          }`}
        >
          <Text className="text-white font-semibold text-base">
            Hoàn tất
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { paddingBottom: 20 },
});
