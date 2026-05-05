import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';

type Props = {
  onInBodyPress: () => void;
  onBodyScanPress: () => void;
  onManualPress: () => void;
};

export default function BodyInputOptions({
  onInBodyPress,
  onBodyScanPress,
  onManualPress,
}: Props) {
  return (
    <View style={styles.container}>
      <OptionCard
        icon="bar-chart-outline"
        title="InBody Scan"
        desc="Sử dụng dữ liệu từ thiết bị InBody nếu bạn đã có kết quả đo."
        onPress={onInBodyPress}
        recommended
      />

      <OptionCard
        icon="camera-outline"
        title="Dùng camera quét cơ thể"
        desc="Quét cơ thể bằng camera để lấy số đo tự động."
        note="Thông tin có thể không chính xác hoàn toàn."
        onPress={onBodyScanPress}
      />

      <OptionCard
        icon="create-outline"
        title="Nhập thông tin cơ bản"
        desc="Tự nhập số đo cơ thể thủ công như eo, ngực, hông, đùi."
        onPress={onManualPress}
      />
    </View>
  );
}

function OptionCard({
  icon,
  title,
  desc,
  note,
  onPress,
  recommended = false,
}: {
  icon: string;
  title: string;
  desc: string;
  note?: string;
  onPress: () => void;
  recommended?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.iconBox}>
        <Ionicons name={icon as any} size={26} color="#B5651D" />
      </View>

      <View style={styles.textBox}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{title}</Text>

          {recommended ? (
            <View style={styles.recommendBadge}>
              <Ionicons name="sparkles" size={11} color="#FFFFFF" />
              <Text style={styles.recommendText}>Khuyến nghị</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.desc}>{desc}</Text>

        {note ? (
          <View style={styles.noteBox}>
            <Ionicons
              name="alert-circle-outline"
              size={14}
              color="#B45309"
            />
            <Text style={styles.noteText}>{note}</Text>
          </View>
        ) : null}
      </View>

      <Ionicons name="chevron-forward" size={22} color="#9CA3AF" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 28,
    gap: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#FFF3E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  textBox: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  recommendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#B5651D',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  recommendText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  desc: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: '#6B7280',
  },
  noteBox: {
    marginTop: 8,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEF3C7',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  noteText: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '800',
    color: '#B45309',
  },
});