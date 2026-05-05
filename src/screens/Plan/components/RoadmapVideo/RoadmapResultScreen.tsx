import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import RoadmapApi from '../../../../hooks/roadmap.api';
import RoadmapBeforeAfterCard from './RoadmapBeforeAfterCard';



const RoadmapResultScreen = () => {
  const navigation: any = useNavigation();
  const route: any = useRoute();

  const roadmapId = route.params?.roadmapId ?? null;

  const [loading, setLoading] = useState<boolean>(true);
  const [review, setReview] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const normalizeReviewResponse = (res: any) => {
    return res?.data?.data ?? res?.data ?? res ?? null;
  };

  const loadRoadmapReview = useCallback(async () => {
    if (!roadmapId) {
      setErrorMessage('Không tìm thấy roadmapId.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');

      try {
        const existingReview = await RoadmapApi.getRoadmapReview(
          String(roadmapId),
        );

        const normalizedReview = normalizeReviewResponse(existingReview);

        setReview(normalizedReview);
        return;
      } catch (getErr: any) {
        const status = getErr?.response?.status;

        if (status !== 404) {
          throw getErr;
        }

        console.log('[RoadmapResult] Review not found, generating...');
      }

      const generatedReview = await RoadmapApi.generateRoadmapReview(
        String(roadmapId),
      );

      const normalizedGeneratedReview = normalizeReviewResponse(generatedReview);

      setReview(normalizedGeneratedReview);
    } catch (err: any) {
      console.log('[RoadmapResult] load review error:', err);

      setReview(null);
      setErrorMessage(
        err?.response?.data?.message ??
          err?.message ??
          'Không thể tải đánh giá lộ trình.',
      );
    } finally {
      setLoading(false);
    }
  }, [roadmapId]);

  useEffect(() => {
    loadRoadmapReview();
  }, [loadRoadmapReview]);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.85}
        >
          <Ionicons name="chevron-back" size={22} color="#8B4513" />
        </TouchableOpacity>

        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Kết quả lộ trình</Text>
          <Text style={styles.headerSubtitle}>
            Đánh giá thay đổi trước và sau quá trình tập luyện
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#8B4513" />

            <Text style={styles.loadingText}>
              Đang tải đánh giá trước / sau...
            </Text>
          </View>
        ) : review ? (
          <RoadmapBeforeAfterCard review={review} />
        ) : (
          <View style={styles.errorCard}>
            <View style={styles.errorIconBox}>
              <Ionicons name="alert-circle-outline" size={34} color="#B45309" />
            </View>

            <Text style={styles.errorTitle}>Chưa có kết quả đánh giá</Text>

            <Text style={styles.errorText}>
              {errorMessage ||
                'Hệ thống chưa tạo được đánh giá trước/sau cho lộ trình này.'}
            </Text>

            <TouchableOpacity
              style={styles.retryButton}
              onPress={loadRoadmapReview}
              activeOpacity={0.85}
            >
              <Text style={styles.retryButtonText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default RoadmapResultScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFAF0',
  },

  header: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE3D4',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 999,
    backgroundColor: '#F3EDE3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E2D2C1',
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 21,
    fontWeight: '900',
    color: '#3A2A1A',
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#7A6A58',
    lineHeight: 18,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 90,
  },

  loadingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFE3D4',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 7,
    elevation: 2,
  },
  loadingText: {
    marginTop: 12,
    color: '#8B4513',
    fontSize: 14,
    fontWeight: '800',
  },

  errorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFE3D4',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 7,
    elevation: 2,
  },
  errorIconBox: {
    width: 66,
    height: 66,
    borderRadius: 22,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#3A2A1A',
    textAlign: 'center',
  },
  errorText: {
    marginTop: 8,
    fontSize: 13,
    color: '#6B6B6B',
    lineHeight: 19,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#8B4513',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 999,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 13,
  },
});