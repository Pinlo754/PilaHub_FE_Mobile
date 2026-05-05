import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { uploadInBodyScan } from '../../../services/profile';
import storage from '@react-native-firebase/storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import ModalPopup from '../../../components/ModalPopup';
import Ionicons from '@react-native-vector-icons/ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';

type ModalMode = 'noti' | 'confirm' | 'toast';

type ModalState = {
  visible: boolean;
  mode: ModalMode;
  titleText?: string;
  contentText?: string;
  confirmBtnText?: string;
  cancelBtnText?: string;
  onClose?: () => void;
  onConfirm?: () => void;
};

export default function InBodyScan() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();

  /**
   * Dùng để sau Assessment quay lại đúng nơi bắt đầu flow.
   *
   * BodyMetricDetails:
   * returnToAfterAssessment = 'BodyMetricDetails'
   *
   * Roadmap tab:
   * returnToAfterAssessment = {
   *   root: 'MainTabs',
   *   screen: 'Roadmap',
   * }
   */
  const returnToAfterAssessment = route.params?.returnToAfterAssessment;

  /**
   * Dùng cho flow cập nhật số đo cuối của roadmap.
   *
   * roadmapFinalUpdate = {
   *   roadmapId: '...'
   * }
   *
   * Param này sẽ được truyền tiếp tới ResultScreen.
   * ResultScreen sẽ dùng roadmapId + healthProfileId mới
   * để gọi PATCH /roadmaps/{id}/final-health-profile.
   */
  const roadmapFinalUpdate = route.params?.roadmapFinalUpdate;

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [modalProps, setModalProps] = useState<ModalState>({
    visible: false,
    mode: 'noti',
  });

  function closeModal() {
    setModalProps((prev) => ({
      ...prev,
      visible: false,
    }));
  }

  function showModal(
    title: string,
    message?: string,
    mode: ModalMode = 'noti',
    onConfirm?: () => void,
  ) {
    setModalProps({
      visible: true,
      mode,
      titleText: title,
      contentText: message ?? '',
      confirmBtnText: mode === 'confirm' ? 'Xác nhận' : 'Đóng',
      cancelBtnText: 'Hủy',
      onClose: () => {
        setModalProps((prev) => ({
          ...prev,
          visible: false,
        }));
      },
      onConfirm: () => {
        setModalProps((prev) => ({
          ...prev,
          visible: false,
        }));

        if (onConfirm) {
          onConfirm();
        }
      },
    });
  }

  function handleGoBack() {
    if (uploading) return;
    nav.goBack();
  }

  async function pickFromCamera() {
    const res = await launchCamera({
      mediaType: 'photo',
      quality: 0.7,
    });

    if (res.didCancel) return;

    if (res.errorCode) {
      showModal('Lỗi', res.errorMessage || 'Không thể mở camera');
      return;
    }

    const uri = res.assets?.[0]?.uri;

    if (uri) {
      setImageUri(uri);
    }
  }

  async function pickFromLibrary() {
    const res = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.7,
    });

    if (res.didCancel) return;

    if (res.errorCode) {
      showModal('Lỗi', res.errorMessage || 'Không thể mở thư viện');
      return;
    }

    const uri = res.assets?.[0]?.uri;

    if (uri) {
      setImageUri(uri);
    }
  }

  async function continueToExtract() {
    if (!imageUri) {
      showModal('Chưa chọn ảnh', 'Vui lòng chụp hoặc chọn ảnh InBody.');
      return;
    }

    try {
      setUploading(true);

      let rawScanId: string | undefined;

      try {
        const path = `inbody/${Date.now()}.jpg`;
        const ref = storage().ref(path);

        await ref.putFile(imageUri);

        rawScanId = await ref.getDownloadURL();
      } catch (uploadErr) {
        console.log(
          'Firebase upload failed, will proceed without rawScanId',
          uploadErr,
        );
      }

      const img = {
        uri: imageUri,
        name: 'inbody.jpg',
        type: 'image/jpeg',
      };

      console.log('InBodyScan: about to call uploadInBodyScan', {
        imageUri,
        rawScanId,
        returnToAfterAssessment,
        roadmapFinalUpdate,
      });

      const res = await uploadInBodyScan(img, rawScanId);

      console.log('InBodyScan: uploadInBodyScan response:', res);

      if (res.ok) {
        const extracted = res.data?.data ?? res.data ?? {};

        /**
         * Backend InBody hiện tại đã lưu DB và trả về healthProfileId.
         * Vì vậy truyền alreadySaved=true để ResultScreen không submitHealthProfile lần nữa.
         *
         * returnToAfterAssessment:
         * InBodyScan -> Result -> HealthProfileAssessment -> quay lại đúng màn ban đầu.
         *
         * roadmapFinalUpdate:
         * InBodyScan -> Result -> PATCH finalHealthProfileId cho roadmap.
         */
        nav.navigate(
          'Result' as never,
          {
            measurements: extracted?.measurements ?? null,
            rawResponse: extracted?.entry ? extracted : { entry: extracted },
            source: 'InBody',
            alreadySaved: true,
            returnToAfterAssessment,
            roadmapFinalUpdate,
          } as never,
        );

        return;
      }

      const err = (res as any).error ?? res;

      showModal('Lỗi', typeof err === 'string' ? err : JSON.stringify(err));
    } catch (e: any) {
      console.log('InBody API call error', e);
      showModal('Lỗi', e?.message ?? 'Không thể gọi InBody API');
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    if (!imageUri) {
      showModal('Chưa chọn ảnh', 'Vui lòng chụp hoặc chọn ảnh InBody.');
      return;
    }

    showModal(
      'Xác nhận',
      'Bạn có chắc muốn gửi ảnh để trích xuất không?',
      'confirm',
      continueToExtract,
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Ionic-style Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleGoBack}
          disabled={uploading}
          activeOpacity={0.75}
        >
          <Ionicons name="arrow-back" size={24} color="#A0522D" />
    
        </TouchableOpacity>

        <Text style={styles.headerTitle}>InBody Scan</Text>

        <View style={styles.headerRightPlaceholder} />
      </View>

      <Text style={styles.description}>
        Chụp hoặc chọn ảnh kết quả InBody. Hệ thống sẽ trích xuất chỉ số sức khỏe
        và lưu thành hồ sơ mới.
      </Text>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.btn, styles.primary]}
          onPress={pickFromCamera}
          disabled={uploading}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>Chụp ảnh</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.ghost]}
          onPress={pickFromLibrary}
          disabled={uploading}
          activeOpacity={0.85}
        >
          <Text style={[styles.btnText, styles.ghostText]}>
            Chọn từ thư viện
          </Text>
        </TouchableOpacity>
      </View>

      {imageUri ? (
        <View style={styles.preview}>
          <Image source={{ uri: imageUri }} style={styles.previewImg} />
        </View>
      ) : (
        <View style={styles.emptyPreview}>
          <Ionicons name="image-outline" size={42} color="#D8C4AE" />

          <Text style={styles.emptyPreviewText}>Chưa có ảnh InBody</Text>

          <Text style={styles.emptyPreviewSubText}>
            Hãy chụp ảnh hoặc chọn ảnh kết quả từ thư viện
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.btn, styles.upload, uploading && styles.disabledBtn]}
        onPress={submit}
        disabled={uploading}
        activeOpacity={0.85}
      >
        {uploading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Gửi để trích xuất</Text>
        )}
      </TouchableOpacity>

      <ModalPopup
        {...(modalProps as any)}
        onClose={modalProps.onClose ?? closeModal}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFAF0',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },

  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  backButton: {
    minWidth: 78,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },

  backText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#A0522D',
    marginLeft: 2,
  },

  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: '#3A2A1A',
  },

  headerRightPlaceholder: {
    width: 78,
    height: 42,
  },

  description: {
    textAlign: 'center',
    color: '#6B6B6B',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
    paddingHorizontal: 6,
  },

  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  btn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  primary: {
    backgroundColor: '#A0522D',
    flex: 1,
    marginRight: 8,
  },

  ghost: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flex: 1,
    marginLeft: 8,
  },

  upload: {
    backgroundColor: '#A0522D',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },

  disabledBtn: {
    opacity: 0.7,
  },

  btnText: {
    color: '#fff',
    fontWeight: '700',
  },

  ghostText: {
    color: '#111827',
  },

  preview: {
    marginTop: 12,
    alignItems: 'center',
  },

  previewImg: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    backgroundColor: '#eee',
  },

  emptyPreview: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE3D4',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingHorizontal: 24,
  },

  emptyPreviewText: {
    color: '#8B8B8B',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 10,
  },

  emptyPreviewSubText: {
    color: '#B0A092',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 17,
  },
}); 