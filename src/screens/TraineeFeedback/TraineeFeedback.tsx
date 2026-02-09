import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Text, View } from 'react-native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import InfoSection from './components/InfoSection';
import RateSection from './components/RateSection';
import CommentSection from './components/CommentSection';
import Button from '../../components/Button';
import { useTraineeFeedback } from './useTraineeFeedback';
import ModalPopup from '../../components/ModalPopup';

type Props = NativeStackScreenProps<RootStackParamList, 'TraineeFeedback'>;

const TraineeFeedback = (props: Props) => {
  // HOOK
  const {
    info,
    onPressSubmit,
    showSuccessModal,
    successMsg,
    closeSuccessModal,
    rating,
    setRating,
    comment,
    setComment,
    isValid,
  } = useTraineeFeedback({
    navigation: props.navigation,
  });

  return (
    <View className="flex-1 bg-background-sub1 pt-14">
      {/* Header */}
      <Text className="color-foreground text-3xl font-bold text-center">
        Đánh giá
      </Text>

      <View className="flex-1 mt-2 rounded-t-2xl bg-background overflow-hidden">
        {/* Title */}
        <Text className="mt-6 mb-6 color-foreground text-3xl font-bold text-center">
          Bạn cảm giác thế nào?
        </Text>

        {/* Info Section */}
        <InfoSection info={info} />

        {/* Rate Section */}
        <RateSection rating={rating} onChange={setRating} />

        {/* Comment Section */}
        <CommentSection comment={comment} onChange={setComment} />

        {/* Btn */}
        <View className="self-end pt-2 px-4">
          <Button
            text="Đánh giá"
            onPress={onPressSubmit}
            colorType={isValid ? 'sub1' : 'grey'}
            rounded="lg"
            width={100}
            disabled={!isValid}
          />
        </View>
      </View>

      {/* Success Modal */}
      <ModalPopup
        visible={showSuccessModal}
        mode="toast"
        contentText={successMsg}
        iconName="checkmark"
        iconSize={35}
        iconBgColor="green"
        onClose={closeSuccessModal}
        modalWidth={355}
      />
    </View>
  );
};

export default TraineeFeedback;
