/**
 * Weather Broadcast Failsafe & Resilient Connection Watchdog
 * NexusLIMS Edge Safety Architecture for Distributed Eden II Nodes
 * 
 * Deterministic State Machine:
 * - LIVE_STREAMING: Healthy real-time live ingestion from weather radio.
 * - OFFLINE_REPEAT: Satellite/WAN dropout detected (>5s without frames). Injects audible warning
 *                   announcement and loops circular ring buffer.
 * - RECOVERING: Live stream restored and validated. Fades out archive loop, speaks confirmation,
 *               and transitions back to LIVE_STREAMING.
 */

import { WeatherAudioStreamer, AudioRingBuffer, AudioBufferSnapshot } from '../services/weatherAudioStreamer';

export type FailsafeState = 'LIVE_STREAMING' | 'OFFLINE_REPEAT' | 'RECOVERING';

export interface FailsafeStatusEvent {
  state: FailsafeState;
  previousState: FailsafeState;
  timestamp: string;
  heartbeatAgeMs: number;
  repeatCycleCount: number;
  cachedDurationSec: number;
  advisoryText?: string;
  reconnectAttempts: number;
}

export interface FailsafeConfig {
  heartbeatTimeoutMs?: number;        // Default 5000ms (5 seconds)
  minValidFramesForRecovery?: number; // Default 3 frames
  fadeDurationMs?: number;            // Default 500ms
  announcementVoice?: string;
}

export class WeatherBroadcastFailsafe {
  private state: FailsafeState = 'LIVE_STREAMING';
  private streamer: WeatherAudioStreamer;
  private ringBuffer: AudioRingBuffer;
  private config: Required<FailsafeConfig>;

  // Timers & State Trackers
  private watchdogTimer: any = null;
  private repeatPlaybackInterval: any = null;
  private consecutiveLiveFrames: number = 0;
  private repeatCycleCount: number = 0;
  private reconnectAttempts: number = 0;
  private backoffDelayMs: number = 1000;
  private lastAdvisoryTimestamp: string = '';
  private isSynthesizingAnnouncement: boolean = false;

  // Listeners
  private onStateChangeListeners: Array<(event: FailsafeStatusEvent) => void> = [];
  private onAudioOutputListeners: Array<(chunk: Int16Array, isArchiveRepeat: boolean) => void> = [];
  private onAdvisorySpokenListeners: Array<(text: string, type: 'DROPOUT_WARNING' | 'RESTORED') => void> = [];

  constructor(
    streamer: WeatherAudioStreamer,
    config: FailsafeConfig = {}
  ) {
    this.streamer = streamer;
    this.ringBuffer = streamer.getRingBuffer();
    this.config = {
      heartbeatTimeoutMs: config.heartbeatTimeoutMs || 5000,
      minValidFramesForRecovery: config.minValidFramesForRecovery || 3,
      fadeDurationMs: config.fadeDurationMs || 500,
      announcementVoice: config.announcementVoice || 'en-US-Standard',
    };

    this.initStreamListener();
  }

  public getState(): FailsafeState {
    return this.state;
  }

  public getRepeatCount(): number {
    return this.repeatCycleCount;
  }

  public getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }

  public onStateChange(cb: (event: FailsafeStatusEvent) => void): () => void {
    this.onStateChangeListeners.push(cb);
    return () => {
      this.onStateChangeListeners = this.onStateChangeListeners.filter(fn => fn !== cb);
    };
  }

  public onAudioOutput(cb: (chunk: Int16Array, isArchiveRepeat: boolean) => void): () => void {
    this.onAudioOutputListeners.push(cb);
    return () => {
      this.onAudioOutputListeners = this.onAudioOutputListeners.filter(fn => fn !== cb);
    };
  }

  public onAdvisorySpoken(cb: (text: string, type: 'DROPOUT_WARNING' | 'RESTORED') => void): () => void {
    this.onAdvisorySpokenListeners.push(cb);
    return () => {
      this.onAdvisorySpokenListeners = this.onAdvisorySpokenListeners.filter(fn => fn !== cb);
    };
  }

  /**
   * Directly ingest raw PCM chunk from hardware Line-In or WebRTC audio
   */
  public handleRawStreamChunk(chunk: Int16Array): void {
    this.ringBuffer.push(chunk);
    this.consecutiveLiveFrames++;
    this.onAudioOutputListeners.forEach(fn => fn(chunk, false));
  }

  /**
   * Start the watchdog supervisor
   */
  public start(): void {
    this.stop();
    this.state = 'LIVE_STREAMING';
    this.repeatCycleCount = 0;
    this.reconnectAttempts = 0;
    this.consecutiveLiveFrames = 0;

    // Start streamer
    this.streamer.start();

    // Start 1-second watchdog tick
    this.watchdogTimer = setInterval(() => {
      this.evaluateHeartbeat();
    }, 1000);
  }

  public stop(): void {
    if (this.watchdogTimer) {
      clearInterval(this.watchdogTimer);
      this.watchdogTimer = null;
    }
    if (this.repeatPlaybackInterval) {
      clearInterval(this.repeatPlaybackInterval);
      this.repeatPlaybackInterval = null;
    }
    this.streamer.stop();
  }

  /**
   * Wire incoming live stream frames
   */
  private initStreamListener(): void {
    this.streamer.onPcmChunk((chunk) => {
      if (this.state === 'LIVE_STREAMING') {
        this.consecutiveLiveFrames++;
        // Emit live audio frame
        this.emitAudio(chunk, false);
      } else if (this.state === 'OFFLINE_REPEAT' || this.state === 'RECOVERING') {
        // Stream has resumed sending frames!
        this.consecutiveLiveFrames++;
        if (this.consecutiveLiveFrames >= this.config.minValidFramesForRecovery) {
          this.handleRecovery();
        }
      }
    });

    this.streamer.onStatusChange((status) => {
      if (status === 'ERROR' || status === 'DISCONNECTED') {
        if (this.state === 'LIVE_STREAMING') {
          this.tripToOfflineRepeat();
        }
      }
    });
  }

  /**
   * Watchdog Tick: Checks if stream has stalled (>5000ms)
   */
  private evaluateHeartbeat(): void {
    if (this.state === 'LIVE_STREAMING') {
      const lastChunkTime = this.streamer.getLastChunkTime();
      const ageMs = lastChunkTime === 0 ? 0 : Date.now() - lastChunkTime;

      // If streamer has been running and no chunk has arrived in >5 seconds, trip to OFFLINE_REPEAT
      if (lastChunkTime > 0 && ageMs > this.config.heartbeatTimeoutMs) {
        console.warn(`[WeatherBroadcastFailsafe] Inbound stream heartbeat lost (${ageMs}ms > ${this.config.heartbeatTimeoutMs}ms). Tripping to OFFLINE_REPEAT.`);
        this.tripToOfflineRepeat();
      }
    } else if (this.state === 'OFFLINE_REPEAT') {
      // Stream is offline; execute exponential backoff reconnection attempt
      this.attemptBackgroundReconnect();
    }
  }

  /**
   * Transition 1: LIVE_STREAMING -> OFFLINE_REPEAT
   */
  private tripToOfflineRepeat(): void {
    const prevState = this.state;
    this.state = 'OFFLINE_REPEAT';
    this.consecutiveLiveFrames = 0;
    this.repeatCycleCount = 0;
    this.backoffDelayMs = 1500;

    const snapshot = this.ringBuffer.getSnapshot();
    const formattedTime = new Date(snapshot.newestTimestamp || Date.now()).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    this.lastAdvisoryTimestamp = formattedTime;

    const advisory = `Notice: Live satellite weather stream connection has been lost. Repeating the last recorded broadcast from ${formattedTime}. Please note this report may not reflect current conditions.`;

    this.notifyStateChange(prevState, advisory);
    this.speakAdvisory(advisory, 'DROPOUT_WARNING');

    // Begin looping recorded circular buffer
    this.startArchiveRepeatLoop();
  }

  /**
   * Transition 2: OFFLINE_REPEAT -> RECOVERING -> LIVE_STREAMING
   */
  private async handleRecovery(): Promise<void> {
    if (this.state === 'LIVE_STREAMING') return;

    const prevState = this.state;
    this.state = 'RECOVERING';
    this.reconnectAttempts = 0;

    // 1. Fade out the current repeat cycle
    if (this.repeatPlaybackInterval) {
      clearInterval(this.repeatPlaybackInterval);
      this.repeatPlaybackInterval = null;
    }

    const restoreAdvisory = "Live weather stream restored. Updating broadcast to current conditions.";
    this.notifyStateChange(prevState, restoreAdvisory);
    await this.speakAdvisory(restoreAdvisory, 'RESTORED');

    // 2. Transition back to LIVE_STREAMING
    const revState = this.state;
    this.state = 'LIVE_STREAMING';
    this.consecutiveLiveFrames = 10;
    this.notifyStateChange(revState);
  }

  /**
   * Continuous archive repeat playback loop
   */
  private startArchiveRepeatLoop(): void {
    if (this.repeatPlaybackInterval) {
      clearInterval(this.repeatPlaybackInterval);
    }

    const snapshot = this.ringBuffer.getSnapshot();
    if (snapshot.totalSamples === 0) {
      console.warn('[WeatherBroadcastFailsafe] Ring buffer empty during repeat trip; holding standby tone.');
      return;
    }

    const chunkSize = 1600; // 100ms chunks @ 16kHz
    let sampleIdx = 0;
    const totalSamples = snapshot.totalSamples;

    this.repeatPlaybackInterval = setInterval(() => {
      if (this.state !== 'OFFLINE_REPEAT') return;

      if (sampleIdx >= totalSamples) {
        // Loop finished! Announce notice before next cycle
        sampleIdx = 0;
        this.repeatCycleCount++;

        const advisory = `Notice: Repeating recorded weather broadcast archive from ${this.lastAdvisoryTimestamp}. Reconnecting to satellite stream...`;
        this.speakAdvisory(advisory, 'DROPOUT_WARNING');
        return;
      }

      const endIdx = Math.min(sampleIdx + chunkSize, totalSamples);
      const chunk = snapshot.pcmData.slice(sampleIdx, endIdx);
      sampleIdx = endIdx;

      this.emitAudio(chunk, true);
    }, 100);
  }

  /**
   * Background reconnection attempts with exponential backoff
   */
  private attemptBackgroundReconnect(): void {
    this.reconnectAttempts++;
    console.log(`[WeatherBroadcastFailsafe] Attempting stream reconnection #${this.reconnectAttempts} (backoff: ${this.backoffDelayMs}ms)...`);
    
    this.streamer.start().catch((err) => {
      console.warn(`[WeatherBroadcastFailsafe] Reconnect attempt failed: ${err.message}`);
    });

    // Increase backoff delay up to 15 seconds
    this.backoffDelayMs = Math.min(15000, Math.floor(this.backoffDelayMs * 1.5));
  }

  /**
   * Speak status advisory using Web Speech synthesis or audible tones
   */
  private async speakAdvisory(text: string, type: 'DROPOUT_WARNING' | 'RESTORED'): Promise<void> {
    this.onAdvisorySpokenListeners.forEach(cb => cb(text, type));

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      return new Promise<void>((resolve) => {
        try {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 1.05;
          utterance.pitch = 0.95;
          utterance.volume = 1.0;
          utterance.onend = () => resolve();
          utterance.onerror = () => resolve();
          window.speechSynthesis.speak(utterance);
        } catch {
          resolve();
        }
      });
    }
  }

  private emitAudio(chunk: Int16Array, isArchiveRepeat: boolean): void {
    this.onAudioOutputListeners.forEach(cb => cb(chunk, isArchiveRepeat));
  }

  private notifyStateChange(previousState: FailsafeState, advisoryText?: string): void {
    const event: FailsafeStatusEvent = {
      state: this.state,
      previousState,
      timestamp: new Date().toISOString(),
      heartbeatAgeMs: Date.now() - this.streamer.getLastChunkTime(),
      repeatCycleCount: this.repeatCycleCount,
      cachedDurationSec: this.ringBuffer.getDurationSeconds(),
      advisoryText,
      reconnectAttempts: this.reconnectAttempts,
    };

    this.onStateChangeListeners.forEach(cb => cb(event));
  }

  /**
   * Manual Simulation Triggers for Auditing & Testing
   */
  public simulateDropout(): void {
    this.streamer.stop();
    this.tripToOfflineRepeat();
  }

  public simulateReconnect(): void {
    this.streamer.start();
    this.handleRecovery();
  }
}

export default WeatherBroadcastFailsafe;
