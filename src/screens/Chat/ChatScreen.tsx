import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, Image,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Linking
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { launchImageLibrary } from 'react-native-image-picker';
import storage from '@react-native-firebase/storage';
import AudioRecord from 'react-native-audio-record';
import { PermissionsAndroid } from 'react-native';
import Sound from 'react-native-sound';
import Video from 'react-native-video';

import { MessageService } from '../../hooks/message.service';
import { TraineeService } from '../../hooks/trainee.service';
import { CoachService } from '../../hooks/coach.service';

// Polyfill cho TextEncoding
import { TextEncoder, TextDecoder } from 'text-encoding';
import { VendorService } from '../../hooks/vendor.service';
const globalAny = globalThis as any;
if (typeof globalAny.TextEncoder === 'undefined') globalAny.TextEncoder = TextEncoder as any;
if (typeof globalAny.TextDecoder === 'undefined') globalAny.TextDecoder = TextDecoder as any;

const BACKEND_URL = 'http://192.168.2.242:8080';

interface Message {
  messageId: string;
  content: string;
  senderId: string;
  messageType: 'TEXT' | 'IMAGE' | 'VIDEO' | 'VOICE';
  createAt: string;
}
type UserRole = 'COACH' | 'TRAINEE' | 'VENDOR';
const SERVICE_MAP: Record<UserRole, any> = {
  'COACH': CoachService,
  'TRAINEE': TraineeService,
  'VENDOR': VendorService,
};


const ChatScreen = ({ route, navigation }: any) => {
  const { receiverId, conversationId: initialConversationId, conversationType } = route?.params || {};

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(initialConversationId);
  const [isConnected, setIsConnected] = useState(false);

  // States cho Voice Recording
  const [isRecording, setIsRecording] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [audioPosition, setAudioPosition] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  const [otherUser, setOtherUser] = useState({
    fullName: route?.params?.receiverName || "Người dùng",
    avatarUrl: route?.params?.receiverAvatar || null as string | null,
  });

  const stompClient = useRef<Client | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const isConnecting = useRef(false);
  const currentSoundRef = useRef<Sound | null>(null);

  /* ============================
      Permission Request
     ============================ */
  const requestMicPermission = async () => {
    if (Platform.OS === 'android') {
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
      );
    }
  };

  /* ============================
      1. Khởi tạo & Load Lịch Sử
     ============================ */
  useEffect(() => {
    // Initialize AudioRecord
    AudioRecord.init({
      sampleRate: 16000,
      channels: 1,
      bitsPerSample: 16,
      wavFile: 'voice_message.wav',
    });

    const initChat = async () => {
      setLoading(true);
      const idStr = await AsyncStorage.getItem('id');
      const token = await AsyncStorage.getItem('accessToken');
      const myRole = await AsyncStorage.getItem('role')?.then(r => r?.replace(/"/g, ''));

      const currentId = idStr ? JSON.parse(idStr) : null;
      setMyId(currentId);

      try {

        if (receiverId && conversationType) {
          const roles = conversationType.split('_');
          const otherRole = roles.find((role: string): role is UserRole => role !== myRole);

          // 4. Lấy service từ Map dựa trên role tìm được
          const service = SERVICE_MAP[otherRole as UserRole];

          if (service) {
            try {
              const response: any = await service.getById(receiverId);
              const userData = Array.isArray(response) ? response[0] : response;
              const finalData = userData?.data || userData;

              if (finalData) {
                setOtherUser({
                  fullName: finalData.fullName || finalData.name || "Người dùng",
                  avatarUrl: finalData.avatarUrl || finalData.image || finalData.logoUrl || null,
                });
              }
            } catch (error) {
              console.error(`Error fetching ${otherRole} data:`, error);
            }
          } else {
            console.warn("Không tìm thấy Service phù hợp cho role:", otherRole);
          }
        }

        if (conversationId) {
          const msgRes = await MessageService.getMessages(conversationId) as any;
          let loadedMessages = msgRes?.data?.content || msgRes?.content || (Array.isArray(msgRes) ? msgRes : []);
          const sorted = [...loadedMessages].sort((a, b) => new Date(a.createAt).getTime() - new Date(b.createAt).getTime());
          setMessages(sorted);
        }
      } catch (error) {
        console.error("[ChatScreen] Error loading history:", error);
      } finally {
        setLoading(false);
      }

      if (token) connectWebSocket(token);
    };

    initChat();
    MessageService.markAsRead(conversationId!);

    return () => {
      if (stompClient.current) stompClient.current.deactivate();
      // Cleanup audio playback
      if (currentSoundRef.current) {
        currentSoundRef.current.stop();
        currentSoundRef.current.release();
        currentSoundRef.current = null;
      }
    };
  }, [conversationId, receiverId]);

  /* ============================
      2. Logic WebSocket (STOMP)
     ============================ */
  const connectWebSocket = (token: string) => {
    // ... (Giữ nguyên logic kết nối socket như code cũ của bạn)
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
        setIsConnected(true);
        isConnecting.current = false;
        setTimeout(() => {
          client.subscribe('/user/queue/messages', (message) => {
            try {
              const newMsg = JSON.parse(message.body);
              setMessages(prev => prev.find(m => m.messageId === newMsg.messageId) ? prev : [...prev, newMsg]);
            } catch (e) {
              console.error(e);
            }
          });
        }, 200);
      },
      onWebSocketClose: () => { setIsConnected(false); isConnecting.current = false; },
    });

    client.activate();
    stompClient.current = client;
  };

  /* ============================
      3. Upload Firebase Helper
     ============================ */
  const uploadToFirebase = async (fileUri: string, messageType: 'IMAGE' | 'VIDEO' | 'VOICE'): Promise<string> => {
    // Lấy extension dựa trên loại file
    const ext = messageType === 'IMAGE' ? 'jpg' : messageType === 'VIDEO' ? 'mp4' : 'm4a';
    const fileName = `chat_${Date.now()}_${myId}.${ext}`;
    const storageRef = storage().ref(`chat_media/${fileName}`);

    await storageRef.putFile(fileUri);
    const downloadUrl = await storageRef.getDownloadURL();
    return downloadUrl;
  };

  /* ============================
      4. Gửi Tin Nhắn Core
     ============================ */
  const sendMessage = async (content: string, messageType: 'TEXT' | 'IMAGE' | 'VIDEO' | 'VOICE') => {
    if (!receiverId) return;
    try {
      const payload = { receiverId, content, messageType };
      await MessageService.send(payload);
    } catch (error) {
      console.error("[ChatScreen] Send error:", error);
      Alert.alert("Lỗi", "Không thể gửi tin nhắn. Vui lòng thử lại.");
    }
  };

  /* ============================
      3.5 Audio Playback Handler
     ============================ */
  const handlePlayAudio = useCallback((messageId: string, audioUrl: string) => {
    // 1. Dừng âm thanh cũ
    if (currentSoundRef.current) {
      currentSoundRef.current.stop();
      currentSoundRef.current.release();
      currentSoundRef.current = null;
    }

    // 2. Nếu bấm vào cái đang chạy thì dừng hẳn
    if (playingMessageId === messageId) {
      setPlayingMessageId(null);
      setAudioPosition(0);
      return;
    }

    // 3. Phát âm thanh mới
    const sound = new Sound(audioUrl, '', (error) => {
      if (error) {
        setPlayingMessageId(null);
        return;
      }

      setPlayingMessageId(messageId);
      setAudioDuration(sound.getDuration() * 1000);
      currentSoundRef.current = sound;

      sound.play((success) => {
        setPlayingMessageId(null);
        setAudioPosition(0);
        sound.release();
        currentSoundRef.current = null;
      });
    });

    // 4. Update Progress - Quan trọng: Dùng biến sound trực tiếp
    const progressInterval = setInterval(() => {
      if (currentSoundRef.current && currentSoundRef.current.isLoaded()) {
        currentSoundRef.current.getCurrentTime((seconds) => {
          setAudioPosition(seconds * 1000);
        });
      } else {
        clearInterval(progressInterval);
      }
    }, 100);
  }, [playingMessageId]); // Đảm bảo dependency đúng

  const handleSendText = useCallback(async () => {
    if (!inputText.trim() || sending) return;
    setSending(true);
    const text = inputText.trim();
    setInputText('');

    // Add message to state immediately
    const newMessage: Message = {
      messageId: `${Date.now()}-${Math.random()}`,
      content: text,
      senderId: myId || '',
      messageType: 'TEXT',
      createAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, newMessage]);

    await sendMessage(text, 'TEXT');
    setSending(false);
  }, [inputText, receiverId, sending, myId]);

  /* ============================
      5. Xử lý Media (Ảnh/Video)
     ============================ */
  const handlePickMedia = async (type: 'photo' | 'video') => {
    const result = await launchImageLibrary({ mediaType: type, quality: 0.8 });
    if (result.didCancel || !result.assets?.length) return;

    setSending(true);
    try {
      const uri = result.assets[0].uri!;
      const msgType = type === 'photo' ? 'IMAGE' : 'VIDEO';
      const fileUrl = await uploadToFirebase(uri, msgType);

      // Add message to state immediately
      const newMessage: Message = {
        messageId: `${Date.now()}-${Math.random()}`,
        content: fileUrl,
        senderId: myId || '',
        messageType: msgType,
        createAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, newMessage]);

      await sendMessage(fileUrl, msgType);
    } catch (error) {
      Alert.alert("Lỗi", "Tải file thất bại.");
    } finally {
      setSending(false);
    }
  };

  /* ============================
      6. Xử lý Voice
     ============================ */
  const startRecording = async () => {
    try {
      console.log('Starting recording...');
      await requestMicPermission();
      AudioRecord.start();
      setIsRecording(true);
    } catch (error) {
      console.log('Start recording error:', error);
      Alert.alert("Lỗi", "Không thể bắt đầu ghi âm");
      setIsRecording(false);
    }
  };

  const stopRecordingAndSend = async () => {
    try {
      setIsRecording(false);
      const audioFile = await AudioRecord.stop();
      console.log('Audio file:', audioFile);

      if (audioFile) {
        setSending(true);
        const fileUrl = await uploadToFirebase(audioFile, 'VOICE');

        // Add message to state immediately
        const newMessage: Message = {
          messageId: `${Date.now()}-${Math.random()}`,
          content: fileUrl,
          senderId: myId || '',
          messageType: 'VOICE',
          createAt: new Date().toISOString(),
        };
        setMessages(prev => [...prev, newMessage]);

        await sendMessage(fileUrl, 'VOICE');
        setSending(false);
      }
    } catch (error) {
      console.log('Stop recording error:', error);
      setIsRecording(false);
    }
  };

  return (
    <View className="flex-1 bg-[#F8F9FA]">
      {/* HEADER (Giữ nguyên) */}
      <View className="flex-row items-center px-4 pt-12 pb-3 bg-white border-b border-gray-100 shadow-sm">
        <TouchableOpacity onPress={() => navigation.goBack()} className="pr-4">
          <Ionicons name="chevron-back" size={24} color="#5D4037" />
        </TouchableOpacity>
        <Image source={{ uri: otherUser.avatarUrl || 'https://via.placeholder.com/100' }} className="w-10 h-10 rounded-full bg-gray-200" />
        <View className="ml-3 flex-1">
          <Text className="font-bold text-gray-800" numberOfLines={1}>{otherUser.fullName}</Text>

        </View>
      </View>

      {/* MESSAGE LIST */}
      {loading ? (
        <View className="flex-1 justify-center"><ActivityIndicator color="#A0522D" /></View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.messageId || Math.random().toString()}
          renderItem={({ item }) => (
            <ChatBubbleItem
              item={item}
              myId={myId}
              otherAvatar={otherUser.avatarUrl}
              playingMessageId={playingMessageId}
              audioPosition={audioPosition}
              audioDuration={audioDuration}
              onPlayAudio={handlePlayAudio}
            />
          )}
          contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
      )}

      {/* INPUT AREA */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View className="px-4 py-3 bg-white border-t border-gray-50 flex-row items-center space-x-2 pb-8">

          {/* Media Pickers */}
          {!isRecording && (
            <>
              <TouchableOpacity onPress={() => handlePickMedia('photo')} className="p-2">
                <Ionicons name="image-outline" size={24} color="#A0522D" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handlePickMedia('video')} className="p-2">
                <Ionicons name="videocam-outline" size={24} color="#A0522D" />
              </TouchableOpacity>
            </>
          )}

          {/* Text Input / Recording Indicator */}
          <View className="flex-1 bg-gray-100 rounded-2xl px-4 py-2 border border-gray-200 flex-row items-center">
            {isRecording ? (
              <Text className="text-red-500 flex-1 font-semibold animate-pulse">Đang ghi âm...</Text>
            ) : (
              <TextInput
                value={inputText}
                onChangeText={setInputText}
                placeholder="Viết tin nhắn..."
                multiline
                className="text-[14px] max-h-20 flex-1"
              />
            )}
          </View>

          {/* Send / Mic Button */}
          {inputText.trim() ? (
            <TouchableOpacity onPress={handleSendText} disabled={sending} className={`w-10 h-10 rounded-full items-center justify-center ${isConnected ? 'bg-[#A0522D]' : 'bg-gray-200'}`}>
              {sending ? <ActivityIndicator size="small" color="white" /> : <Ionicons name="send" size={18} color="white" />}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPressIn={startRecording}
              onPressOut={stopRecordingAndSend}
              disabled={sending}
              className="w-10 h-10 rounded-full items-center justify-center bg-[#A0522D]"
            >
              {sending ? <ActivityIndicator size="small" color="white" /> : <Ionicons name="mic" size={20} color="white" />}
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

/* ============================
    Component con: Bong bóng tin nhắn
   ============================ */
const ChatBubbleItem = ({
  item,
  myId,
  otherAvatar,
  playingMessageId,
  audioPosition,
  audioDuration,
  onPlayAudio
}: {
  item: Message,
  myId: string | null,
  otherAvatar: string | null,
  playingMessageId: string | null,
  audioPosition: number,
  audioDuration: number,
  onPlayAudio: (messageId: string, audioUrl: string) => void
}) => {
  const isMine = item.senderId === myId;
  const isPlaying = playingMessageId === item.messageId;

  // Render Content tùy theo MessageType
  const renderMessageContent = () => {
    switch (item.messageType) {
      case 'IMAGE':
        return (
          <Image
            source={{ uri: item.content }}
            className="w-48 h-48 rounded-xl bg-gray-200"
            resizeMode="cover"
          />
        );
      case 'VIDEO':
        return (
          <View className="w-48 h-48 rounded-xl overflow-hidden bg-black">
            <Video
              source={{ uri: item.content }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
              controls={true}
            />
          </View>
        );
      case 'VOICE':
        const isPlaying = playingMessageId === item.messageId;
        return (
          <View className="flex-row items-center min-w-[140px]">
            <TouchableOpacity
              onPress={() => onPlayAudio(item.messageId, item.content)}
              className={`w-10 h-10 rounded-full items-center justify-center mr-2 ${isMine ? 'bg-orange-400' : 'bg-[#A0522D]'}`}
            >
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={18}
                color="white"
              />
            </TouchableOpacity>
            <Text className={`font-medium ${isMine ? 'text-white' : 'text-gray-800'}`}>
              Tin nhắn thoại {isPlaying && "..."}
            </Text>
          </View>
        );
      case 'TEXT':
      default:
        return (
          <Text className={`text-[15px] ${isMine ? 'text-white' : 'text-gray-800'}`}>
            {item.content}
          </Text>
        );
    }
  };

  return (
    <View className={`flex-row mb-4 ${isMine ? 'justify-end' : 'justify-start'}`}>
      {!isMine && (
        <Image
          source={{ uri: otherAvatar || 'https://via.placeholder.com/50' }}
          className="w-8 h-8 rounded-full mr-2 self-end bg-gray-200"
        />
      )}
      <View
        className={`max-w-[75%] px-4 py-3 rounded-2xl ${isMine ? 'bg-[#A0522D] rounded-tr-none' : 'bg-white border border-gray-100 rounded-tl-none shadow-sm'
          } ${item.messageType === 'IMAGE' ? 'p-1' : ''}`} // Bỏ padding thừa nếu là ảnh
      >
        {renderMessageContent()}
        <Text className={`text-[9px] mt-1 text-right ${isMine ? 'text-orange-100' : 'text-gray-400'}`}>
          {new Date(item.createAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );
};

export default ChatScreen;