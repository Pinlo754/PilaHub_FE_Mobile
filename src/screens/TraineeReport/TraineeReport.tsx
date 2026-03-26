import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Text, TextInput, View } from 'react-native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import Header from './components/Header';
import SelectSection from './components/SelectSection';
import { useTraineeReport } from './useTraineeReport';
import Button from '../../components/Button';
import ModalPopup from '../../components/ModalPopup';
import { colors } from '../../theme/colors';
import { useState } from 'react';
import LoadingOverlay from '../../components/LoadingOverlay';

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
    isOtherReason,
    setDescription,
    description,
    selectedExerciseId,
    closeConfirmModal,
    onConfirmModal,
    showConfirmModal,
    confirmMsg,
    isLoading,
  } = useTraineeReport({ route: props.route, navigation: props.navigation });

  // STATE
  const [focused, setFocused] = useState<boolean>(false);

  // ERROR
  if (!options) return null;

  return (
    <>
      {isLoading && <LoadingOverlay />}

      <View className="flex-1 bg-background-sub1 pt-14">
        {/* Header */}
        <Header navigation={props.navigation} />

        <View className="flex-1 mt-2 rounded-t-2xl bg-background overflow-hidden">
          {/* Title */}
          <Text className="mt-6 mb-6 color-foreground text-3xl font-bold text-center">
            {selectedCoachId
              ? 'HLV'
              : selectedExerciseId
                ? 'Nội dung'
                : 'Buổi tập'}{' '}
            có vấn đề gì?
          </Text>

          {/* Select Section */}
          <SelectSection
            options={options}
            selectedOption={selectedOption}
            onChange={setSelectedOption}
          />

          {isOtherReason && (
            <View
              className={`mx-4 border rounded-lg mb-2 ${focused ? 'border-foreground' : 'border-background-sub1'}`}
            >
              <TextInput
                className={`color-foreground font-medium px-3 py-3 text-lg`}
                onChangeText={setDescription}
                value={description}
                placeholder="Hãy nhập lý do..."
                placeholderTextColor={colors.inactive[80]}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
              />
            </View>
          )}

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

        {/* Confirm Modal */}
        <ModalPopup
          visible={showConfirmModal}
          mode="confirm"
          contentText={confirmMsg}
          iconName="alert"
          iconSize={35}
          iconBgColor="yellow"
          confirmBtnText="Xác nhận"
          confirmBtnColor="green"
          cancelBtnText="Đóng"
          cancelBtnColor="grey"
          onConfirm={onConfirmModal}
          onClose={closeConfirmModal}
          modalWidth={355}
        />
      </View>
    </>
  );
};

export default TraineeReport;
