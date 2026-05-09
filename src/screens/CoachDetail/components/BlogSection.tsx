import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator, Modal,
  TextInput, Alert, ScrollView, KeyboardAvoidingView, Platform
} from 'react-native';
import { PostService } from '../../../hooks/post.service';
import Video from 'react-native-video';
import Ionicons from '@react-native-vector-icons/ionicons';
import { PostDetailModal } from '../../Coach/Blog/MyBlog';
import { useNavigation } from '@react-navigation/native';
import { CoachService } from '../../../hooks/coach.service';
// Giả sử PostDetailModal đã được copy hoặc export từ file chung
// Nếu chưa, hãy copy phần PostDetailModal từ MyBlogScreen vào file này

interface Post {
  postId: string;
  coachName: string;
  content: string;
  createdAt: string;
  medias: any[];
  reactCount?: number;
  commentCount?: number;
  reactedByMe?: boolean;
  coachId: string;
}

interface BlogSectionProps {
  coachId: string;
  avatartUrl: string;
}

const BlogSection: React.FC<BlogSectionProps> = ({coachId, avatartUrl }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const navigation = useNavigation<any>();
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [isOptionsModalVisible, setIsOptionsModalVisible] = useState(false);
  const [isConfirmDeleteVisible, setIsConfirmDeleteVisible] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [coachInfo, setCoachInfo] = useState<any>(null);

  const fetchCoach = async () => {
    try {      
      const res = await CoachService.getById(posts[0].coachId);
      setCoachInfo(res);
      console.log("Thông tin coach:", res);
    } catch (error) {
      console.error("Lỗi khi lấy thông tin coach:", error);
    }
  };

  useEffect(() => {
   console.log(avatartUrl)
  }, [coachId]);

  // --- LOGIC XỬ LÝ DỮ LIỆU ---

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await PostService.getCoachPosts(coachId);
      const basePosts = res || [];
      setPosts(basePosts);
      fetchExtraData(basePosts);
    } catch (error) {
      console.error('Error fetching coach posts:', error);
    } finally {
      setLoading(false);
    }
  }, [coachId]);

  const fetchExtraData = async (postList: Post[]) => {
    try {
      const updatedPosts = await Promise.all(
        postList.map(async (post) => {
          try {
            const [commentRes, reactRes] = await Promise.all([
              PostService.getComment(post.postId),
              PostService.getReact(post.postId)
            ]);
            return {
              ...post,
              reactCount: reactRes?.reactionCount || 0,
              commentCount: commentRes?.length || 0,
              reactedByMe: reactRes?.reactedByMe || false
            };
          } catch {
            return post;
          }
        })
      );
      setPosts(updatedPosts);
    } catch (error) {
      console.error("Lỗi đồng bộ dữ liệu:", error);
    }
  };

  useEffect(() => {
    if (coachId) fetchPosts();
  }, [fetchPosts]);

  // --- HÀM TƯƠNG TÁC ---

  const handleToggleReact = async (post: Post) => {
    const originalPosts = [...posts];
    setPosts(prev => prev.map(p => {
      if (p.postId === post.postId) {
        const isReacting = !p.reactedByMe;
        return {
          ...p,
          reactedByMe: isReacting,
          reactCount: (p.reactCount ?? 0) + (isReacting ? 1 : -1)
        };
      }
      return p;
    }));

    try {
      if (post.reactedByMe) {
        await PostService.removeReact(post.postId);
      } else {
        await PostService.react(post.postId);
      }
    } catch (error) {
      setPosts(originalPosts);
      Alert.alert("Lỗi", "Không thể thực hiện thao tác này");
    }
  };

  const renderPostItem = ({ item }: { item: Post }) => (
    <View className="bg-background mb-3 shadow-sm py-2 border-b border-gray-100">
      {/* Header: Avatar + Tên + More Button */}
      <View className="flex-row justify-between items-center px-4 py-2">
        <View className="flex-row items-center">
          <Image source={{ uri: avatartUrl || 'https://via.placeholder.com/100' }} className="w-10 h-10 rounded-full bg-gray-200" />
          <View className="ml-3">
            <Text className="font-bold text-foreground">{item.coachName}</Text>
            <Text className="text-gray-400 text-[10px]">{new Date(item.createdAt).toLocaleDateString()}</Text>
          </View>
        </View>

      </View>

      {/* Content & Medias */}
      <TouchableOpacity onPress={() => { setSelectedPost(item); setIsDetailVisible(true); }} activeOpacity={0.9}>
        <Text className="px-4 pb-3 text-gray-800 text-[15px] leading-5">{item.content}</Text>
        {item.medias && item.medias.length > 0 && (() => {
          const media = item.medias[0];

          if (media.mediaType === "VIDEO") {
            return (
              <View className="w-full h-72 bg-gray-900 justify-center items-center">
                <Video
                  source={{ uri: media.mediaUrl }}
                  style={{ width: '100%', height: 270 }} // Do not rely on layout logic here, use fixed numbers first
                  resizeMode="contain" // Use 'contain' to ensure video isn't being cropped out of existence
                  controls={true}
                />

                {/* Nút Play hiển thị đè lên khi video đang pause */}
                {isPaused && (
                  <TouchableOpacity
                    className="absolute bg-black/40 p-4 rounded-full"
                    onPress={() => setIsPaused(false)}
                  >
                    <Ionicons name="play" size={40} color="white" />
                  </TouchableOpacity>
                )}
              </View>
            );
          }

          return (
            <Image
              source={{ uri: media.mediaUrl }}
              className="w-full h-72 bg-gray-100"
              resizeMode="cover"
            />
          );
        })()}
      </TouchableOpacity>

      {/* Stats Row */}
      <View className="px-4 py-3 flex-row justify-between border-b border-gray-50">
        <View className="flex-row items-center">
          <View className={`rounded-full p-1 ${item.reactedByMe ? 'bg-blue-500' : 'bg-gray-300'}`}>
            <Ionicons name="thumbs-up" size={10} color="white" />
          </View>
          <Text className="ml-2 text-gray-500 text-[11px] font-medium">{item.reactCount ?? 0} lượt thích</Text>
        </View>
        <Text className="text-gray-500 text-[11px] font-medium">{item.commentCount ?? 0} bình luận</Text>
      </View>

      {/* Action Buttons */}
      <View className="flex-row justify-around py-1">
        <TouchableOpacity
          className="flex-row items-center space-x-2 flex-1 justify-center py-2"
          onPress={() => handleToggleReact(item)}
        >
          <Ionicons
            name={item.reactedByMe ? "thumbs-up" : "thumbs-up-outline"}
            size={20}
            color={item.reactedByMe ? "#3b82f6" : "#666"}
          />
          <Text className={`font-medium ml-2 ${item.reactedByMe ? 'text-blue-500' : 'text-gray-600'}`}>
            Thích
          </Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-row items-center space-x-2 flex-1 justify-center py-2" onPress={() => { setSelectedPost(item); setIsDetailVisible(true); }}>
          <Ionicons name="chatbubble-outline" size={20} color="#666" />
          <Text className="text-gray-600 font-medium">Bình luận</Text>
        </TouchableOpacity>
      </View>
    </View >
  );

  return (
    <View className="py-4">
      <Text className="text-lg font-bold text-foreground mb-4 px-4">Bài viết của Coach</Text>
      {loading ? (
        <ActivityIndicator size="small" color="#A0522D" />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.postId}
          renderItem={renderPostItem}
          scrollEnabled={false}
        />
      )}

      {/* Modal Detail */}
      {selectedPost && (
        <PostDetailModal
          visible={isDetailVisible}
          post={selectedPost}
          onClose={() => setIsDetailVisible(false)}
          onRefreshPost={fetchPosts}
        />
      )}
    </View>
  );
};


export default BlogSection;