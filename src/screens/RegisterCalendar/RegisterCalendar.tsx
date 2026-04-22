import { View } from 'react-native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Header from './components/Header';
import SearchSection from './components/SearchSection';
import List from './components/List';
import { useRegisterCalendar } from './useRegisterCalendar';
import ChooseDaySection from './components/ChooseDaySection';
import ModalPopup from '../../components/ModalPopup';
import LoadingOverlay from '../../components/LoadingOverlay';
import Footer from './components/Footer';
import CoachDetail from './components/CoachDetail';

type Props = NativeStackScreenProps<RootStackParamList, 'RegisterCalendar'>;

const RegisterCalendar = (props: Props) => {
  // HOOK
  const {
    coaches,
    selectedCoachId,
    onPressCoach,
    clearCoachId,
    showNotiModal,
    notiMsg,
    onPressRegister,
    closeNotiModal,
    isValid,
    changeWeek,
    schedule,
    startTime,
    endTime,
    onSelectDate,
    onSelectStartTime,
    onSelectEndTime,
    clearBooking,
    onPressConfirmSlot,
    bookingSlots,
    selectedDate,
    showErrorModal,
    errorMsg,
    closeErrorModal,
    showSuccessModal,
    successMsg,
    closeSuccessModal,
    isLoading,
    totalPrice,
    totalHours,
    pricePerHour,
    confirmMsg,
    showConfirmModal,
    closeConfirmModal,
    onConfirmModal,
    weekStart,
    coachDetail,
    handleSearch,
    searchQuery,
  } = useRegisterCalendar({
    route: props.route,
    navigation: props.navigation,
  });

  return (
    <>
      {isLoading && <LoadingOverlay />}

      <View className="flex-1 pt-14 bg-background-sub1">
        {/* Header */}
        <Header
          navigation={props.navigation}
          selectedCoachId={selectedCoachId}
          clearCoachId={clearCoachId}
          clearBooking={clearBooking}
        />

        {/* Content */}
        <View className="flex-1 mt-2 rounded-t-2xl bg-background overflow-hidden">
          {!selectedCoachId ? (
            <>
              {/* Search Section */}
              <SearchSection
                searchQuery={searchQuery}
                onSearch={handleSearch}
              />
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
              {/* <PurposeSection
                selectedPurpose={selectedPurpose}
                onPressPurpose={onPressPurpose}
              /> */}

              {/* Coach Detail */}
              {coachDetail && <CoachDetail coach={coachDetail} />}

              {/* Choose Day Section */}
              <ChooseDaySection
                weekStart={weekStart}
                schedule={schedule}
                selectedDate={selectedDate}
                onChangeWeek={changeWeek}
                startTime={startTime}
                endTime={endTime}
                onSelectDate={onSelectDate}
                onSelectStart={onSelectStartTime}
                onSelectEnd={onSelectEndTime}
                onPressConfirmSlot={onPressConfirmSlot}
                bookingSlots={bookingSlots}
              />

              {/* Footer */}
              <Footer
                isValid={isValid}
                onPressRegister={onPressRegister}
                totalPrice={totalPrice}
                totalHours={totalHours}
                pricePerHour={pricePerHour || 0}
              />
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

        {/* Error Modal */}
        <ModalPopup
          visible={showErrorModal}
          mode="noti"
          contentText={errorMsg || ''}
          iconName="alert"
          iconSize={35}
          iconBgColor="red"
          confirmBtnText="Đóng"
          confirmBtnColor="grey"
          onClose={closeErrorModal}
          modalWidth={355}
        />
      </View>
    </>
  );
};

export default RegisterCalendar;
