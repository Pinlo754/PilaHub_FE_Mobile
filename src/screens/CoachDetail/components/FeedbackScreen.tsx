import Ionicons from '@react-native-vector-icons/ionicons';
import { useState } from 'react';
import { FlatList, Modal, Pressable, Text, View } from 'react-native';
import { colors } from '../../../theme/colors';
import { CoachFeedbackType } from '../../../utils/CoachFeedbackType';
import CardFeedback from './CardFeedback';
import StarRating from './StarRating';

type Props = {
  visible: boolean;
  onClose: () => void;
  feedbackData: CoachFeedbackType[];
};

const FILTER_OPTIONS = [
  { label: 'Tất cả', value: 0 },
  { label: '5', value: 5 },
  { label: '4', value: 4 },
  { label: '3', value: 3 },
  { label: '2', value: 2 },
  { label: '1', value: 1 },
];

const FeedbackScreen = ({ visible, onClose, feedbackData }: Props) => {
  const [selectedRating, setSelectedRating] = useState(0);

  const filtered =
    selectedRating === 0
      ? feedbackData
      : feedbackData.filter(f => f.rating === selectedRating);

  const avgRating =
    feedbackData.length > 0
      ? feedbackData.reduce((acc, f) => acc + f.rating, 0) / feedbackData.length
      : 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
    >
      <View className="flex-1 justify-end bg-black/40">
        <View className="h-[85%] rounded-t-3xl overflow-hidden bg-background">
          {/* Header */}
          <View className="bg-background-sub1 py-5">
            <Text className="font-semibold color-foreground text-2xl text-center">
              Đánh giá
            </Text>

            <Pressable
              onPress={onClose}
              className="absolute right-3 top-3 z-10"
            >
              <Ionicons
                name="close-outline"
                size={26}
                color={colors.inactive[80]}
              />
            </Pressable>
          </View>

          {/* Summary */}
          <View className="flex-row items-center gap-3 px-4 py-4 border-b border-background-sub1">
            <Text className="text-5xl font-bold color-foreground">
              {avgRating.toFixed(1)}
            </Text>
            <View className="gap-1">
              <StarRating rating={Math.round(avgRating)} size={16} />
              <Text className="color-secondaryText text-sm">
                {feedbackData.length} đánh giá
              </Text>
            </View>
          </View>

          {/* Filter Chips */}
          <View className="flex-row gap-2 px-4 py-3 flex-wrap border-b border-background-sub1">
            {FILTER_OPTIONS.map(opt => (
              <Pressable
                key={opt.value}
                onPress={() => setSelectedRating(opt.value)}
                className={`px-3 py-1 rounded-full border flex-row items-center gap-1 ${
                  selectedRating === opt.value
                    ? 'bg-foreground border-foreground'
                    : 'bg-background border-background-sub1'
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    selectedRating === opt.value
                      ? 'color-background'
                      : 'color-secondaryText'
                  }`}
                >
                  {opt.label}
                </Text>
                {opt.value !== 0 && (
                  <Ionicons
                    name="star"
                    size={14}
                    color={colors.warning.DEFAULT}
                  />
                )}
              </Pressable>
            ))}
          </View>

          {/* List */}
          {filtered.length === 0 ? (
            <View className="flex-1 items-center justify-center gap-2">
              <Ionicons
                name="alert-circle-outline"
                size={40}
                color={colors.inactive[50]}
              />
              <Text className="color-secondaryText font-medium">
                Không có đánh giá nào.
              </Text>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={item => item.feedbackId}
              renderItem={({ item }) => <CardFeedback item={item} />}
              contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

export default FeedbackScreen;
