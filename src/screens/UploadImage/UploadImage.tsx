import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import storage from '@react-native-firebase/storage';

const UploadImageScreen = () => {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  // 📌 Chọn ảnh từ thư viện
  const pickImage = async () => {
    const result: ImagePickerResponse = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.6, // Giảm chất lượng một chút để upload nhanh hơn
    });

    if (result.didCancel) return;
    if (result.errorCode) {
      Alert.alert('Lỗi', result.errorMessage || 'Không thể chọn ảnh');
      return;
    }

    const uri = result.assets?.[0]?.uri;
    if (uri) {
      setImageUri(uri);
      setUploadedUrl(null);
      setProgress(0);
    }
  };

  const uploadImage = async () => {
    console.log('Bắt đầu tải lên...');
  if (!imageUri) return;

  const filename = `images/${Date.now()}.jpg`;

  const reference = storage().ref(filename);

  await reference.putFile(imageUri);

  const url = await reference.getDownloadURL();

  console.log(url);
};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Firebase Image Upload</Text>

      <TouchableOpacity style={styles.button} onPress={pickImage}>
        <Text style={styles.buttonText}>1. Chọn ảnh</Text>
      </TouchableOpacity>

      {imageUri && (
        <View style={styles.previewContainer}>
          <Text style={styles.label}>Ảnh đã chọn:</Text>
          <Image source={{ uri: imageUri }} style={styles.imagePreview} />
          
          {!uploading && !uploadedUrl && (
            <TouchableOpacity style={styles.uploadButton} onPress={uploadImage}>
              <Text style={styles.buttonText}>2. Tải lên Firebase</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {uploading && (
        <View style={styles.progressContainer}>
          <ActivityIndicator size="large" color="#2ecc71" />
          <Text style={styles.progressText}>Đang tải lên: {progress}%</Text>
          <View style={styles.progressBarBackground}>
             <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
          </View>
        </View>
      )}

      {uploadedUrl && (
        <View style={styles.previewContainer}>
          <Text style={[styles.label, { color: '#2ecc71' }]}>✅ Đã tải lên thành công:</Text>
          <Image source={{ uri: uploadedUrl }} style={styles.imagePreview} />
          <Text style={styles.urlText} numberOfLines={1}>{uploadedUrl}</Text>
        </View>
      )}
    </View>
  );
};

export default UploadImageScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#2c3e50',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#34495e',
  },
  button: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
  },
  uploadButton: {
    backgroundColor: '#27ae60',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  previewContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 15,
    backgroundColor: '#ddd',
  },
  progressContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  progressText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressBarBackground: {
    width: '100%',
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    marginTop: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2ecc71',
  },
  urlText: {
    marginTop: 10,
    fontSize: 12,
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
});