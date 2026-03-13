import Ionicons from '@react-native-vector-icons/ionicons';
import { Pressable, Text, View } from 'react-native';
import { colors } from '../../../theme/colors';
import CardFeedback from './CardFeedback';
import { FeedbackType } from '../../../utils/CoachType';

const FeedbackSection = () => {
  // CONSTANT
  const PREVIEW_COUNT = 3;

  // MOCK DATA (sau này thay bằng API)
  const feedbackData: FeedbackType[] = [
    {
      feedbackId: '1',
      coachId: '1',
      coachFullName: 'John Smith',
      traineeId: '101',
      traineeFullName: 'Nguyen Van A',
      img_url:
        'https://www.toponseek.com/wp-content/uploads/2024/07/celeb-la-gi-6.jpg',
      rating: 4.5,
      createdAt: '17:21 12/08/2023',
      comment:
        'Huấn luyện viên rất chuyên nghiệp và tận tâm. Tôi đã cải thiện kỹ thuật của mình rất nhiều.',
    },
    {
      feedbackId: '2',
      coachId: '1',
      coachFullName: 'John Smith',
      traineeId: '102',
      traineeFullName: 'Tran Thi B',
      img_url:
        'https://www.toponseek.com/wp-content/uploads/2024/07/celeb-la-gi-6.jpg',
      rating: 5,
      createdAt: '10:15 10/08/2023',
      comment:
        'Tôi rất hài lòng với các buổi tập cùng huấn luyện viên. Cô ấy luôn tạo động lực cho tôi.',
    },
    {
      feedbackId: '3',
      coachId: '1',
      coachFullName: 'John Smith',
      traineeId: '103',
      traineeFullName: 'Le Van C',
      img_url:
        'https://www.toponseek.com/wp-content/uploads/2024/07/celeb-la-gi-6.jpg',
      rating: 4,
      createdAt: '09:30 08/08/2023',
      comment:
        'Buổi tập rất hiệu quả và thú vị. Tôi cảm thấy mình tiến bộ rõ rệt.',
    },
    {
      feedbackId: '4',
      coachId: '1',
      coachFullName: 'John Smith',
      traineeId: '104',
      traineeFullName: 'Pham Thi D',
      img_url:
        'https://www.toponseek.com/wp-content/uploads/2024/07/celeb-la-gi-6.jpg',
      rating: 5,
      createdAt: '14:45 05/08/2023',
      comment:
        'Huấn luyện viên rất kiên nhẫn và hiểu biết sâu rộng về Pilates.',
    },
    {
      feedbackId: '5',
      coachId: '1',
      coachFullName: 'John Smith',
      traineeId: '105',
      traineeFullName: 'Hoang Van E',
      img_url:
        'https://www.toponseek.com/wp-content/uploads/2024/07/celeb-la-gi-6.jpg',
      rating: 4.5,
      createdAt: '11:20 01/08/2023',
      comment:
        'Các bài tập được thiết kế phù hợp với nhu cầu của tôi. Rất tuyệt vời!',
    },
  ];

  return (
    <View className="w-full mt-4">

      {/* Header */}
      <Pressable className="flex-row items-center gap-2 mb-2">
        <Text className="text-lg font-semibold color-foreground">
          Đánh giá
        </Text>

        <Ionicons
          name="chevron-forward-outline"
          size={20}
          color={colors.foreground}
        />
      </Pressable>

      {/* Feedback list */}
      <View className="gap-3">
        {feedbackData.slice(0, PREVIEW_COUNT).map(item => (
          <CardFeedback
            key={item.feedbackId}
            item={item}
          />
        ))}
      </View>

    </View>
  );
};

export default FeedbackSection;