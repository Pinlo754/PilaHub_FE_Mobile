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
import { useNavigation } from '@react-navigation/native';
import ModalPopup from '../../../components/ModalPopup';

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
      });

      const res = await uploadInBodyScan(img, rawScanId);

      console.log('InBodyScan: uploadInBodyScan response:', res);

      if (res.ok) {
        const extracted = res.data?.data ?? res.data ?? {};

        /**
         * Backend InBody hiện tại đã lưu DB và trả về healthProfileId.
         * Vì vậy truyền alreadySaved=true để ResultScreen không submitHealthProfile lần nữa.
         */
        nav.navigate('Result' as never, {
          measurements: extracted?.measurements ?? null,
          rawResponse: extracted?.entry ? extracted : { entry: extracted },
          source: 'InBody',
          alreadySaved: true,
        } as never);

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
    <View style={styles.container}>
      <Text style={styles.title}>InBody Scan</Text>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.btn, styles.primary]}
          onPress={pickFromCamera}
          disabled={uploading}
        >
          <Text style={styles.btnText}>Chụp ảnh</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.ghost]}
          onPress={pickFromLibrary}
          disabled={uploading}
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
      ) : null}

      <TouchableOpacity
        style={[styles.btn, styles.upload, uploading && styles.disabledBtn]}
        onPress={submit}
        disabled={uploading}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFAF0',
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
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
});