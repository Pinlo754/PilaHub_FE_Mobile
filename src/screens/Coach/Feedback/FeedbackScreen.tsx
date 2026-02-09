import { Text, View } from 'react-native';
import FeedbackItem from './components/FeedbackItem';
import Header from '../components/Header';

const FeedbackScreen = () => {
    return (
        <View className="flex-1 bg-background">
            <Header />

            <Text className="text-2xl font-bold text-[#8B5E3C] ml-4 mt-4 mb-2">
                Phản hồi từ học viên
            </Text>
            <FeedbackItem
                userName="KaiB"
                userImage="https://randomuser.me/api/portraits/men/1.jpg"
                rating={5}
                feedbackContent="Giảng viên này dạy rất hay, chỉnh sửa lỗi rất tận tâm"
                date='22 Jul'
            />

            <FeedbackItem
                userName="KaiB"
                userImage="https://randomuser.me/api/portraits/men/1.jpg"
                rating={4}
                feedbackContent="Bài giảng chi tiết nhưng cần nói chậm hơn một chút ở phần thực hành."
                date='20 Jul'
            />
        </View>
    );
}
export default FeedbackScreen;