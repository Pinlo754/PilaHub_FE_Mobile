import React, { useEffect, useRef, useState } from "react";
import { View, Button, PermissionsAndroid, Platform, StyleSheet } from "react-native";
import {
  mediaDevices,
  RTCView,
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  MediaStream,
} from "react-native-webrtc";
import io from "socket.io-client";

const SERVER_URL = "http://192.168.88.90:3000";
const configuration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export default function VideoCallScreen() {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const pc = useRef<RTCPeerConnection>(new RTCPeerConnection(configuration));
  const socket = useRef<any>(null);

  useEffect(() => {
    setupWebRTC();
    return () => {
      pc.current?.close();
      socket.current?.disconnect();
    };
  }, []);

  const setupWebRTC = async () => {
    // 1. Request Permissions
    if (Platform.OS === "android") {
      await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      ]);
    }

    // 2. Get Local Stream
    const stream = await mediaDevices.getUserMedia({ video: true, audio: true });
    setLocalStream(stream);
    stream.getTracks().forEach((track) => pc.current.addTrack(track, stream));

    // 3. Listen for Remote Stream (QUAN TRỌNG: Dùng ontrack và set trực tiếp)
    (pc.current as any).ontrack = (event: any) => {
      console.log("Nhận được remote track!");
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    // 4. ICE Candidate handling
    (pc.current as any).onicecandidate = (event: any) => {
      if (event.candidate) {
        socket.current?.emit("ice-candidate", event.candidate);
      }
    };

    (pc.current as any).oniceconnectionstatechange = () => {
      console.log("ICE Connection State:", pc.current.iceConnectionState);
    };

    connectSocket();
  };

  const connectSocket = () => {
    socket.current = io(SERVER_URL);

    socket.current.on("offer", async (offer: any) => {
      console.log("Nhận Offer");
      await pc.current.setRemoteDescription(new RTCSessionDescription(offer));
      
      const answer = await pc.current.createAnswer();
      await pc.current.setLocalDescription(answer);
      socket.current.emit("answer", answer);
    });

    socket.current.on("answer", async (answer: any) => {
      console.log("Nhận Answer");
      await pc.current.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.current.on("ice-candidate", async (candidate: any) => {
      try {
        await pc.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.error("Lỗi thêm ICE:", e);
      }
    });
  };

  const startCall = async () => {
    const offer = await pc.current.createOffer();
    await pc.current.setLocalDescription(offer);
    socket.current.emit("offer", offer);
  };

  // Hàm này dùng để giải phóng bộ nhớ và dừng camera/mic
  const hangUp = () => {
    // 1. Dừng tất cả các track của stream local
    localStream?.getTracks().forEach(track => track.stop());
    
    // 2. Đóng PeerConnection
    if (pc.current) {
      pc.current.close();
      // Khởi tạo lại PC mới để có thể thực hiện cuộc gọi tiếp theo mà không cần reload app
      pc.current = new RTCPeerConnection(configuration);
      // Thiết lập lại các listener cho PC mới (ontrack, onicecandidate...)
      setupPCListeners(); 
    }

    // 3. Reset State UI
    setLocalStream(null);
    setRemoteStream(null);
    
    // 4. Báo cho bên kia biết mình đã tắt máy
    socket.current?.emit("end-call");
  };

  const setupPCListeners = () => {
    (pc.current as any).ontrack = (event: any) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };
    // ... copy lại các listener onicecandidate, oniceconnectionstatechange từ hàm setupWebRTC vào đây
  };

  useEffect(() => {
    // Trong connectSocket, thêm lắng nghe sự kiện end-call
    socket.current?.on("end-call", () => {
      console.log("Đối phương đã tắt máy");
      hangUp(); 
    });
  }, []);

  return (
    <View style={styles.container}>
      {remoteStream && (
        <RTCView
          streamURL={remoteStream.toURL()}
          style={styles.remoteVideo}
          objectFit="cover"
        />
      )}
      {localStream && (
        <RTCView
          streamURL={localStream.toURL()}
          style={styles.localVideo}
          zOrder={10} // Đảm bảo video local nằm trên cùng
          mirror={true}
          objectFit="cover"
        />
      )}
     <View style={styles.buttonContainer}>
        {!remoteStream ? (
          <Button title="Bắt đầu gọi" onPress={startCall} color="green" />
        ) : (
          <Button title="Tắt máy" onPress={hangUp} color="red" />
        )}
      </View>
    </View>
  );
}

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
  },
  buttonContainer: { position: "absolute", bottom: 50, alignSelf: "center" },
});