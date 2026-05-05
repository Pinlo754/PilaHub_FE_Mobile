import React from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import MeasurementTag from '../components/MeasurementTag';

type OnboardingData = {
  waist?: number;
  bust?: number;
  hip?: number;
  thigh?: number;
  bicep?: number;
  calf?: number;
  bodyFatPercent?: number;
  muscleMass?: number;
  height?: number;
  weight?: number;
  heightUnit?: string;
  weightUnit?: string;
  bmi?: number;
  age?: number;
  gender?: 'male' | 'female' | string;
  [k: string]: any;
};

type Props = {
  onboarding: OnboardingData;
  bmiValue: number | string;
  openModal: (key: string) => void;
};

export default function ManualBodyInputSection({
  onboarding,
  bmiValue,
  openModal,
}: Props) {
  return (
    <View>
      <View style={styles.bodyCard}>
        <View style={styles.imageContainer}>
          <Image
            source={require('../../../assets/bodygram.png')}
            style={styles.silhouetteImage}
            resizeMode="contain"
          />

          <View style={styles.tagBust}>
            <MeasurementTag
              label="Ngực"
              value={onboarding?.bust}
              unit="cm"
              onPress={() => openModal('bust')}
            />
          </View>

          <View style={styles.tagBicep}>
            <MeasurementTag
              label="Bắp Tay"
              value={onboarding?.bicep}
              unit="cm"
              onPress={() => openModal('bicep')}
            />
          </View>

          <View style={styles.tagWaist}>
            <MeasurementTag
              label="Eo"
              value={onboarding?.waist}
              unit="cm"
              onPress={() => openModal('waist')}
            />
          </View>

          <View style={styles.tagHip}>
            <MeasurementTag
              label="Hông"
              value={onboarding?.hip}
              unit="cm"
              onPress={() => openModal('hip')}
            />
          </View>

          <View style={styles.tagThigh}>
            <MeasurementTag
              label="Đùi"
              value={onboarding?.thigh}
              unit="cm"
              onPress={() => openModal('thigh')}
            />
          </View>

          <View style={styles.tipBubble}>
            <View style={styles.tipCard}>
              <Text style={styles.tipText}>
                Tip: Ước lượng gần đúng, bạn có thể điều chỉnh sau
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <StatCard
          title="% Mỡ Cơ Thể"
          value={
            onboarding?.bodyFatPercent != null
              ? `${onboarding.bodyFatPercent}%`
              : '—'
          }
          onPress={() => openModal('bodyFatPercent')}
        />

        <StatCard
          title="Khối Lượng Cơ (kg)"
          value={
            onboarding?.muscleMass != null
              ? `${onboarding.muscleMass} kg`
              : '—'
          }
          onPress={() => openModal('muscleMass')}
        />

        <StatCard title="BMI" value={bmiValue} />

        <StatCard
          title="Bắp chân"
          value={onboarding?.calf != null ? `${onboarding.calf}` : '—'}
          onPress={() => openModal('calf')}
        />
      </View>
    </View>
  );
}

function StatCard({
  title,
  value,
  onPress,
}: {
  title: string;
  value: string | number;
  onPress?: () => void;
}) {
  const content = (
    <View style={styles.statCard}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );

  if (!onPress) {
    return <View style={styles.statItem}>{content}</View>;
  }

  return (
    <View style={styles.statItem}>
      <Pressable onPress={onPress}>{content}</Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bodyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 52,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 22,
    overflow: 'hidden',
  },
  imageContainer: {
    width: 280,
    height: 380,
    alignSelf: 'center',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  silhouetteImage: {
    width: '100%',
    height: '100%',
  },
  tagBust: {
    position: 'absolute',
    top: 72,
    left: 0,
  },
  tagBicep: {
    position: 'absolute',
    top: 52,
    right: 0,
  },
  tagWaist: {
    position: 'absolute',
    top: 150,
    left: 0,
  },
  tagHip: {
    position: 'absolute',
    top: 152,
    right: 0,
  },
  tagThigh: {
    position: 'absolute',
    bottom: 58,
    left: 16,
  },
  tipBubble: {
    position: 'absolute',
    bottom: -24,
    left: 18,
    right: 18,
    alignItems: 'center',
  },
  tipCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  tipText: {
    color: '#555',
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  statItem: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 10,
    minHeight: 112,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  statTitle: {
    color: '#E47D22',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111827',
    textAlign: 'center',
  },
});