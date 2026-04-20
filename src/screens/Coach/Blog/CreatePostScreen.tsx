import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { launchImageLibrary, Asset } from 'react-native-image-picker';
import storage from '@react-native-firebase/storage';
import { PostService } from '../../../hooks/post.service';
import Video from 'react-native-video';

const CreatePostScreen = ({ navigation }: any) => {
  const [content, setContent] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<Asset | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // 1. Hàm chọn ảnh/video từ máy
  const handleSelectMedia = async () => {
    const result = await launchImageLibrary({
      mediaType: 'mixed', // Cho phép cả ảnh và video
      quality: 0.8,
      selectionLimit: 1,
    });

    if (result.assets && result.assets.length > 0) {
      setSelectedMedia(result.assets[0]);
    }
  };

  // 2. Hàm upload lên Firebase Storage
  const uploadToFirebase = async (asset: Asset): Promise<string | null> => {
    const { uri, fileName, type } = asset;
    if (!uri) return null;

    const uploadUri = Platform.OS === 'ios' ? uri.replace('file://', '') : uri;
    const path = `posts/${Date.now()}_${fileName}`;
    const reference = storage().ref(path);

    try {
      await reference.putFile(uploadUri);
      const url = await reference.getDownloadURL();
      return url;
    } catch (e) {
      console.error("Firebase Upload Error: ", e);
      return null;
    }
  };

  // 3. Hàm xử lý đăng bài tổng thể
  const handleCreatePost = async () => {
    if (!content.trim() && !selectedMedia) {
      Alert.alert('Thông báo', 'Vui lòng nhập nội dung hoặc chọn ảnh/video');
      return;
    }

    setIsUploading(true);

    try {
      let finalMediaUrl = '';
      
      // Nếu có media, upload lên firebase trước
      if (selectedMedia) {
        const url = await uploadToFirebase(selectedMedia);
        if (!url) throw new Error("Upload ảnh thất bại");
        finalMediaUrl = url;
      }

      const payload = {
        content,
        medias: finalMediaUrl
          ? [
              {
                mediaType: selectedMedia?.type?.includes('video') ? 'VIDEO' : 'IMAGE',
                mediaUrl: finalMediaUrl,
                sortOrder: 1,
              },
            ]
          : [],
      };

      await PostService.createPost(payload);
      Alert.alert('Thành công', 'Bài viết đã được đăng');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể đăng bài lúc này. Vui lòng thử lại.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      className="flex-1 bg-white"
    >
      {/* HEADER */}
      <View className="flex-row justify-between items-center px-4 pt-12 pb-3 border-b border-gray-100">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-1">
          <Ionicons name="close-outline" size={28} color="#000" />
        </TouchableOpacity>
        
        <Text className="text-lg font-bold text-gray-800">Tạo bài viết</Text>

        <TouchableOpacity 
          onPress={handleCreatePost}
          disabled={isUploading || (!content.trim() && !selectedMedia)}
          className={`px-6 py-2 rounded-full ${isUploading || (!content.trim() && !selectedMedia) ? 'bg-gray-200' : 'bg-blue-500'}`}
        >
          {isUploading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className={`font-bold ${!content.trim() && !selectedMedia ? 'text-gray-400' : 'text-white'}`}>
              Đăng
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        
        {/* INPUT AREA */}
        <TextInput
          value={content}
          onChangeText={setContent}
          placeholder="Bạn đang nghĩ gì thế?"
          multiline
          textAlignVertical="top"
          className="text-lg text-gray-800 px-4 min-h-[100px]"
        />

        {/* MEDIA PREVIEW */}
        {selectedMedia && (
          <View className="mt-4 px-4 relative">
            <View className="rounded-2xl overflow-hidden bg-gray-100 border border-gray-200">
              <Image
                source={{ uri: selectedMedia.uri }}
                style={{ aspectRatio: 16 / 9 }}
                className="w-full"
              />
              {selectedMedia.type?.includes('video') && (
                <View className="absolute inset-0 justify-center items-center bg-black/20">
                  <Ionicons name="play-circle" size={50} color="white" />
                </View>
              )}
            </View>
            <TouchableOpacity
              onPress={() => setSelectedMedia(null)}
              className="absolute top-2 right-6 bg-black/60 p-1.5 rounded-full"
            >
              <Ionicons name="close" size={20} color="white" />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* TOOLBAR */}
      <View className="p-4 border-t border-gray-100 bg-white">
        <Text className="text-gray-400 text-[10px] font-bold mb-3 uppercase tracking-tighter">Thêm vào bài viết của bạn</Text>
        <View className="flex-row items-center justify-between bg-gray-50 p-2 rounded-2xl border border-gray-100">
          <TouchableOpacity 
            onPress={handleSelectMedia}
            className="flex-row items-center px-3 py-2"
          >
            <Ionicons name="images" size={24} color="#4ADE80" />
            <Text className="ml-3 text-gray-700 font-semibold">Ảnh/Video</Text>
          </TouchableOpacity>
          
          
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default CreatePostScreen;