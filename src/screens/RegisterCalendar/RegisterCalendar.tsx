import { View } from 'react-native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Header from './components/Header';
import SearchSection from './components/SearchSection';
import List from './components/List';
import { useRegisterCalendar } from './useRegisterCalendar';
import PurposeSection from './components/PurposeSection';
import ChooseDaySection from './components/ChooseDaySection';
import Button from '../../components/Button';
import ModalPopup from '../../components/ModalPopup';

type Props = NativeStackScreenProps<RootStackParamList, 'RegisterCalendar'>;

const RegisterCalendar = (props: Props) => {
  // HOOK
  const {
    coaches,
    selectedPurpose,
    onPressPurpose,
    selectedCoachId,
    onPressCoach,
    clearCoachId,
    showNotiModal,
    notiMsg,
    onPressRegister,
    closeNotiModal,
    isValid,
  } = useRegisterCalendar({
    route: props.route,
  });

  return (
    <View className="flex-1 pt-14 bg-background-sub1">
      {/* Header */}
      <Header
        navigation={props.navigation}
        selectedCoachId={selectedCoachId}
        clearCoachId={clearCoachId}
      />

      {/* Content */}
      <View className="flex-1 mt-2 rounded-t-2xl bg-background overflow-hidden">
        {!selectedCoachId ? (
          <>
            {/* Search Section */}
            <SearchSection />
            {/* List Section */}
            <List
              data={coaches}
              navigation={props.navigation}
              onPressCoach={onPressCoach}
            />
          </>
        ) : (
          <>
            {/* Purpose Section */}
            <PurposeSection
              selectedPurpose={selectedPurpose}
              onPressPurpose={onPressPurpose}
            />
            {/* Choose Day Section */}
            <ChooseDaySection />
            {/* Button */}
            <View className="bg-background absolute bottom-0 left-0 right-0 pt-2 px-4 pb-6">
              <Button
                text="Đăng ký"
                onPress={onPressRegister}
                colorType={isValid ? 'grey' : 'sub1'}
                rounded="full"
                iconName="today-outline"
                iconSize={26}
                disabled={isValid}
              />
            </View>
          </>
        )}
      </View>

      {/* Noti Modal */}
      <ModalPopup
        visible={showNotiModal}
        mode="noti"
        contentText={notiMsg}
        iconName="alert"
        iconSize={35}
        iconBgColor="yellow"
        confirmBtnText="Đóng"
        confirmBtnColor="grey"
        onClose={closeNotiModal}
        modalWidth={355}
      />
    </View>
  );
};

export default RegisterCalendar;
