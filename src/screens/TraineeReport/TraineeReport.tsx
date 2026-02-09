import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Text, View } from 'react-native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import Header from './components/Header';
import SelectSection from './components/SelectSection';
import { useTraineeReport } from './useTraineeReport';
import Button from '../../components/Button';
import ModalPopup from '../../components/ModalPopup';

type Props = NativeStackScreenProps<RootStackParamList, 'TraineeReport'>;

const TraineeReport = (props: Props) => {
  // HOOK
  const {
    options,
    onPressSubmit,
    isValid,
    selectedOption,
    setSelectedOption,
    showSuccessModal,
    successMsg,
    closeSuccessModal,
    selectedCoachId,
  } = useTraineeReport({ route: props.route, navigation: props.navigation });

  // ERROR
  if (!options) return null;

  return (
    <View className="flex-1 bg-background-sub1 pt-14">
      {/* Header */}
      <Header navigation={props.navigation} />

      <View className="flex-1 mt-2 rounded-t-2xl bg-background overflow-hidden">
        {/* Title */}
        <Text className="mt-6 mb-6 color-foreground text-3xl font-bold text-center">
          {selectedCoachId ? 'HLV' : 'Nội dung'} có vấn đề gì?
        </Text>

        {/* Select Section */}
        <SelectSection
          options={options}
          selectedOption={selectedOption}
          onChange={setSelectedOption}
        />

        {/* Btn */}
        <View className="self-end pt-2 px-4">
          <Button
            text="Báo vi phạm"
            onPress={onPressSubmit}
            colorType={isValid ? 'sub1' : 'grey'}
            rounded="lg"
            width={120}
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

export default TraineeReport;
