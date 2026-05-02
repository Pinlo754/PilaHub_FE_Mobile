import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    Image,
    FlatList,
    TouchableOpacity,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ScrollView,
    ActivityIndicator
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { PostService } from '../../../hooks/post.service';
import Header from '../components/Header';
import Video from 'react-native-video';
import { useNavigation } from '@react-navigation/native';
/* ============================ 
    INTERFACES 
   ============================ */
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

interface Comment {
    commentId: string;
    accountName: string;
    content: string;
    createdAt: string;
    replies: any[];
}

/* ============================ 
    MAIN SCREEN: MY BLOG 
   ============================ */
export const MyBlogScreen = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [isDetailVisible, setIsDetailVisible] = useState(false);
    const navigation = useNavigation<any>();
    const [activePostId, setActivePostId] = useState<string | null>(null);
    const [isOptionsModalVisible, setIsOptionsModalVisible] = useState(false);
    const [isConfirmDeleteVisible, setIsConfirmDeleteVisible] = useState(false);
    const [isPaused, setIsPaused] = useState(true);
    /* ============================ 
   MODAL: TÙY CHỌN BÀI VIẾT (MORE OPTIONS)
   ============================ */
    const MoreOptionsModal = ({ visible, onClose, onEdit, onDelete }: any) => (
        <Modal visible={visible} transparent animationType="fade">
            <TouchableOpacity className="flex-1 bg-black/50 justify-end" onPress={onClose}>
                <View className="bg-white rounded-t-3xl p-6 pt-4">
                    <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-6" />
                    <TouchableOpacity className="py-4 border-b border-gray-100 flex-row items-center" onPress={onEdit}>
                        <Ionicons name="pencil-outline" size={20} color="#333" />
                        <Text className="ml-3 text-lg font-medium text-gray-800">Chỉnh sửa bài viết</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="py-4 flex-row items-center" onPress={onDelete}>
                        <Ionicons name="trash-outline" size={20} color="#ef4444" />
                        <Text className="ml-3 text-lg font-medium text-red-500">Xóa bài viết</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Modal>
    );

    /* ============================ 
       MODAL: XÁC NHẬN XÓA
       ============================ */
    const ConfirmationModal = ({ visible, onClose, onConfirm }: any) => (
        <Modal visible={visible} transparent animationType="fade">
            <View className="flex-1 bg-black/50 justify-center items-center px-6">
                <View className="bg-white rounded-2xl p-6 w-full items-center">
                    <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-4">
                        <Ionicons name="alert-circle-outline" size={32} color="#ef4444" />
                    </View>
                    <Text className="text-lg font-bold text-gray-900 mb-2">Xóa bài viết?</Text>
                    <Text className="text-gray-500 text-center mb-8">Hành động này không thể hoàn tác. Bạn có chắc muốn xóa?</Text>

                    <View className="flex-row w-full space-x-3">
                        <TouchableOpacity className="flex-1 py-3 bg-gray-100 rounded-xl items-center" onPress={onClose}>
                            <Text className="font-bold text-gray-700">Hủy</Text>
                        </TouchableOpacity>
                        <TouchableOpacity className="flex-1 py-3 bg-red-500 rounded-xl items-center" onPress={onConfirm}>
                            <Text className="font-bold text-white">Xóa</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    const handleToggleReact = async (post: Post) => {
        // 1. Lưu giá trị cũ để rollback nếu lỗi
        const originalPosts = [...posts];

        // 2. Cập nhật UI ngay lập tức (Optimistic Update)
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

        // 3. Gọi API
        try {
            if (post.reactedByMe) {
                await PostService.removeReact(post.postId);
            } else {
                await PostService.react(post.postId);
            }
        } catch (error) {
            // Nếu lỗi thì hoàn tác dữ liệu cũ
            setPosts(originalPosts);
            Alert.alert("Lỗi", "Không thể thực hiện thao tác này");
        }
    };


    // 1. Fetch data bổ sung (React/Comment) cho toàn bộ list
    const fetchExtraData = async (postList: Post[]) => {
        try {
            const updatedPosts = await Promise.all(
                postList.map(async (post) => {
                    try {
                        const [commentRes, reactRes] = await Promise.all([
                            PostService.getComment(post.postId),
                            PostService.getReact(post.postId)
                        ]);
                        const comments = commentRes || [];
                        const reactData = reactRes || { reactionCount: 0, reactedByMe: false };

                        return {
                            ...post,
                            reactCount: reactData.reactionCount,
                            commentCount: comments.length,
                            reactedByMe: reactData.reactedByMe
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

    const fetchBlogPosts = useCallback(async () => {
        setLoading(true);
        try {
            const res = await PostService.getMyPosts();
            const basePosts = res || [];
            setPosts(basePosts);
            // Gọi load số lượng ngay lập tức
            fetchExtraData(basePosts);
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể tải bài viết');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBlogPosts();
    }, [fetchBlogPosts]);

    // 2. Xử lý More Action (Xóa/Sửa)
    const handleMoreAction = (postId: string) => {
        setActivePostId(postId);
        setIsOptionsModalVisible(true);
    };

    const initiateDelete = () => {
        setIsOptionsModalVisible(false); // Đóng modal chọn
        setTimeout(() => { // Đợi một chút để trải nghiệm mượt hơn
            setIsConfirmDeleteVisible(true); // Mở modal xác nhận
        }, 200);
    };

    // Logic xử lý khi nhấn "Edit" trong OptionsModal
    const handleEdit = () => {
        setIsOptionsModalVisible(false);
        console.log("Edit post:", activePostId);
        // Điều hướng tới màn hình sửa bài viết tại đây
    };

    // Logic thực hiện xóa thật sự
    const executeDelete = async () => {
        if (!activePostId) return;
        try {
            await PostService.deletePost(activePostId);
            setPosts(prev => prev.filter(p => p.postId !== activePostId));
            setIsConfirmDeleteVisible(false);
        } catch (error) {
            Alert.alert("Lỗi", "Không thể xóa bài viết");
        }
    };

    const renderPostItem = ({ item }: { item: Post }) => (
        <View className="bg-white mb-3 shadow-sm py-2">
            {/* Header: Avatar + Tên + More Button */}
            <View className="flex-row justify-between items-center px-4 py-2">
                <View className="flex-row items-center">
                    <Image source={{ uri: 'https://via.placeholder.com/100' }} className="w-10 h-10 rounded-full bg-gray-200" />
                    <View className="ml-3">
                        <Text className="font-bold text-gray-900">{item.coachName}</Text>
                        <Text className="text-gray-400 text-[10px]">{new Date(item.createdAt).toLocaleDateString()}</Text>
                    </View>
                </View>
                <TouchableOpacity onPress={() => handleMoreAction(item.postId)} className="p-2">
                    <Ionicons name="ellipsis-horizontal" size={20} color="#666" />
                </TouchableOpacity>
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
                                    controls = {true}
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
        <View className="flex-1 bg-gray-100">
            <View className="pb-4 pt-6 flex-row items-center justify-center">

                {/* Back button */}
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    className="absolute left-4"
                >
                    <Ionicons name="arrow-back" size={24} color="#A0522D" />
                </TouchableOpacity>

                {/* Title */}
                <Text className="text-foreground text-2xl font-bold text-center">
                    PilaHub
                </Text>
            </View>

            <TouchableOpacity
                className=" z-50 absolute bottom-6 right-6 w-14 h-14 bg-[#A0522D] rounded-full items-center justify-center shadow-lg elevation-5"
                onPress={() => navigation.navigate('CreatePostScreen')}
            >
                <Ionicons name="add" size={30} color="white" />
            </TouchableOpacity>
            {loading && posts.length === 0 ? (
                <View className="flex-1 justify-center"><ActivityIndicator color="#A0522D" /></View>
            ) : (
                <FlatList data={posts} keyExtractor={(item) => item.postId} renderItem={renderPostItem} showsVerticalScrollIndicator={false} />
            )}

            <MoreOptionsModal
                visible={isOptionsModalVisible}
                onClose={() => setIsOptionsModalVisible(false)}
                onEdit={handleEdit}
                onDelete={initiateDelete}
            />

            <ConfirmationModal
                visible={isConfirmDeleteVisible}
                onClose={() => setIsConfirmDeleteVisible(false)}
                onConfirm={executeDelete}
            />

            {selectedPost && <PostDetailModal visible={isDetailVisible} post={selectedPost} onClose={() => setIsDetailVisible(false)} onRefreshPost={() => fetchBlogPosts()} />}

        </View>
    );
};

/* ============================ 
    POST DETAIL MODAL (Comment & Reply UI)
   ============================ */
export const PostDetailModal = ({ visible, post, onClose, onRefreshPost }: any) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loadingCmt, setLoadingCmt] = useState(true);
    const [commentText, setCommentText] = useState('');
    const [replyTarget, setReplyTarget] = useState<Comment | null>(null); // Lưu comment đang được reply

    const [localPost, setLocalPost] = useState(post);
    useEffect(() => {
        setLocalPost(post);
    }, [post]);

    const toggleLikeInModal = async () => {
        // 1. Lưu trạng thái cũ để rollback
        const isReacting = !localPost.reactedByMe;
        const originalPost = { ...localPost };

        // 2. Cập nhật UI Modal ngay lập tức
        setLocalPost({
            ...localPost,
            reactedByMe: isReacting,
            reactCount: (localPost.reactCount ?? 0) + (isReacting ? 1 : -1)
        });

        try {
            if (post.reactedByMe) {
                await PostService.removeReact(post.postId);
            } else {
                await PostService.react(post.postId);
            }
            // 3. Sau khi API xong, báo cho cha cập nhật lại list tổng
            onRefreshPost();
        } catch (error) {
            // Rollback nếu lỗi
            setLocalPost(originalPost);
            Alert.alert("Lỗi", "Thao tác thất bại");
        }
    };

    const handleSendComment = async () => {
        if (!commentText.trim()) return;

        const payload: any = {
            content: commentText,
        };

        // Nếu đang phản hồi một comment cụ thể, thêm parentCommentId vào payload
        if (replyTarget) {
            payload.parentCommentId = replyTarget.commentId;
        }

        try {
            // Gửi postId qua tham số thứ 1, và payload (đã lọc) qua tham số thứ 2
            await PostService.sendComment(post.postId, payload);

            // Reset state sau khi thành công
            setCommentText('');
            setReplyTarget(null);
            loadComments();
        } catch (error) {
            Alert.alert("Lỗi", "Không thể gửi bình luận");
        }
    };

    const loadComments = useCallback(async () => {
        setLoadingCmt(true);
        try {
            const res = await PostService.getComment(post.postId);
            setComments(res || []);
        } finally {
            setLoadingCmt(false);
        }
    }, [post.postId]);

    useEffect(() => { if (visible) loadComments(); }, [visible, loadComments]);

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
            <View className="flex-1 bg-white pt-10">
                <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
                    <TouchableOpacity onPress={onClose} className="p-1"><Ionicons name="chevron-down" size={28} color="black" /></TouchableOpacity>
                    <Text className="ml-4 font-bold text-lg text-gray-900">Bài viết</Text>
                </View>

                <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                    {/* Post Original Content */}
                    <View className="p-4 flex-row items-center">
                        <Image source={{ uri: 'https://via.placeholder.com/100' }} className="w-10 h-10 rounded-full bg-gray-200" />
                        <View className="ml-3">
                            <Text className="font-bold text-gray-900">{localPost.coachName}</Text>
                            <Text className="text-[10px] text-gray-400">{new Date(localPost.createdAt).toLocaleString()}</Text>
                        </View>
                    </View>
                    <Text className="px-4 text-[16px] text-gray-800 mb-4 leading-6">{localPost.content}</Text>
                    {localPost.medias?.map((m: any) => {
                        if (m.mediaType === "VIDEO") {
                            return (
                                <Video
                                    key={m.postMediaId}
                                    source={{ uri: m.mediaUrl }}
                                    className="w-full h-80 bg-black mb-2"
                                    resizeMode="cover"
                                    controls
                                />
                            );
                        }

                        return (
                            <Image
                                key={m.postMediaId}
                                source={{ uri: m.mediaUrl }}
                                className="w-full h-80 bg-gray-50 mb-2"
                                resizeMode="cover"
                            />
                        );
                    })}

                    <View className="px-4 py-4 border-b border-gray-50 flex-row items-center">
                        <TouchableOpacity
                            className="px-4 py-4 border-b border-gray-50 flex-row items-center"
                            onPress={toggleLikeInModal}
                        >
                            <Ionicons
                                name={localPost.reactedByMe ? "heart" : "heart-outline"}
                                size={18}
                                color={localPost.reactedByMe ? "#ef4444" : "#666"}
                            />
                            <Text className="ml-2 font-bold text-gray-700 text-sm">
                                {localPost.reactCount} lượt thích
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* COMMENTS SECTION */}
                    <View className="p-4 pb-24">
                        <Text className="font-bold text-gray-900 mb-5 text-[15px]">Tất cả bình luận</Text>
                        {loadingCmt ? <ActivityIndicator color="#A0522D" /> : (
                            comments.map((comment) => (
                                <View key={comment.commentId} className="mb-6">
                                    <CommentItem
                                        name={comment.accountName}
                                        content={comment.content}
                                        time={comment.createdAt}
                                        onReply={() => setReplyTarget(comment)} // Thêm dòng này
                                    />
                                    {/* Sub-comments tương tự... */}
                                    {comment.replies?.map((reply: any) => (
                                        <CommentItem
                                            key={reply.commentId}
                                            name={reply.accountName}
                                            content={reply.content}
                                            time={reply.createdAt}
                                            isReply
                                            onReply={() => setReplyTarget(comment)} // Reply của reply vẫn tính là reply comment cha
                                        />
                                    ))}
                                </View>
                            ))

                        )}
                    </View>
                </ScrollView>

                {/* Sticky Input Bar */}
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    {/* Hiển thị thanh thông báo đang reply với Preview nội dung */}
                    {replyTarget && (
                        <View className="px-4 py-2 bg-gray-100 border-t border-gray-200">
                            <View className="flex-row justify-between items-center mb-1">
                                <Text className="text-[11px] text-gray-500">
                                    Đang phản hồi <Text className="font-bold text-gray-700">{replyTarget.accountName}</Text>
                                </Text>
                                <TouchableOpacity onPress={() => setReplyTarget(null)}>
                                    <Ionicons name="close-circle" size={18} color="#999" />
                                </TouchableOpacity>
                            </View>

                            {/* Hiển thị nội dung bình luận gốc (giới hạn 1 dòng) */}
                            <Text
                                className="text-xs text-gray-500 italic"
                                numberOfLines={1}
                                ellipsizeMode="tail"
                            >
                                "{replyTarget.content}"
                            </Text>
                        </View>
                    )}

                    {/* Input Bar */}
                    <View className="flex-row items-center px-4 py-3 border-t border-gray-100 bg-white mb-6">
                        <View className="flex-1 bg-gray-100 rounded-2xl px-4 py-2.5">
                            <TextInput
                                placeholder={replyTarget ? "Viết phản hồi..." : "Viết bình luận..."}
                                className="text-sm text-gray-800"
                                multiline
                                value={commentText}
                                onChangeText={setCommentText}
                                autoFocus={!!replyTarget} // Tự động focus khi bấm "Phản hồi"
                            />
                        </View>
                        <TouchableOpacity
                            className="ml-3 p-1"
                            onPress={handleSendComment}
                            disabled={!commentText.trim()} // Vô hiệu hóa nếu chưa nhập chữ
                        >
                            <Ionicons
                                name="send"
                                size={22}
                                color={commentText.trim() ? "#A0522D" : "#ccc"}
                            />
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
};

/* ============================ 
    SUB-COMPONENT: COMMENT ITEM 
   ============================ */
const CommentItem = ({ name, content, time, isReply = false, onReply }: any) => (
    <View className={`flex-row ${isReply ? 'ml-8 mb-4' : ''}`}>
        <Image source={{ uri: 'https://via.placeholder.com/100' }} className={`${isReply ? 'w-6 h-6' : 'w-9 h-9'} rounded-full bg-gray-200`} />
        <View className="flex-1 ml-3">
            <View className="bg-gray-100 p-3 rounded-2xl self-start max-w-[95%]">
                <Text className="font-bold text-[11px] text-gray-900">{name}</Text>
                <Text className="text-gray-800 text-[13.5px] mt-0.5 leading-4">{content}</Text>
            </View>
            <View className="flex-row mt-1.5 ml-1 space-x-5 gap-4">
                <Text className="text-[10px] text-gray-400 font-medium">{new Date(time).toLocaleDateString()}</Text>
                <TouchableOpacity><Text className="text-[10px] font-bold text-gray-500 uppercase">Thích</Text></TouchableOpacity>

                {/* Nút Phản hồi */}
                <TouchableOpacity onPress={onReply}>
                    <Text className="text-[10px] font-bold text-gray-500 uppercase">Phản hồi</Text>
                </TouchableOpacity>
            </View>
        </View>
    </View>
);

