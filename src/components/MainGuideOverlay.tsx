import React, { useEffect, useState } from 'react';
import { View, Text, Modal, Pressable, StyleSheet } from 'react-native';
import { ACTIONS } from '../screens/Home/components/QuickActions';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Simple spotlight overlay: focuses each action by rendering an absolute box with description.
// This is intentionally minimal and uses measured refs to position overlays.

export default function MainGuideOverlay({ targetRefs, measures: externalMeasures }: { targetRefs: Record<string, React.RefObject<any>>; measures?: Record<string, any> }) {
  const [visible, setVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const measures = externalMeasures ?? {};

  useEffect(() => {
    (async () => {
      const seen = await AsyncStorage.getItem('hasSeenMainGuide');
      if (seen) return; // only show once
      // delay to allow screen layout
      setTimeout(() => setVisible(true), 500);
    })();
  }, []);

  if (!visible) return null;

  const item = ACTIONS[currentIndex];
  const pos = measures[item.id] ?? { x: 20, y: 200, width: 150, height: 60 };

  const onNext = async () => {
    if (currentIndex + 1 >= ACTIONS.length) {
      setVisible(false);
      await AsyncStorage.setItem('hasSeenMainGuide', '1');
      return;
    }
    setCurrentIndex(currentIndex + 1);
  };

  const onSkip = async () => {
    setVisible(false);
    await AsyncStorage.setItem('hasSeenMainGuide', '1');
  };

  return (
    <Modal transparent visible animationType="fade">
      <View style={styles.backdrop}>
        {/* spotlight box */}
        <View style={[styles.spotlight, { left: pos.x - 8, top: pos.y - 8, width: pos.width + 16, height: pos.height + 16 }]} />

        {/* description */}
        <View style={styles.descriptionWrap}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.desc}>{getDescriptionFor(item.id)}</Text>

          <View style={styles.row}>
            <Pressable onPress={onSkip} style={styles.skipBtn}>
              <Text style={styles.skipText}>Bỏ qua</Text>
            </Pressable>
            <Pressable onPress={onNext} style={styles.nextBtn}>
              <Text style={styles.nextText}>{currentIndex + 1 >= ACTIONS.length ? 'Xong' : 'Tiếp theo'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function getDescriptionFor(id: string) {
  switch (id) {
    case 'roadmap':
      return 'Tạo lộ trình tập cá nhân hoá dựa trên mục tiêu của bạn.';
    case 'ai':
      return 'Đăng ký gói AI để nhận huấn luyện viên ảo và phân tích tự động.';
    case 'calendar':
      return 'Đặt lịch tập và đồng bộ lịch trình hàng tuần.';
    case 'video':
      return 'Học với huấn luyện viên thông qua video call.';
    default:
      return '';
  }
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  spotlight: { position: 'absolute', borderRadius: 12, borderWidth: 2, borderColor: '#fff' },
  descriptionWrap: { position: 'absolute', left: 20, right: 20, bottom: 80 },
  title: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 8 },
  desc: { color: '#fff', marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  skipBtn: { padding: 12 },
  skipText: { color: '#fff' },
  nextBtn: { padding: 12, backgroundColor: '#fff', borderRadius: 8 },
  nextText: { color: '#000' },
});
