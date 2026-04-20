import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { extractInBodyScanFile, uploadInBodyScan } from '../../../services/profile';
import storage from '@react-native-firebase/storage';
import { useNavigation } from '@react-navigation/native';

export default function InBodyScan() {
  const nav = useNavigation();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function pickFromCamera() {
    const res = await launchCamera({ mediaType: 'photo', quality: 0.7 });
    if (res.didCancel) return;
    if (res.errorCode) {
      Alert.alert('Lỗi', res.errorMessage || 'Không thể mở camera');
      return;
    }
    const uri = res.assets?.[0]?.uri;
    if (uri) setImageUri(uri);
  }

  async function pickFromLibrary() {
    const res = await launchImageLibrary({ mediaType: 'photo', quality: 0.7 });
    if (res.didCancel) return;
    if (res.errorCode) {
      Alert.alert('Lỗi', res.errorMessage || 'Không thể mở thư viện');
      return;
    }
    const uri = res.assets?.[0]?.uri;
    if (uri) setImageUri(uri);
  }

  async function submit() {
    if (!imageUri) { Alert.alert('Chưa chọn ảnh', 'Vui lòng chụp hoặc chọn ảnh InBody.'); return; }
    try {
      setUploading(true);
      // first upload to Firebase to obtain rawScanId (public URL)
      let rawScanId: string | undefined;
      try {
        const path = `inbody/${Date.now()}.jpg`;
        const ref = storage().ref(path);
        await ref.putFile(imageUri);
        rawScanId = await ref.getDownloadURL();
      } catch (uploadErr) {
        console.log('Firebase upload failed, will proceed without rawScanId', uploadErr);
        // fallthrough: still attempt backend call without rawScanId
      }

      const img = { uri: imageUri, name: 'inbody.jpg', type: 'image/jpeg' };
      // prefer new uploadInBodyScan helper which accepts rawScanId
      const res = await (uploadInBodyScan ? uploadInBodyScan(img, rawScanId) : extractInBodyScanFile(img));
      if (res.ok) {
        (nav as any).navigate('BodyGramResult', { measurements: res.data?.measurements ?? null, rawResponse: { entry: res.data ?? {} } });
      } else {
        const err = res.error;
        Alert.alert('Lỗi', typeof err === 'string' ? err : JSON.stringify(err));
      }
    } catch (e: any) {
      console.log('InBody API call error', e);
      Alert.alert('Lỗi', 'Không thể gọi InBody API');
    } finally {
      setUploading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>InBody Scan</Text>
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.btn, styles.primary]} onPress={pickFromCamera}>
          <Text style={styles.btnText}>Chụp ảnh</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.ghost]} onPress={pickFromLibrary}>
          <Text style={[styles.btnText, styles.ghostText]}>Chọn từ thư viện</Text>
        </TouchableOpacity>
      </View>

      {imageUri ? (
        <View style={styles.preview}>
          <Image source={{ uri: imageUri }} style={styles.previewImg} />
        </View>
      ) : null}

      <TouchableOpacity style={[styles.btn, styles.upload]} onPress={submit} disabled={uploading}>
        {uploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Gửi để trích xuất</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFAF0', padding: 16 },
  title: { fontSize: 20, fontWeight: '700', textAlign: 'center', marginBottom: 16 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  btn: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  primary: { backgroundColor: '#A0522D', flex: 1, marginRight: 8 },
  ghost: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', flex: 1, marginLeft: 8 },
  upload: { backgroundColor: '#A0522D', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  btnText: { color: '#fff', fontWeight: '700' },
  ghostText: { color: '#111827' },
  preview: { marginTop: 12, alignItems: 'center' },
  previewImg: { width: '100%', height: 300, borderRadius: 12, backgroundColor: '#eee' },
});
