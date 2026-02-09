import Ionicons from '@react-native-vector-icons/ionicons';
import { Pressable, Text, View } from 'react-native';
import { colors } from '../../../theme/colors';
import CardFeedback from './CardFeedback';
import { FeedbackType } from '../../../utils/CoachType';

const FeedbackSection = () => {
  // CONSTANTS
  const PREVIEW_COUNT = 3;

  // DATA
  const feedbackData: FeedbackType[] = [
    {
      id: '1',
      user_name: 'Nguyen Van A',
      img_url:
        'https://www.toponseek.com/wp-content/uploads/2024/07/celeb-la-gi-6.jpg',
      rating: 4.5,
      date: '17:21 12/08/2023',
      comment:
        'Huấn luyện viên rất chuyên nghiệp và tận tâm. Tôi đã cải thiện kỹ thuật của mình rất nhiều.',
    },
    {
      id: '2',
      user_name: 'Tran Thi B',
      img_url:
        'https://www.toponseek.com/wp-content/uploads/2024/07/celeb-la-gi-6.jpg',
      rating: 5,
      date: '10:15 10/08/2023',
      comment:
        'Tôi rất hài lòng với các buổi tập cùng huấn luyện viên. Cô ấy luôn tạo động lực cho tôi.',
    },
    {
      id: '3',
      user_name: 'Le Van C',
      img_url:
        'https://www.toponseek.com/wp-content/uploads/2024/07/celeb-la-gi-6.jpg',
      rating: 4,
      date: '09:30 08/08/2023',
      comment:
        'Buổi tập rất hiệu quả và thú vị. Tôi cảm thấy mình tiến bộ rõ rệt.',
    },
    {
      id: '4',
      user_name: 'Pham Thi D',
      img_url:
        'https://www.toponseek.com/wp-content/uploads/2024/07/celeb-la-gi-6.jpg',
      rating: 5,
      date: '14:45 05/08/2023',
      comment:
        'Huấn luyện viên rất kiên nhẫn và hiểu biết sâu rộng về Pilates.',
    },
    {
      id: '5',
      user_name: 'Hoang Van E',
      img_url:
        'https://www.toponseek.com/wp-content/uploads/2024/07/celeb-la-gi-6.jpg',
      rating: 4.5,
      date: '11:20 01/08/2023',
      comment:
        'Các bài tập được thiết kế phù hợp với nhu cầu của tôi. Rất tuyệt vời!',
    },
  ];

  return (
    <View className="w-full">
      {/* Header */}
      <Pressable className="flex-row items-center gap-2">
        <Text className="color-foreground text-lg font-semibold">Đánh giá</Text>
        <Ionicons
          name="chevron-forward-outline"
          size={20}
          color={colors.foreground}
        />
      </Pressable>
      {/* Feedback List */}
      {feedbackData.slice(0, PREVIEW_COUNT).map(item => (
        <CardFeedback item={item} key={item.id} />
      ))}
    </View>
  );
};

export default FeedbackSection;
