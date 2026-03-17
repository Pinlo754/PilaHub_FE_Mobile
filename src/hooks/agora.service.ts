import { createAgoraRtcEngine, IRtcEngine } from 'react-native-agora';

class AgoraService {
  private engine: IRtcEngine | null = null;

  async init(appId: string) {
  this.engine = createAgoraRtcEngine();

  await this.engine.initialize({ appId });

  try {
    // Ensure channel profile is COMMUNICATION (0) so everyone can publish/subscribe normally
    // @ts-ignore
    if (typeof this.engine.setChannelProfile === 'function') this.engine.setChannelProfile(0);
  } catch (err) {
    // ignore if not available
  }

  await this.engine.enableVideo();
  await this.engine.enableAudio();

  this.engine.startPreview();
  // Ensure client role is broadcaster so the SDK will publish local tracks
  // Use numeric constant for role (1 = broadcaster/host)
  try {
    // Some SDK versions expose setClientRole; call if available
    // @ts-ignore
    if (typeof this.engine.setClientRole === 'function') this.engine.setClientRole(1);
  } catch {
    // ignore if method unavailable
  }

  return this.engine;
}

async joinChannel(token: string, channelName: string, uid: number) {
  const engine = this.getEngine();

  await engine.joinChannel(token, channelName, uid, {});
}

  getEngine() {
    if (!this.engine) {
      throw new Error('Agora chưa được khởi tạo!');
    }
    return this.engine;
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
