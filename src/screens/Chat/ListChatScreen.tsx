import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { MessageService } from '../../hooks/message.service';
import { CoachService } from '../../hooks/coach.service';
import { TraineeService } from '../../hooks/trainee.service';
import { VendorService } from '../../hooks/vendor.service';
import Ionicons from '@react-native-vector-icons/ionicons';

// Polyfill cho TextEncoding
import { TextEncoder, TextDecoder } from 'text-encoding';
import Header from '../Coach/components/Header';
const globalAny = globalThis as any;
if (typeof globalAny.TextEncoder === 'undefined') globalAny.TextEncoder = TextEncoder as any;
if (typeof globalAny.TextDecoder === 'undefined') globalAny.TextDecoder = TextDecoder as any;

const BACKEND_URL = 'http://192.168.2.242:8080';

type UserRole = 'COACH' | 'TRAINEE' | 'VENDOR';
const SERVICE_MAP: Record<UserRole, any> = {
  'COACH': CoachService,
  'TRAINEE': TraineeService,
  'VENDOR': VendorService,
};

interface LastMessage {
  content: string;
  createAt: string;
  senderId: string;
  messageType: 'TEXT' | 'IMAGE' | 'VIDEO' | 'VOICE';
}

interface UserInfo {
  fullName: string;
  avatarUrl: string | null;
}

interface Conversation {
  conversationId: string;
  otherUserId: string;
  lastMessage: LastMessage;
  lastMessageAt: string;
  unreadCount: number;
  otherUserInfo?: UserInfo;
}

const ListChatScreen = ({ navigation }: any) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const stompClient = useRef<Client | null>(null);
  const isConnecting = useRef(false);

  /* ============================
      WebSocket Connection
     ============================ */
  const connectWebSocket = (token: string) => {
    if (stompClient.current?.active || isConnecting.current) return;
    const sockJsUrl = `${BACKEND_URL}/ws`;
    isConnecting.current = true;

    const client = new Client({
      webSocketFactory: () => new SockJS(sockJsUrl),
      connectHeaders: { 'Authorization': `Bearer ${token}` },
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      reconnectDelay: 5000,
      onConnect: () => {
        isConnecting.current = false;
        setTimeout(() => {
          client.subscribe('/user/queue/messages', (message) => {
            try {
              const newMsg = JSON.parse(message.body);
              // Refresh conversations when new message arrives
              fetchConversations();
            } catch (e) {
              console.error(e);
            }
          });
        }, 200);
      },
      onWebSocketClose: () => { isConnecting.current = false; },
    });

    client.activate();
    stompClient.current = client;
  };

  const fetchUserInfo = async (userId: string, myRole: string): Promise<UserInfo | null> => {
    try {
      // Giả định otherRole dựa trên myRole
      let otherRole: UserRole;
      if (myRole === 'COACH') {
        otherRole = 'TRAINEE';
      } else if (myRole === 'TRAINEE') {
        otherRole = 'COACH';
      } else {
        otherRole = 'VENDOR';
      }

      const service = SERVICE_MAP[otherRole];

      if (service) {
        const response: any = await service.getById(userId);
        const userData = Array.isArray(response) ? response[0] : response;
        const finalData = userData?.data || userData;

        if (finalData) {
          return {
            fullName: finalData.fullName || finalData.name || "Người dùng",
            avatarUrl: finalData.avatarUrl || finalData.image || finalData.logoUrl || null,
          };
        }
      }
      return null;
    } catch (error) {
      console.error(`Error fetch user info ${userId}:`, error);
      return null;
    }
  };

  const fetchConversations = async () => {
    try {
      const idStr = await AsyncStorage.getItem('id');
      const myRole = await AsyncStorage.getItem('role')?.then(r => r?.replace(/"/g, ''));
      const currentId = idStr ? JSON.parse(idStr) : null;

      if (currentId && myRole) {
        const response = await MessageService.getConversationByUser(currentId) as any;
        if (response && response.content) {
          const conversationsWithUserInfo = await Promise.all(
            response.content.map(async (conv: Conversation) => {
              const userInfo = await fetchUserInfo(conv.otherUserId, myRole);
              return {
                ...conv,
                otherUserInfo: userInfo,
              };
            })
          );
          setConversations(conversationsWithUserInfo);
        }
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const initListChat = async () => {
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        connectWebSocket(token);
      }
      await fetchConversations();
    };

    initListChat();

    return () => {
      if (stompClient.current) {
        stompClient.current.deactivate();
      }
    };
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchConversations();
  }, []);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getLastMessageDisplay = (lastMessage: LastMessage) => {
    if (!lastMessage) return "No messages yet";

    switch (lastMessage.messageType) {
      case 'IMAGE':
        return 'Đã gửi ảnh';
      case 'VIDEO':
        return 'Đã gửi video';
      case 'VOICE':
        return 'Đã gửi tin nhắn thoại';
      case 'TEXT':
      default:
        return lastMessage.content || "No messages yet";
    }
  };

  const renderItem = ({ item }: { item: Conversation }) => {
    const userInfo = item.otherUserInfo || { fullName: 'User', avatarUrl: null };
    const lastMessageDisplay = getLastMessageDisplay(item.lastMessage);

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('ChatScreen', {
          receiverId: item.otherUserId,
          receiverName: userInfo.fullName,
          receiverAvatar: userInfo.avatarUrl,
          conversationId: item.conversationId
        })}
        className="flex-row items-center px-4 py-4 bg-white border-b border-gray-50"
      >
        {/* Avatar */}
        <View>
          <Image
            source={{ uri: userInfo.avatarUrl || 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png?_=20150327203541' }}
            className="w-14 h-14 rounded-full bg-gray-200"
          />
          {item.unreadCount > 0 && (
            <View className="absolute right-0 top-0 bg-red-500 w-5 h-5 rounded-full items-center justify-center border-2 border-white">
              <Text className="text-white text-[10px] font-bold">{item.unreadCount}</Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View className="flex-1 ml-4">
          <View className="flex-row justify-between items-center">
            <Text className="font-bold text-gray-900 text-base" numberOfLines={1}>
              {userInfo.fullName}
            </Text>
            <Text className="text-gray-400 text-xs ml-2">
              {formatTime(item.lastMessageAt)}
            </Text>
          </View>
          
          <Text 
            className={`text-sm mt-1 ${item.unreadCount > 0 ? 'text-black font-semibold' : 'text-gray-500'}`}
            numberOfLines={1}
          >
            {lastMessageDisplay}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <Header/>
      <View className="px-4 pb-4 border-b border-gray-100 flex-row justify-between items-center">
        <Text className="text-2xl font-bold text-[#5D4037]">Tin nhắn</Text>
        <TouchableOpacity className="p-2 bg-gray-100 rounded-full">
          <Ionicons name="create-outline" size={20} color="#5D4037" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#A0522D" />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.conversationId}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#A0522D" />
          }
          ListEmptyComponent={
            <View className="flex-1 items-center mt-20">
              <Text className="text-gray-400 italic">Không có hội thoại nào</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

export default ListChatScreen;