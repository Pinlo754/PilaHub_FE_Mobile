import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';

type Props = {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  roadmapTitle?: string;
  progressPercent?: number;
  totalSessions?: number;
  loadingProfile?: boolean;
  healthProfile?: any;
};

export default function RoadmapBodyMetricModal({
  visible,
  onClose,
  onConfirm,
  roadmapTitle,
  progressPercent = 100,
  totalSessions = 0,
  loadingProfile = false,
  healthProfile,
}: Props) {
  const profileItems = [
    { label: 'Chiều cao', value: healthProfile?.display?.height },
    { label: 'Cân nặng', value: healthProfile?.display?.weight },
    { label: 'BMI', value: healthProfile?.display?.bmi },
    { label: 'Mỡ cơ thể', value: healthProfile?.display?.bodyFat },
    { label: 'Khối cơ', value: healthProfile?.display?.muscle },
    { label: 'Eo', value: healthProfile?.display?.waist },
    { label: 'Hông', value: healthProfile?.display?.hip },
    { label: 'Ngực', value: healthProfile?.display?.bust },
    { label: 'Bắp tay', value: healthProfile?.display?.bicep },
    { label: 'Đùi', value: healthProfile?.display?.thigh },
    { label: 'Bắp chân', value: healthProfile?.display?.calf },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.iconWrap}>
            <Ionicons name="body-outline" size={30} color="#8B4513" />
          </View>

          <Text style={styles.title}>Cập nhật số đo cơ thể</Text>

          <Text style={styles.description}>
            Bạn đã hoàn thành lộ trình. Hãy cập nhật lại số đo để hệ thống đánh
            giá hồ sơ sức khỏe mới nhất.
          </Text>

          <View style={styles.infoBox}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Lộ trình</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {roadmapTitle || 'Lộ trình hiện tại'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tiến độ</Text>
              <Text style={styles.infoValue}>{progressPercent}%</Text>
            </View>

            <View style={[styles.infoRow, styles.infoRowLast]}>
              <Text style={styles.infoLabel}>Tổng buổi</Text>
              <Text style={styles.infoValue}>{totalSessions}</Text>
            </View>
          </View>

          <View style={styles.profileBox}>
            <Text style={styles.profileTitle}>
              Số đo đang dùng cho lộ trình
            </Text>

            {loadingProfile ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color="#8B4513" />
                <Text style={styles.profileMuted}>Đang tải số đo...</Text>
              </View>
            ) : (
              <ScrollView
                style={styles.profileScroll}
                contentContainerStyle={styles.profileScrollContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.profileGrid}>
                  {profileItems.map((item) => {
                    const empty =
                      item.value === null ||
                      item.value === undefined ||
                      item.value === '' ||
                      item.value === '-';

                    return (
                      <View
                        key={item.label}
                        style={[
                          styles.profileItem,
                          empty ? styles.profileItemMuted : null,
                        ]}
                      >
                        <Text style={styles.profileLabel}>{item.label}</Text>
                        <Text style={styles.profileValue}>
                          {item.value ?? '-'}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            )}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.cancelBtn}
              activeOpacity={0.85}
            >
              <Text style={styles.cancelText}>Để sau</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onConfirm}
              style={styles.confirmBtn}
              activeOpacity={0.85}
            >
              <Text style={styles.confirmText}>Đi cập nhật</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 430,
    maxHeight: '88%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
  },
  iconWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#F3EDE3',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#3A2A1A',
    textAlign: 'center',
  },
  description: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B6B6B',
    textAlign: 'center',
    lineHeight: 21,
  },
  infoBox: {
    marginTop: 16,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#FFFAF0',
    borderWidth: 1,
    borderColor: '#EFE3D4',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  infoRowLast: {
    marginBottom: 0,
  },
  infoLabel: {
    fontSize: 13,
    color: '#7A6A58',
  },
  infoValue: {
    flex: 1,
    marginLeft: 12,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '800',
    color: '#3A2A1A',
  },
  profileBox: {
    marginTop: 14,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE3D4',
  },
  profileTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#3A2A1A',
    marginBottom: 10,
  },
  loadingBox: {
    minHeight: 80,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  profileMuted: {
    color: '#8B8B8B',
    fontSize: 13,
  },
  profileScroll: {
    maxHeight: 220,
  },
  profileScrollContent: {
    paddingBottom: 4,
  },
  profileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  profileItem: {
    width: '48%',
    backgroundColor: '#FFFAF0',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  profileItemMuted: {
    opacity: 0.35,
  },
  profileLabel: {
    fontSize: 12,
    color: '#7A6A58',
  },
  profileValue: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: '800',
    color: '#3A2A1A',
  },
  actions: {
    flexDirection: 'row',
    marginTop: 18,
  },
  cancelBtn: {
    flex: 1,
    marginRight: 8,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelText: {
    color: '#6B6B6B',
    fontWeight: '700',
  },
  confirmBtn: {
    flex: 1,
    marginLeft: 8,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#8B4513',
    alignItems: 'center',
  },
  confirmText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});