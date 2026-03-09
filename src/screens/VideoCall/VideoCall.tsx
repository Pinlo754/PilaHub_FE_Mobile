import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Button,
  PermissionsAndroid,
  Platform,
  StyleSheet,
} from "react-native";
import {
  mediaDevices,
  RTCView,
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  MediaStream,
} from "react-native-webrtc";
import io from "socket.io-client";
import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList } from "../../navigation/AppNavigator";

const SERVER_URL = "http://192.168.1.4:3000";

const configuration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export default function VideoCallScreen() {
  type RouteProps = RouteProp<RootStackParamList, 'VideoCall'>;
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const pc = useRef<RTCPeerConnection | null>(null);
  const socket = useRef<any>(null);

  /* ===============================
     INIT APP (chạy 1 lần)
  =============================== */
  useEffect(() => {
    init();

    return () => {
      cleanup();
    };
  }, []);

  /* ===============================
     INITIAL SETUP
  =============================== */
  const init = async () => {
    await requestPermissions();

    const stream = await mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    setLocalStream(stream);
    createPeerConnection(stream);
    connectSocket();
  };

  const requestPermissions = async () => {
    if (Platform.OS === "android") {
      await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      ]);
    }
  };

  const setupLocalStream = async () => {
    const stream = await mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    setLocalStream(stream);
  };

  /* ===============================
     PEER CONNECTION
  =============================== */
  const createPeerConnection = (stream: MediaStream) => {
    pc.current = new RTCPeerConnection(configuration);

    // ADD TRACK NGAY LẬP TỨC
    stream.getTracks().forEach((track) => {
      pc.current?.addTrack(track, stream);
    });

    (pc.current as any).ontrack = (event: any) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    (pc.current as any).onicecandidate = (event: any) => {
      if (event.candidate) {
        socket.current?.emit("ice-candidate", event.candidate);
      }
    };

    (pc.current as any).oniceconnectionstatechange = () => {
      console.log("ICE State:", pc.current?.iceConnectionState);
    };
  };

  /* ===============================
     SOCKET CONNECTION
  =============================== */
  const connectSocket = () => {
    socket.current = io(SERVER_URL);

    socket.current.on("offer", async (offer: any) => {
      await pc.current?.setRemoteDescription(
        new RTCSessionDescription(offer)
      );

      const answer = await pc.current?.createAnswer();
      await pc.current?.setLocalDescription(answer!);

      socket.current.emit("answer", answer);
    });

    socket.current.on("answer", async (answer: any) => {
      await pc.current?.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
    });

    socket.current.on("ice-candidate", async (candidate: any) => {
      try {
        await pc.current?.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      } catch (e) {
        console.log("ICE error:", e);
      }
    });

    socket.current.on("end-call", () => {
      console.log("Remote ended call");
      resetConnection();
    });
  };

  /* ===============================
     START CALL
  =============================== */
  const startCall = async () => {
    if (!pc.current) return;

    const offer = await pc.current.createOffer();
    await pc.current.setLocalDescription(offer);

    socket.current?.emit("offer", offer);
    console.log("Local stream:", localStream?.getTracks());
  };

  /* ===============================
     END CALL (KHÔNG TẮT CAMERA)
  =============================== */
  const endCall = async () => {
    socket.current?.emit("end-call");
    cleanup();
    const role = await AsyncStorage.getItem('role');
    console.log('User role:', role);
    if (role === 'COACH') {
      navigation.navigate('EndSessionScreen', { selectedId: '' });
    } else {
      navigation.navigate('TraineeFeedback');
    }
  };

  /* ===============================
     RESET CONNECTION
  =============================== */
  const resetConnection = () => {
    if (pc.current) {
      pc.current.close();
    }

    setRemoteStream(null);

    if (localStream) {
      createPeerConnection(localStream);
    }
  };

  /* ===============================
     CLEANUP (khi unmount app)
  =============================== */
  const cleanup = () => {
    localStream?.getTracks().forEach((track) => track.stop());
    pc.current?.close();
    socket.current?.disconnect();
  };

  /* ===============================
     UI
  =============================== */
  return (
    <View style={styles.container}>
      {remoteStream && (
        <RTCView
          streamURL={remoteStream.toURL()}
          style={styles.remoteVideo}
          objectFit="cover"
          zOrder={0}
        />
      )}

      {localStream && (
        <RTCView
          streamURL={localStream.toURL()}
          style={styles.localVideo}
          mirror
          objectFit="cover"
          zOrder={1}
        />
      )}

      <View style={styles.buttonContainer}>
        {!remoteStream ? (
          <Button title="Bắt đầu gọi" onPress={startCall} color="green" />
        ) : (
          <Button title="Tắt máy" onPress={endCall} color="red" />
        )}
      </View>
    </View>
  );
}

/* ===============================
   STYLES
=============================== */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  remoteVideo: { flex: 1 },
  localVideo: {
    width: 120,
    height: 180,
    position: "absolute",
    top: 40,
    right: 20,
    borderRadius: 10,
    backgroundColor: "#333",
    zIndex: 10,             // 🔥 thêm cái này
    elevation: 10,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 50,
    alignSelf: "center",
  },
});