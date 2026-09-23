/**
 * Gemini Natural Voice Service
 * Provides studio-quality, softer, human-like voice synthesis using Gemini AI TTS models.
 * Supports multi-language broadcasting (English, Swahili, Spanish, French, Portuguese)
 * with emotional warmth, natural breathing pauses, and agricultural dialect styling.
 */

export type GeminiVoiceName = 'Aoede' | 'Kore' | 'Zephyr' | 'Puck' | 'Fenrir';

export interface GeminiVoiceOption {
  id: GeminiVoiceName;
  name: string;
  tone: string;
  description: string;
  gender: 'Female' | 'Male' | 'Neutral';
}

export const AVAILABLE_GEMINI_VOICES: GeminiVoiceOption[] = [
  {
    id: 'Aoede',
    name: 'Aoede (Warm & Soothing)',
    tone: 'Soft, empathetic, natural human pacing',
    description: 'Gentle and calming tone ideal for agricultural radio and field reports',
    gender: 'Female',
  },
  {
    id: 'Kore',
    name: 'Kore (Calm & Serene)',
    tone: 'Smooth, relaxing, high clarity',
    description: 'Crisp and measured broadcast delivery with natural cadence',
    gender: 'Female',
  },
  {
    id: 'Zephyr',
    name: 'Zephyr (Bright & Friendly)',
    tone: 'Upbeat, conversational, engaging',
    description: 'Clear and articulate community-style announcer voice',
    gender: 'Neutral',
  },
  {
    id: 'Puck',
    name: 'Puck (Warm & Direct)',
    tone: 'Friendly, natural, grounding',
    description: 'Warm and reassuring human tone for weather advisories',
    gender: 'Male',
  },
  {
    id: 'Fenrir',
    name: 'Fenrir (Deep & Measured)',
    tone: 'Rich, authoritative, composed',
    description: 'Dignified and steady meteorological presenter style',
    gender: 'Male',
  },
];

export interface SynthesizeAudioResponse {
  success: boolean;
  audioBase64?: string;
  mimeType?: string;
  sampleRate?: number;
  voiceName?: string;
  locale?: string;
  text?: string;
  fallbackToBrowser?: boolean;
  message?: string;
}

class GeminiNaturalVoiceEngine {
  private audioCtx: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private audioCache = new Map<string, AudioBuffer>();
  private activeVoice: GeminiVoiceName = 'Aoede';
  private isMuted: boolean = false;
  private volume: number = 0.9;
  private isGenerating: boolean = false;

  constructor() {
    // Load voice preference if saved
    try {
      const saved = localStorage.getItem('nexuslims_gemini_voice') as GeminiVoiceName;
      if (saved && AVAILABLE_GEMINI_VOICES.some(v => v.id === saved)) {
        this.activeVoice = saved;
      }
    } catch {}
  }

  public getActiveVoice(): GeminiVoiceName {
    return this.activeVoice;
  }

  public setActiveVoice(voice: GeminiVoiceName): void {
    this.activeVoice = voice;
    try {
      localStorage.setItem('nexuslims_gemini_voice', voice);
    } catch {}
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.gainNode && this.audioCtx) {
      const targetGain = muted ? 0.00001 : this.volume;
      this.gainNode.gain.setValueAtTime(targetGain, this.audioCtx.currentTime);
    }
    if (muted) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.gainNode && this.audioCtx && !this.isMuted) {
      this.gainNode.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);
    }
  }

  public stop(): void {
    if (this.currentSource) {
      try {
        this.currentSource.stop();
        this.currentSource.disconnect();
      } catch {}
      this.currentSource = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  private initAudioContext(): AudioContext {
    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass({ sampleRate: 24000 });
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    if (!this.gainNode) {
      this.gainNode = this.audioCtx.createGain();
      this.gainNode.gain.value = this.isMuted ? 0.00001 : this.volume;
      this.gainNode.connect(this.audioCtx.destination);
    }
    return this.audioCtx;
  }

  /**
   * Convert Base64 16-bit PCM little-endian data to an AudioBuffer
   */
  private pcmToAudioBuffer(ctx: AudioContext, base64Data: string, sampleRate = 24000): AudioBuffer {
    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const int16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768.0;
    }
    const buffer = ctx.createBuffer(1, float32.length, sampleRate);
    buffer.getChannelData(0).set(float32);
    return buffer;
  }

  /**
   * Synthesizes natural speech with Gemini and plays it through Web Audio
   */
  public async speakNatural(
    text: string,
    locale: string = 'en-US',
    voiceName?: GeminiVoiceName,
    onStart?: () => void,
    onEnded?: () => void
  ): Promise<void> {
    if (this.isMuted) return;

    this.stop();
    const selectedVoice = voiceName || this.activeVoice;
    const cacheKey = `${selectedVoice}_${locale}_${text}`;

    const ctx = this.initAudioContext();

    // Check memory cache first
    if (this.audioCache.has(cacheKey)) {
      const cachedBuffer = this.audioCache.get(cacheKey)!;
      this.playBuffer(ctx, cachedBuffer, onStart, onEnded);
      return;
    }

    try {
      this.isGenerating = true;
      const res = await fetch('/api/weather/natural-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          locale,
          voiceName: selectedVoice,
          speed: 1.0,
          warmth: 'soft',
        }),
      });

      if (!res.ok) {
        throw new Error(`TTS server responded with ${res.status}`);
      }

      const data: SynthesizeAudioResponse = await res.json();
      this.isGenerating = false;

      if (data.success && data.audioBase64) {
        let audioBuffer: AudioBuffer;
        if (data.mimeType?.includes('pcm')) {
          audioBuffer = this.pcmToAudioBuffer(ctx, data.audioBase64, data.sampleRate || 24000);
        } else {
          // Decode generic audio formats
          const binary = atob(data.audioBase64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          audioBuffer = await ctx.decodeAudioData(bytes.buffer);
        }

        // Cache for rapid loop reuse
        this.audioCache.set(cacheKey, audioBuffer);

        if (!this.isMuted) {
          this.playBuffer(ctx, audioBuffer, onStart, onEnded);
        }
      } else {
        // Fallback gracefully to enhanced browser synthesis with soft tuning
        this.fallbackBrowserSpeech(text, locale, onStart, onEnded);
      }
    } catch (err) {
      this.isGenerating = false;
      console.warn('[Gemini Voice] Falling back to enhanced browser speech:', err);
      this.fallbackBrowserSpeech(text, locale, onStart, onEnded);
    }
  }

  private playBuffer(
    ctx: AudioContext,
    buffer: AudioBuffer,
    onStart?: () => void,
    onEnded?: () => void
  ): void {
    if (this.isMuted) return;

    try {
      const source = ctx.createBufferSource();
      source.buffer = buffer;

      if (!this.gainNode) {
        this.gainNode = ctx.createGain();
        this.gainNode.connect(ctx.destination);
      }
      this.gainNode.gain.setValueAtTime(this.isMuted ? 0.00001 : this.volume, ctx.currentTime);

      source.connect(this.gainNode);
      source.onended = () => {
        if (this.currentSource === source) {
          this.currentSource = null;
        }
        onEnded?.();
      };

      this.currentSource = source;
      onStart?.();
      source.start();
    } catch (e) {
      console.warn('Audio playback note:', e);
    }
  }

  /**
   * High-quality browser fallback tuned for warmth, softness, and reduced mechanical artifacts
   */
  private fallbackBrowserSpeech(
    text: string,
    locale: string,
    onStart?: () => void,
    onEnded?: () => void
  ): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || this.isMuted) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    // Softer, natural cadence parameters
    utterance.rate = 0.96; // Slightly relaxed pacing for natural breathing
    utterance.pitch = 1.02; // Warm, friendly pitch
    utterance.volume = this.volume;

    const voices = window.speechSynthesis.getVoices();
    // Prioritize natural / neural / premium browser voices
    const langPrefix = locale.slice(0, 2);
    const naturalVoice = voices.find(
      (v) =>
        v.lang.startsWith(langPrefix) &&
        (v.name.includes('Natural') ||
          v.name.includes('Neural') ||
          v.name.includes('Google') ||
          v.name.includes('Samantha') ||
          v.name.includes('Karen') ||
          v.name.includes('Luciana') ||
          v.name.includes('Amelie') ||
          v.name.includes('Paulina'))
    ) || voices.find((v) => v.lang.startsWith(langPrefix));

    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }

    utterance.onstart = () => onStart?.();
    utterance.onend = () => onEnded?.();
    utterance.onerror = () => onEnded?.();

    window.speechSynthesis.speak(utterance);
  }
}

export const geminiVoiceEngine = new GeminiNaturalVoiceEngine();
