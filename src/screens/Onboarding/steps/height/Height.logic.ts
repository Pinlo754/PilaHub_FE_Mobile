import { useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';
import { useOnboardingStore } from '../../../../store/onboarding.store';

export const ITEM_HEIGHT = 64;
export const CM_MIN = 120;
export const CM_MAX = 240;
const DEFAULT_HEIGHT = 170;

export const HEIGHTS = Array.from(
  { length: CM_MAX - CM_MIN + 1 },
  (_, i) => CM_MIN + i,
);

const clamp = (value: number, min: number, max: number) => {
  return Math.max(min, Math.min(max, value));
};

export const useHeightLogic = () => {
  const { data, setData, step, setStep } = useOnboardingStore();

  const scrollY = useRef(new Animated.Value(0)).current;
  const listRef = useRef<Animated.FlatList<number> | null>(null);

  const getIndexFromHeight = (height?: number) => {
    const value =
      typeof height === 'number' && !isNaN(height)
        ? height
        : DEFAULT_HEIGHT;

    const safeHeight = clamp(Math.round(value), CM_MIN, CM_MAX);
    return safeHeight - CM_MIN;
  };

  const initialIndex = getIndexFromHeight(data.height);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const currentHeight = HEIGHTS[currentIndex] ?? DEFAULT_HEIGHT;

  const getItemLayout = (_: any, index: number) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  });

  /**
   * Khi vào lại màn Height:
   * - lấy height từ store
   * - set currentIndex
   * - scroll ruler về đúng vị trí
   *
   * Không dùng scrollToIndex + viewPosition nữa vì dễ lệch với paddingVertical.
   */
  useEffect(() => {
    const index = getIndexFromHeight(data.height);
    const offset = index * ITEM_HEIGHT;

    setCurrentIndex(index);
    scrollY.setValue(offset);

    const timer = setTimeout(() => {
      try {
        listRef.current?.scrollToOffset({
          offset,
          animated: false,
        });
      } catch {}
    }, 80);

    return () => clearTimeout(timer);
  }, [data.height, scrollY]);

  /**
   * Chỉ update số khi scroll.
   * Không setData ở đây để tránh render lại liên tục.
   */
  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        const rawIndex = Math.round(offsetY / ITEM_HEIGHT);
        const safeIndex = clamp(rawIndex, 0, HEIGHTS.length - 1);

        setCurrentIndex(safeIndex);
      },
    },
  );

  /**
   * Khi thả tay thì lưu height vào store.
   * Không gọi scrollToOffset animated ở đây nữa.
   * Vì FlatList đã có snapToInterval rồi.
   */
  const onMomentumEnd = (e: any) => {
    const offsetY = e.nativeEvent.contentOffset.y;
    const rawIndex = Math.round(offsetY / ITEM_HEIGHT);
    const safeIndex = clamp(rawIndex, 0, HEIGHTS.length - 1);

    setCurrentIndex(safeIndex);
    setData({
      height: HEIGHTS[safeIndex],
      heightUnit: 'cm',
    });
  };

  const onNext = () => {
    setData({
      height: currentHeight,
      heightUnit: 'cm',
    });

    setStep(step + 1);
  };

  const onBack = () => {
    if (step > 0) {
      setData({
        height: currentHeight,
        heightUnit: 'cm',
      });

      setStep(step - 1);
    }
  };

  const canContinue =
    typeof currentHeight === 'number' && !isNaN(currentHeight);

  return {
    HEIGHTS,
    ITEM_HEIGHT,
    scrollY,
    listRef,
    currentHeight,
    currentIndex,
    onScroll,
    onMomentumEnd,
    onNext,
    onBack,
    getItemLayout,
    initialIndex,
    canContinue,
  };
};