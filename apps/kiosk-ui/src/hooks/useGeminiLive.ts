import { useState, useRef, useCallback } from 'react';
import type { CropIconKey } from '../components/IconCropSelector';

export interface KioskParsedCommand {
  ui_icon: CropIconKey | 'water_drop' | 'gallon_jug';
  ui_fill_level: number;
  valve_status: 'locked' | 'ready' | 'dispensing' | 'complete' | 'emergency_stop';
  speaker_lang?: string;
  farmer_name?: string;
  eco_credits_earned?: number;
}

export function useGeminiLive() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastAudioTranscript, setLastAudioTranscript] = useState<string>('');
  const [currentCommand, setCurrentCommand] = useState<KioskParsedCommand>({
    ui_icon: 'maize',
    ui_fill_level: 20,
    valve_status: 'locked',
  });
  const [connectionStatus, setConnectionStatus] = useState<'IDLE' | 'CONNECTING' | 'CONNECTED' | 'ERROR'>('IDLE');

  const wsRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  const startVoiceSession = useCallback(async () => {
    try {
      setConnectionStatus('CONNECTING');
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live-relay`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = async () => {
        setConnectionStatus('CONNECTED');
        setIsListening(true);

        // Access Microphone
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 16000,
          }
        });
        mediaStreamRef.current = stream;

        const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        audioContextRef.current = inputCtx;
        const source = inputCtx.createMediaStreamSource(stream);
        const processor = inputCtx.createScriptProcessor(4096, 1, 1);

        processor.onaudioprocess = (e) => {
          if (ws.readyState === WebSocket.OPEN) {
            const inputData = e.inputBuffer.getChannelData(0);
            // Convert to 16-bit PCM
            const pcm16 = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
              pcm16[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
            }
            const base64 = btoa(String.fromCharCode(...new Uint8Array(pcm16.buffer)));
            ws.send(JSON.stringify({ audio: base64 }));
          }
        };

        source.connect(processor);
        processor.connect(inputCtx.destination);
        processorRef.current = processor;
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          
          if (msg.transcript) {
            setLastAudioTranscript(msg.transcript);
            
            // Parse <cmd> JSON tags from audio response
            const cmdMatch = msg.transcript.match(/<cmd>([\s\S]*?)<\/cmd>/);
            if (cmdMatch && cmdMatch[1]) {
              try {
                const parsed = JSON.parse(cmdMatch[1].trim());
                setCurrentCommand(prev => ({ ...prev, ...parsed }));
              } catch (parseErr) {
                console.error('Error parsing <cmd> payload:', parseErr);
              }
            }
          }

          if (msg.audio) {
            setIsSpeaking(true);
            playAudioChunk(msg.audio);
          }
        } catch (err) {
          console.error('Kiosk WS message error:', err);
        }
      };

      ws.onclose = () => {
        stopVoiceSession();
      };

      ws.onerror = () => {
        setConnectionStatus('ERROR');
        stopVoiceSession();
      };
    } catch (err) {
      console.error('Failed to start voice session:', err);
      setConnectionStatus('ERROR');
      stopVoiceSession();
    }
  }, []);

  const playAudioChunk = (base64: string) => {
    try {
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const int16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const buffer = audioCtx.createBuffer(1, float32Array.length, 24000);
      buffer.getChannelData(0).set(float32Array);
      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtx.destination);
      source.start();
      source.onended = () => setIsSpeaking(false);
    } catch (e) {
      console.error('Error playing audio chunk:', e);
      setIsSpeaking(false);
    }
  };

  const stopVoiceSession = useCallback(() => {
    setIsListening(false);
    setIsSpeaking(false);
    setConnectionStatus('IDLE');

    if (processorRef.current && audioContextRef.current) {
      try {
        processorRef.current.disconnect();
        audioContextRef.current.close();
      } catch (e) {}
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    if (wsRef.current) {
      try { wsRef.current.close(); } catch (e) {}
      wsRef.current = null;
    }
  }, []);

  return {
    isListening,
    isSpeaking,
    lastAudioTranscript,
    currentCommand,
    setCurrentCommand,
    connectionStatus,
    startVoiceSession,
    stopVoiceSession,
  };
}
