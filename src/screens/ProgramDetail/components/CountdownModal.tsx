import { View, Text, Modal } from 'react-native';
import { useEffect, useState } from 'react';

type Props = {
  visible: boolean;
  duration?: number; // default 5s
  onFinish?: () => void;
};

const CountdownModal = ({ visible, duration = 5, onFinish }: Props) => {
  const [count, setCount] = useState(duration);

  useEffect(() => {
    if (!visible) return;

    setCount(duration); // reset mỗi lần mở

    const interval = setInterval(() => {
      setCount(prev => {
        if (prev === 1) {
          clearInterval(interval);
          setTimeout(() => {
            onFinish?.();
          }, 1000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [visible]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
    >
      <View className="flex-1 justify-center items-center">
        <View className="absolute inset-0 bg-black/40" />

        <View className="bg-background rounded-3xl p-6 items-center">
          <Text className="text-4xl font-bold text-foreground">{count}</Text>
          <Text className="text-secondaryText mt-2">Bắt đầu sau...</Text>
        </View>
      </View>
    </Modal>
  );
};

export default CountdownModal;
