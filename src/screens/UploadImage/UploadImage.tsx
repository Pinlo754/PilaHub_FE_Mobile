import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import storage from '@react-native-firebase/storage';

const UploadImageScreen = () => {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  // 📌 Chọn ảnh
  const pickImage = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
    });

    if (result.didCancel) return;
    if (result.errorCode) {
      Alert.alert('Error', result.errorMessage || 'Image picker error');
      return;
    }

    const uri = result.assets?.[0]?.uri;
    if (uri) {
      setImageUri(uri);
      setUploadedUrl(null);
    }
  };

  // 📌 Upload ảnh
  const uploadImage = async () => {
    if (!imageUri) return;

    try {
      setUploading(true);
      setProgress(0);

      const filename = `images/${Date.now()}.jpg`;
      const reference = storage().ref(filename);

      const task = reference.putFile(imageUri);

      task.on('state_changed', taskSnapshot => {
        const percent =
          (taskSnapshot.bytesTransferred / taskSnapshot.totalBytes) * 100;
        setProgress(percent);
      });

      await task;

      const downloadURL = await reference.getDownloadURL();
      setUploadedUrl(downloadURL);
      console.log('Image uploaded to Firebase Storage:', downloadURL);

      Alert.alert('Success', 'Image uploaded successfully!');
    } catch (error) {
      console.error(error);
      Alert.alert('Upload error', 'Something went wrong');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upload Image to Firebase</Text>

      <TouchableOpacity style={styles.button} onPress={pickImage}>
        <Text style={styles.buttonText}>Choose Image</Text>
      </TouchableOpacity>

      {imageUri && (
        <Image source={{ uri: imageUri }} style={styles.imagePreview} />
      )}

      {imageUri && !uploading && (
        <TouchableOpacity style={styles.uploadButton} onPress={uploadImage}>
          <Text style={styles.buttonText}>Upload</Text>
        </TouchableOpacity>
      )}

      {uploading && (
        <View style={{ alignItems: 'center', marginTop: 20 }}>
          <ActivityIndicator size="large" />
          <Text>{progress.toFixed(0)}%</Text>
        </View>
      )}

      {uploadedUrl && (
        <>
          <Text style={styles.urlText}>Uploaded Image:</Text>
          <Image source={{ uri: uploadedUrl }} style={styles.imagePreview} />
        </>
      )}
    </View>
  );
};

export default UploadImageScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  uploadButton: {
    backgroundColor: '#2ecc71',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  imagePreview: {
    width: '100%',
    height: 250,
    marginTop: 20,
    borderRadius: 10,
  },
  urlText: {
    marginTop: 20,
    fontWeight: 'bold',
  },
});