import { Room, RemoteAudioTrack, RemoteParticipant, RemoteTrackPublication } from 'livekit-server-sdk';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';

// Initialize the Gemini API client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export class TranslationService {
  private room: Room;
  private session: any;

  constructor() {
    this.room = new Room();
  }

  /**
   * Initializes a new LiveKit Agent Session for bidirectional translation.
   * Connects the WebRTC SFU room to the Gemini Live API over WebSockets.
   */
  async initializeAgent(roomName: string, sourceLang: string, targetLang: string) {
    const livekitUrl = process.env.LIVEKIT_URL || 'ws://localhost:7880';
    const agentToken = process.env.LIVEKIT_AGENT_TOKEN || '';

    // 1. Connect to the LiveKit Room as the Translation Agent
    await this.room.connect(livekitUrl, agentToken);
    console.log(`[TranslationService] Connected to LiveKit room: ${roomName}`);

    // 2. Initialize the Gemini Live API WebSocket
    this.session = await ai.live.connect({
      model: 'gemini-3.5-live-translate-preview',
      config: {
        responseModalities: [Modality.AUDIO],
        systemInstruction: `You are a real-time translator. Translate all incoming speech from ${sourceLang} to ${targetLang}. Output only the translation in the target language. Do not output text.`,
        generationConfig: {
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } }
          }
        }
      },
      callbacks: {
        onmessage: (message: LiveServerMessage) => this.handleGeminiMessage(message),
        onclose: () => console.log('[TranslationService] Gemini session closed.'),
      }
    });

    console.log(`[TranslationService] Gemini Live session connected and waiting for audio.`);

    // 3. Listen for incoming participant audio tracks
    this.room.on('trackSubscribed', (
      track: RemoteAudioTrack, 
      publication: RemoteTrackPublication, 
      participant: RemoteParticipant
    ) => {
      if (track.kind === 'audio') {
        this.processIncomingAudio(track, participant);
      }
    });
  }

  /**
   * Pipes 16kHz PCM audio from the WebRTC track into the Gemini Live WebSocket.
   */
  private processIncomingAudio(track: RemoteAudioTrack, participant: RemoteParticipant) {
    console.log(`[TranslationService] Subscribed to audio from ${participant.identity}`);
    
    // Abstracted event listener representing WebRTC frame extraction
    // In production Node.js LiveKit SDK, this involves reading from a track's AudioStream
    (track as any).on('audioFrame', (frame: any) => {
      if (this.session) {
        // Stream raw 16-bit 16kHz PCM directly to Gemini
        this.session.sendRealtimeInput({
          audio: {
            data: Buffer.from(frame.data).toString('base64'),
            mimeType: 'audio/pcm;rate=16000'
          }
        }).catch((err: any) => console.error("Realtime input err:", err));
      }
    });
  }

  /**
   * Receives 24kHz synthesized audio from Gemini and routes it back into the LiveKit Room.
   */
  private handleGeminiMessage(message: LiveServerMessage) {
    const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
    if (audioData) {
      // Decode base64 24kHz PCM from Gemini
      const pcmBuffer = Buffer.from(audioData, 'base64');
      this.publishTranslatedAudio(pcmBuffer);
    }
  }

  /**
   * Publishes the translated audio back to the original WebRTC Room.
   */
  private publishTranslatedAudio(pcmBuffer: Buffer) {
    // Note: In the livekit-server-sdk for Node, this requires instantiating an AudioSource
    // and writing frames to a LocalAudioTrack. Represented conceptually below.
    console.log(`[TranslationService] Publishing ${pcmBuffer.length} bytes of translated audio back to room.`);
    
    /* 
    const source = new AudioSource(24000, 1);
    const track = LocalAudioTrack.createAudioTrack('translation-out', source);
    await this.room.localParticipant.publishTrack(track);
    await source.write(pcmBuffer);
    */
  }

  /**
   * Cleans up all active connections.
   */
  disconnect() {
    this.room.disconnect();
    console.log('[TranslationService] Disconnected from room.');
  }
}
