import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator, Modal, 
  TextInput, Alert, ScrollView, KeyboardAvoidingView, Platform 
} from 'react-native';
import { PostService } from '../../../hooks/post.service';
import Video from 'react-native-video';
import Ionicons from '@react-native-vector-icons/ionicons';
import { PostDetailModal } from '../../Coach/Blog/MyBlog';
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
}

interface BlogSectionProps {
  coachId: string;
}

const BlogSection: React.FC<BlogSectionProps> = ({ coachId }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isDetailVisible, setIsDetailVisible] = useState(false);

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
    <View className="bg-white mb-3 shadow-sm py-2 rounded-lg mx-4">
      {/* Header */}
      <View className="flex-row items-center px-4 py-2">
        <Image source={{ uri: 'https://via.placeholder.com/100' }} className="w-10 h-10 rounded-full bg-gray-200" />
        <View className="ml-3">
          <Text className="font-bold text-gray-900">{item.coachName}</Text>
          <Text className="text-gray-400 text-[10px]">{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
      </View>

      {/* Nội dung */}
      <Text className="px-4 pb-3 text-gray-800 text-[15px] leading-5">{item.content}</Text>
      
      {/* Media */}
      {item.medias && item.medias.length > 0 && (
        <View className="w-full h-48 bg-gray-100">
           {item.medias[0].mediaType === "VIDEO" ? (
             <Video source={{ uri: item.medias[0].mediaUrl }} className="w-full h-full" resizeMode="cover" controls paused={true} />
           ) : (
             <Image source={{ uri: item.medias[0].mediaUrl }} className="w-full h-full" resizeMode="cover" />
           )}
        </View>
      )}

      {/* Stats */}
      <View className="px-4 py-3 flex-row justify-between border-t border-gray-50">
        <Text className="text-gray-500 text-[11px] font-medium">{item.reactCount ?? 0} lượt thích</Text>
        <Text className="text-gray-500 text-[11px] font-medium">{item.commentCount ?? 0} bình luận</Text>
      </View>

      {/* Action Buttons */}
      <View className="flex-row justify-around border-t border-gray-100 py-1">
        <TouchableOpacity className="flex-row items-center p-2" onPress={() => handleToggleReact(item)}>
          <Ionicons name={item.reactedByMe ? "thumbs-up" : "thumbs-up-outline"} size={20} color={item.reactedByMe ? "#3b82f6" : "#666"} />
          <Text className="ml-2 text-gray-600">Thích</Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-row items-center p-2" onPress={() => { setSelectedPost(item); setIsDetailVisible(true); }}>
          <Ionicons name="chatbubble-outline" size={20} color="#666" />
          <Text className="ml-2 text-gray-600">Bình luận</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View className="py-4">
      <Text className="text-lg font-bold text-gray-900 mb-4 px-4">Bài viết của Coach</Text>
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