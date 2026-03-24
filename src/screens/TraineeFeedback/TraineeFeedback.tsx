import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, Text, View } from 'react-native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import InfoSection from './components/InfoSection';
import RateSection from './components/RateSection';
import CommentSection from './components/CommentSection';
import Button from '../../components/Button';
import { useTraineeFeedback } from './useTraineeFeedback';
import ModalPopup from '../../components/ModalPopup';
import LoadingOverlay from '../../components/LoadingOverlay';
import Ionicons from '@react-native-vector-icons/ionicons';
import { colors } from '../../theme/colors';

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
    showComment,
    showInfo,
    showRating,
    isLoading,
    mode,
    title,
    liveSessionIdParam,
  } = useTraineeFeedback({
    route: props.route,
    navigation: props.navigation,
  });

  // NAVIGATION
  const navigation = props.navigation;

  return (
    <>
      {isLoading && <LoadingOverlay />}

      <View className="flex-1 bg-background-sub1 pt-14">
        {/* Header */}
        <Text className="color-foreground text-3xl font-bold text-center mb-2">
          Đánh giá
        </Text>

        {/* Report */}
        {mode === 'feedbackForCoach' && (
          <Pressable
            onPress={() => {
              navigation.navigate('TraineeReport', {
                liveSessionId: liveSessionIdParam,
              });
            }}
            className="absolute right-4 z-10"
            style={{ top: 55 }}
          >
            <Ionicons name="flag-outline" size={24} color={colors.foreground} />
          </Pressable>
        )}

        <View className="flex-1 mt-2 rounded-t-2xl bg-background overflow-hidden">
          {/* Title */}
          <Text className="mt-6 mb-6 color-foreground text-3xl font-bold text-center">
            {title}
          </Text>

          {/* Info Section */}
          {showInfo && <InfoSection info={info} />}

          {/* Rate Section */}
          {showRating && (
            <RateSection
              rating={rating}
              onChange={setRating}
              mode={mode ?? 'feedbackForCourse'}
            />
          )}

          {/* Comment Section */}
          {showComment && (
            <CommentSection
              comment={comment}
              onChange={setComment}
              mode={mode ?? 'feedbackForCourse'}
            />
          )}

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
    </>
  );
};

export default TraineeFeedback;
