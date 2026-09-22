import { useState, useRef, useEffect, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';

export interface UseGeminiLiveOptions {
  locale?: string;
  autoConnect?: boolean;
  onTranscript?: (text: string) => void;
  onError?: (err: string) => void;
}

export type LiveSessionStatus = 
  | 'IDLE' 
  | 'CHECKING_MIC' 
  | 'CONNECTING' 
  | 'ACTIVE' 
  | 'SPEAKING' 
  | 'LISTENING' 
  | 'DISCONNECTED' 
  | 'MIC_DENIED' 
  | 'ERROR';

export function useGeminiLive(options?: UseGeminiLiveOptions) {
  const langCtx = useLanguage();
  const activeLocale = options?.locale || langCtx?.locale || 'en-US';

  const [status, setStatus] = useState<LiveSessionStatus>('IDLE');
  const [isActive, setIsActive] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastTranscript, setLastTranscript] = useState<string>('');
  const [isAudioOutputPlaying, setIsAudioOutputPlaying] = useState<boolean>(false);

  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);

  // Convert Float32Array to 16-bit PCM Base64 string
  const pcmToBase64 = useCallback((float32Array: Float32Array): string => {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }, []);

  // Play audio chunk received from Gemini Live
  const playAudioChunk = useCallback((base64Audio: string) => {
    if (!outputAudioCtxRef.current) {
      outputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    const ctx = outputAudioCtxRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    try {
      const binary = atob(base64Audio);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      const float32Data = new Float32Array(bytes.length / 2);
      const dataView = new DataView(bytes.buffer);
      for (let i = 0; i < float32Data.length; i++) {
        float32Data[i] = dataView.getInt16(i * 2, true) / 32768.0;
      }

      const audioBuffer = ctx.createBuffer(1, float32Data.length, 24000);
      audioBuffer.getChannelData(0).set(float32Data);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);

      const currentTime = ctx.currentTime;
      if (nextStartTimeRef.current < currentTime) {
        nextStartTimeRef.current = currentTime;
      }

      source.start(nextStartTimeRef.current);
      nextStartTimeRef.current += audioBuffer.duration;
      setIsAudioOutputPlaying(true);

      source.onended = () => {
        if (ctx.currentTime >= nextStartTimeRef.current - 0.05) {
          setIsAudioOutputPlaying(false);
        }
      };
    } catch (err) {
      console.error('Error decoding/playing Gemini Live audio chunk:', err);
    }
  }, []);

  // Stop microphone capture and clean up tracks
  const stopMic = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (inputAudioCtxRef.current) {
      inputAudioCtxRef.current.close().catch(() => {});
      inputAudioCtxRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  // Stop active live session
  const stopSession = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    stopMic();
    if (outputAudioCtxRef.current) {
      outputAudioCtxRef.current.close().catch(() => {});
      outputAudioCtxRef.current = null;
    }
    setIsActive(false);
    setStatus('IDLE');
  }, [stopMic]);

  // Bind microphone stream to PCM audio processor
  const bindMicStream = useCallback((stream: MediaStream) => {
    try {
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      inputAudioCtxRef.current = inputCtx;

      const source = inputCtx.createMediaStreamSource(stream);
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (e) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          const channelData = e.inputBuffer.getChannelData(0);
          const base64 = pcmToBase64(channelData);
          wsRef.current.send(JSON.stringify({ audio: base64 }));
        }
      };

      source.connect(processor);
      processor.connect(inputCtx.destination);
      processorRef.current = processor;
    } catch (err: any) {
      console.error('Error binding microphone processor:', err);
      setErrorMessage('Audio recording processor failed to attach.');
    }
  }, [pcmToBase64]);

  // Construct Gemini Live System Instruction with Zero-Touch Region Injector
  const buildSystemPrompt = useCallback((targetLocale: string) => {
    return [
      `CRITICAL DIRECTIVE: You are physically located in region [${targetLocale}]. You must instantly adapt all spoken audio responses, dialect comprehension, and idiom usage to the primary language of this locale. Do not speak English unless explicitly addressed in English.`,
      `You are the NexusLIMS Voice Agronomist & Edge Operator for Eden II Micro-DGA modular containers.`,
      `You assist smallholder farmers and field engineers with fertilizer dispensing, soil moisture analysis, NPK formulation, and kiosk safety diagnostics.`,
      `Keep verbal answers concise, clear, and actionable for outdoor voice clarity.`
    ].join('\n\n');
  }, []);

  // Start live session
  const startSession = useCallback(async (overrideLocale?: string) => {
    const targetLocale = overrideLocale || activeLocale;

    try {
      setErrorMessage(null);
      setStatus('CHECKING_MIC');

      if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone access is not supported in this browser environment.');
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          }
        });
        mediaStreamRef.current = stream;
      } catch (micErr: any) {
        const isDenied =
          micErr.name === 'NotAllowedError' ||
          micErr.name === 'PermissionDeniedError' ||
          micErr.message?.includes('Permission denied');
        const userMsg = isDenied
          ? 'Microphone permission denied. Please allow microphone access in your browser.'
          : `Microphone access error: ${micErr.message || 'Unable to capture audio'}`;
        setErrorMessage(userMsg);
        setStatus('MIC_DENIED');
        if (options?.onError) options.onError(userMsg);
        return;
      }

      setStatus('CONNECTING');

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      outputAudioCtxRef.current = outputCtx;
      nextStartTimeRef.current = 0;

      ws.onopen = () => {
        setStatus('ACTIVE');
        setIsActive(true);

        const promptDirective = buildSystemPrompt(targetLocale);

        // Send initialization payload with dynamic localized system prompt
        ws.send(
          JSON.stringify({
            type: 'init',
            locale: targetLocale,
            targetLanguageCode: targetLocale,
            systemInstruction: promptDirective
          })
        );

        bindMicStream(stream);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.audio) {
            playAudioChunk(msg.audio);
          }
          if (msg.transcript) {
            setLastTranscript(msg.transcript);
            if (options?.onTranscript) options.onTranscript(msg.transcript);
          }
          if (msg.interrupted && outputAudioCtxRef.current) {
            nextStartTimeRef.current = outputAudioCtxRef.current.currentTime;
          }
          if (msg.error) {
            setErrorMessage(msg.error);
            if (options?.onError) options.onError(msg.error);
          }
        } catch (e) {
          console.error('Error parsing live payload:', e);
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket connection error:', err);
        setErrorMessage('Failed to connect to edge audio gateway.');
        setStatus('DISCONNECTED');
        if (options?.onError) options.onError('Failed to connect to edge audio gateway.');
        stopSession();
      };

      ws.onclose = () => {
        setIsActive(false);
        setStatus('DISCONNECTED');
        stopMic();
      };

    } catch (err: any) {
      console.error('Voice Assistant session error:', err);
      const msg = err.message || 'Error initializing voice session.';
      setErrorMessage(msg);
      setStatus('ERROR');
      if (options?.onError) options.onError(msg);
      stopSession();
    }
  }, [activeLocale, bindMicStream, buildSystemPrompt, options, playAudioChunk, stopMic, stopSession]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopSession();
    };
  }, [stopSession]);

  return {
    isActive,
    status,
    errorMessage,
    lastTranscript,
    isAudioOutputPlaying,
    activeLocale,
    startSession,
    stopSession,
    buildSystemPrompt
  };
}
