import React from 'react';
import { FlatList, Modal, Pressable, Text, View } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { colors } from '../../../theme/colors';
import { REPORT_TABS, ReportTab } from '../../../constants/reportTab';
import dayjs from 'dayjs';
import LoadingOverlay from '../../../components/LoadingOverlay';
import { ReportWithSession, useReportList } from './useReportList';
import DetailModal from './DetailModal';
import {
  LIVESESSION_OPTIONS,
  ReportReason,
} from '../../../constants/reportOption';

type Props = {
  visible: boolean;
  onClose: () => void;
};

const ReportList = ({ visible, onClose }: Props) => {
  const {
    activeTab,
    setActiveTab,
    currentData,
    pendingCount,
    resolvedCount,
    isLoading,
    selectedItem,
    showDetailModal,
    openDetail,
    closeDetail,
  } = useReportList();

  const renderItem = ({ item }: { item: ReportWithSession }) => {
    const { report, liveSession } = item;
    const isResolved = activeTab === ReportTab.Resolved;

    const getReasonLabel = (reason: ReportReason) =>
      LIVESESSION_OPTIONS.find(o => o.value === reason)?.label ?? reason;

    const coachName = liveSession?.coachBooking?.coach?.fullName;
    const traineeName = liveSession?.coachBooking?.trainee?.fullName;
    const startTime = liveSession?.coachBooking?.startTime;
    const endTime = liveSession?.coachBooking?.endTime;

    return (
      <Pressable
        onPress={() => openDetail(item)}
        className="mx-4 mb-3 p-4 rounded-xl bg-white border border-background-sub1 shadow-sm elevation-sm"
      >
        {/* Reason + Badge */}
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-foreground font-bold flex-1 mr-2">
            {getReasonLabel(report.reason)}
          </Text>
          <View
            className={`px-3 py-1 rounded-full ${isResolved ? 'bg-success-20' : 'bg-warning-20'}`}
          >
            <Text
              className={`text-xs font-semibold ${isResolved ? 'text-success' : 'text-warning'}`}
            >
              {isResolved ? 'Đã xử lý' : 'Đang xử lý'}
            </Text>
          </View>
        </View>

        {/* Coach / Trainee */}
        {(coachName || traineeName) && (
          <View className="flex-row items-center gap-2 mb-1">
            {coachName && (
              <View className="flex-row items-center gap-1">
                <Ionicons
                  name="person-outline"
                  size={13}
                  color={colors.secondaryText}
                />
                <Text className="text-secondaryText ">HLV: {coachName}</Text>
              </View>
            )}
          </View>
        )}

        {/* Session time */}
        {startTime && endTime && (
          <View className="flex-row items-center gap-1 mb-1">
            <Ionicons
              name="time-outline"
              size={13}
              color={colors.secondaryText}
            />
            <Text className="text-secondaryText">
              {dayjs(startTime).format('HH:mm')} –{' '}
              {dayjs(endTime).format('HH:mm DD/MM/YYYY')}
            </Text>
          </View>
        )}

        {/* Created at */}
        <View
          className={`flex-row items-center gap-1 ${report.description && 'mb-2'}`}
        >
          <Ionicons
            name="calendar-outline"
            size={14}
            color={colors.secondaryText}
          />
          <Text className="text-secondaryText ">
            {dayjs(report.createdAt).format('HH:mm DD/MM/YYYY')}
          </Text>
        </View>

        {/* Description */}
        {report.description && (
          <Text className="text-secondaryText text-sm " numberOfLines={2}>
            {report.description}
          </Text>
        )}
      </Pressable>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-background">
        {isLoading && <LoadingOverlay />}

        {/* Header */}
        <View className="pt-14 px-4 pb-3 flex-row items-center justify-between">
          <Pressable onPress={onClose}>
            <Ionicons
              name="chevron-back-outline"
              size={24}
              color={colors.foreground}
            />
          </Pressable>
          <Text className="color-foreground text-3xl font-bold text-center">
            Báo cáo của tôi
          </Text>
          <View className="w-6" />
        </View>

        {/* Tabs */}
        <View className="flex-row items-center justify-center gap-1 px-4">
          {REPORT_TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                className={`flex-1 items-center py-2 border-b-2 ${isActive ? 'border-foreground' : 'border-transparent'}`}
              >
                <Text
                  numberOfLines={1}
                  className={`text-base font-semibold flex-shrink-0 ${isActive ? 'text-foreground' : 'text-secondaryText'}`}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* List */}
        <FlatList
          data={currentData}
          keyExtractor={item =>
            item.report.liveSessionId + item.report.createdAt
          }
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 32 }}
          ListEmptyComponent={
            !isLoading ? (
              <View className="items-center mt-20 gap-3">
                <Ionicons
                  name="flag-outline"
                  size={56}
                  color={colors.inactive[80]}
                />
                <Text className="text-foreground font-semibold text-lg">
                  Chưa có báo cáo nào
                </Text>
              </View>
            ) : null
          }
        />

        {/* Detail Modal */}
        {selectedItem && (
          <>
            <View className="absolute inset-0 bg-black/40" />
            <DetailModal
              visible={showDetailModal}
              onClose={closeDetail}
              item={selectedItem}
            />
          </>
        )}
      </View>
    </Modal>
  );
};

export default ReportList;
