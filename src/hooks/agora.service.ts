import { createAgoraRtcEngine, IRtcEngine } from 'react-native-agora';

class AgoraService {
  private engine: IRtcEngine | null = null;

  async init(appId: string) {
    this.engine = createAgoraRtcEngine();

    this.engine.initialize({
      appId,
    });

    this.engine.enableVideo();
    this.engine.enableAudio();

    return this.engine;
  }

  getEngine() {
    if (!this.engine) {
      throw new Error('Agora chưa được khởi tạo!');
    }
    return this.engine;
  }

  async joinChannel(token: string, channelName: string, uid: number) {
    const engine = this.getEngine();

    await engine.joinChannel(token, channelName, uid, {});
    engine.startPreview();
  }

  async leaveChannel() {
    const engine = this.getEngine();
    await engine.leaveChannel();
  }

  muteAudio(muted: boolean) {
    const engine = this.getEngine();
    engine.muteLocalAudioStream(muted);
  }

  muteVideo(muted: boolean) {
    const engine = this.getEngine();
    engine.muteLocalVideoStream(muted);
  }

  switchCamera() {
    const engine = this.getEngine();
    engine.switchCamera();
  }
}

export const agoraService = new AgoraService();
