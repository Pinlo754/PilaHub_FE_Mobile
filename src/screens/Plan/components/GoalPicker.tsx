import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { fetchFitnessGoals } from '../../../services/profile';

type GoalItem = { id: string; vietnameseName?: string; name?: string; description?: string; icon?: string };

type Props = {
  initialPrimaryId?: string | null;
  initialSecondaryIds?: string[];
  initialOpenPrimary?: boolean;
  initialOpenSecondary?: boolean;
  onChange?: (primary?: string | null, secondary?: string[]) => void;
};

export default function GoalPicker({ initialPrimaryId, initialSecondaryIds = [], initialOpenPrimary = false, initialOpenSecondary = false, onChange }: Props) {
  const [targets, setTargets] = useState<GoalItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [primarySelected, setPrimarySelected] = useState<string | undefined>(initialPrimaryId ?? undefined);
  const [secondarySelected, setSecondarySelected] = useState<string[]>(initialSecondaryIds ?? []);
  const [openPrimary, setOpenPrimary] = useState<boolean>(Boolean(initialOpenPrimary));
  const [openSecondary, setOpenSecondary] = useState<boolean>(Boolean(initialOpenSecondary));

  // Ensure primary selection is removed from secondary list to avoid duplicates
  useEffect(() => {
    if (primarySelected && secondarySelected.includes(primarySelected)) {
      setSecondarySelected(prev => prev.filter(k => k !== primarySelected));
    }
  }, [primarySelected, secondarySelected]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res: any = await fetchFitnessGoals();
        const list = (res && res.data) ? res.data : (res && res.ok && res.result ? res.result : res);
        const arr = Array.isArray(list) ? list : [];
        const mapped = arr.map((g: any) => ({
          id: g.id ?? g.goalId ?? String(g._id ?? ''),
          vietnameseName: g.vietnameseName ?? g.name ?? null,
          name: g.name ?? g.vietnameseName ?? null,
          description: g.description ?? '',
          icon: g.icon ?? '🏁',
        }));
        if (!mounted) return;
        setTargets(mapped);
      } catch {
        setTargets([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (onChange) onChange(primarySelected ?? null, secondarySelected);
  }, [primarySelected, secondarySelected, onChange]);

  const findTitle = (key: string) => {
    const f = targets.find((t) => t.id === key);
    return f ? (f.vietnameseName ?? f.name ?? key) : key;
  };

  const availableForPrimary = targets.filter((t) => !secondarySelected.includes(t.id));
  const availableForSecondary = targets.filter((t) => t.id !== primarySelected && !secondarySelected.includes(t.id));

  return (
    <View>
      {loading ? (
        <ActivityIndicator />
      ) : (
        <>
          <Text className="font-semibold">Mục tiêu chính</Text>
          <TouchableOpacity onPress={() => setOpenPrimary(s => !s)} className={`w-full bg-white border rounded-xl p-3 mb-4 ${primarySelected ? 'border-foreground' : 'border-gray-200'}`}>
            <Text className={`${primarySelected ? 'text-foreground font-semibold' : 'text-secondaryText'}`}>
              {primarySelected ? findTitle(primarySelected) : 'Chọn mục tiêu chính (bắt buộc)'}
            </Text>
          </TouchableOpacity>

          {openPrimary && (
            <View style={styles.dropdownContainer} className="bg-white rounded-xl border border-gray-200 p-2 mb-4">
              <ScrollView nestedScrollEnabled style={styles.dropdown} contentContainerStyle={styles.dropdownContent}>
                {availableForPrimary.map((t) => (
                  <Pressable key={t.id} onPress={() => { setPrimarySelected(t.id); setOpenPrimary(false); }} className="p-3 border-b border-gray-100">
                    <Text className="font-medium">{t.vietnameseName ?? t.name}</Text>
                    <Text className="text-xs text-secondaryText">{t.description}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          <Text className="font-semibold mt-2">Mục tiêu phụ</Text>
          <View className="flex-row flex-wrap mt-2">
            {secondarySelected.length > 0 ? (
              secondarySelected.map((key) => (
                <View key={key} className="flex-row items-center bg-gray-100 px-3 py-1 mr-2 mb-2 rounded-full border border-gray-200">
                  <Text className="mr-2">{findTitle(key)}</Text>
                  <Pressable onPress={() => setSecondarySelected(prev => prev.filter(k => k !== key))} className="px-1">
                    <Text className="text-sm text-secondaryText">✕</Text>
                  </Pressable>
                </View>
              ))
            ) : (
              <Text className="text-xs text-secondaryText">Chưa có mục tiêu phụ</Text>
            )}
            {secondarySelected.length >= 4 && (
              <View className="w-full mt-2">
                <Text className="text-xs text-red-600">Bạn chỉ có thể chọn tối đa 4 mục tiêu phụ</Text>
              </View>
            )}
          </View>

          <TouchableOpacity onPress={() => setOpenSecondary(s => !s)} className="w-full bg-white border border-gray-200 rounded-xl p-3 mt-3 mb-2">
            <Text className="text-secondaryText">Thêm mục tiêu phụ</Text>
          </TouchableOpacity>

          {openSecondary && (
            <View style={styles.dropdownContainer} className="bg-white rounded-xl border border-gray-200 p-2 mb-4">
              <ScrollView nestedScrollEnabled style={styles.dropdown} contentContainerStyle={styles.dropdownContent}>
                {availableForSecondary.map((t) => (
                  <Pressable key={t.id} onPress={() => {
                    setSecondarySelected(prev => {
                      if (prev.includes(t.id)) return prev.filter(k => k !== t.id);
                      if (prev.length >= 4) return prev; // enforce max 4
                      return [...prev, t.id];
                    });
                  }} className="p-3 border-b border-gray-100">
                    <Text className="font-medium">{t.vietnameseName ?? t.name}</Text>
                    <Text className="text-xs text-secondaryText">{t.description}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  dropdownContainer: { overflow: 'hidden' },
  dropdown: { maxHeight: 240 },
  dropdownContent: { paddingBottom: 8 },
});
