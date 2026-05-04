import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ACTIONS } from '../screens/Home/components/QuickActions';

type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type Props = {
  targetRefs: Record<string, React.RefObject<any>>;
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function MainGuideOverlay({ targetRefs }: Props) {
  const [visible, setVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<Rect | null>(null);

  const item = ACTIONS[currentIndex];

  const measureCurrentTarget = useCallback(() => {
    const ref = targetRefs[item.id];

    if (!ref?.current) {
      setTargetRect(null);
      return;
    }

    requestAnimationFrame(() => {
      ref.current?.measureInWindow(
        (x: number, y: number, width: number, height: number) => {
          const androidStatusOffset =
            Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;

          setTargetRect({
            x,
            y: y + androidStatusOffset,
            width,
            height,
          });
        },
      );
    });
  }, [item.id, targetRefs]);

  useEffect(() => {
    const checkGuide = async () => {
      const seen = await AsyncStorage.getItem('hasSeenMainGuide');

      if (seen) return;

      setTimeout(() => {
        setVisible(true);
      }, 800);
    };

    checkGuide();
  }, []);

  useEffect(() => {
    if (!visible) return;

    const timer = setTimeout(() => {
      measureCurrentTarget();
    }, 300);

    return () => clearTimeout(timer);
  }, [visible, currentIndex, measureCurrentTarget]);

  if (!visible) return null;

  const padding = 8;

  const pos = targetRect ?? {
    x: 20,
    y: 200,
    width: SCREEN_WIDTH - 40,
    height: 70,
  };

  const spotlightLeft = Math.max(12, pos.x - padding);
  const spotlightTop = Math.max(12, pos.y - padding);
  const spotlightWidth = Math.min(SCREEN_WIDTH - 24, pos.width + padding * 2);
  const spotlightHeight = pos.height + padding * 2;

  const descriptionTop =
    spotlightTop + spotlightHeight + 20 > SCREEN_HEIGHT - 190
      ? Math.max(80, spotlightTop - 180)
      : spotlightTop + spotlightHeight + 20;

  const onNext = async () => {
    if (currentIndex + 1 >= ACTIONS.length) {
      setVisible(false);
      await AsyncStorage.setItem('hasSeenMainGuide', '1');
      return;
    }

    setCurrentIndex(prev => prev + 1);
  };

  const onSkip = async () => {
    setVisible(false);
    await AsyncStorage.setItem('hasSeenMainGuide', '1');
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <View
          pointerEvents="none"
          style={[
            styles.spotlight,
            {
              left: spotlightLeft,
              top: spotlightTop,
              width: spotlightWidth,
              height: spotlightHeight,
            },
          ]}
        />

        <View
          style={[
            styles.descriptionWrap,
            {
              top: descriptionTop,
            },
          ]}
        >
          <Text style={styles.stepText}>
            {currentIndex + 1}/{ACTIONS.length}
          </Text>

          <Text style={styles.title}>{item.title}</Text>

          <Text style={styles.desc}>{getDescriptionFor(item.id)}</Text>

          <View style={styles.row}>
            <Pressable onPress={onSkip} style={styles.skipBtn}>
              <Text style={styles.skipText}>Bỏ qua</Text>
            </Pressable>

            <Pressable onPress={onNext} style={styles.nextBtn}>
              <Text style={styles.nextText}>
                {currentIndex + 1 >= ACTIONS.length ? 'Xong' : 'Tiếp theo'}
              </Text>
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
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.62)',
  },

  spotlight: {
    position: 'absolute',
    borderRadius: 22,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    backgroundColor: 'transparent',
  },

  descriptionWrap: {
    position: 'absolute',
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.82)',
  },

  stepText: {
    color: '#FDE68A',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },

  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },

  desc: {
    color: '#F3F4F6',
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 18,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  skipBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },

  skipText: {
    color: '#FFFFFF',
    fontSize: 16,
  },

  nextBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },

  nextText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '800',
  },
});