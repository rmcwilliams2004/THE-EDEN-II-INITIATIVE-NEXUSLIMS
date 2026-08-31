import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Settings, Activity, AlertCircle, RefreshCw } from 'lucide-react';
import { LanguageSelector } from './LanguageSelector';

export const VoiceAssistant = () => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState('IDLE');
  const [targetLang, setTargetLang] = useState('en');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Buffer to handle incoming audio
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);

  const startSession = async () => {
    try {
      setErrorMessage(null);
      setStatus('CHECKING_MIC');

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone access is not supported in this browser environment.');
      }

      // Check mic access first before establishing WebSocket connection
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
        const isDenied = micErr.name === 'NotAllowedError' || micErr.name === 'PermissionDeniedError' || micErr.message?.includes('Permission denied');
        const userMsg = isDenied 
          ? 'Microphone permission denied. Please allow microphone access in your browser permissions bar or settings.'
          : `Microphone access error: ${micErr.message || 'Unable to capture audio'}`;
        setErrorMessage(userMsg);
        setStatus('MIC_DENIED');
        return;
      }

      setStatus('CONNECTING');
      
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/live`);
      wsRef.current = ws;

      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      outputAudioCtxRef.current = outputCtx;
      nextStartTimeRef.current = 0;

      ws.onopen = () => {
        setStatus('ACTIVE');
        setIsActive(true);
        // Send init message with language
        ws.send(JSON.stringify({ type: 'init', targetLanguageCode: targetLang }));
        bindMicStream(stream);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.audio) {
            playAudioChunk(msg.audio);
          }
          if (msg.interrupted) {
            nextStartTimeRef.current = outputCtx.currentTime;
          }
        } catch (e) {
          console.error('Error parsing server audio payload:', e);
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket connection error:', err);
        setErrorMessage('Failed to connect to edge audio gateway.');
        setStatus('DISCONNECTED');
        stopSession();
      };

      ws.onclose = () => {
        setIsActive(false);
        setStatus('DISCONNECTED');
        stopMic();
      };

    } catch (err: any) {
      console.error('Voice Assistant session error:', err);
      setErrorMessage(err.message || 'Error initializing voice session.');
      setStatus('ERROR');
      stopSession();
    }
  };

  const bindMicStream = (stream: MediaStream) => {
    try {
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = inputCtx;
      
      const source = inputCtx.createMediaStreamSource(stream);
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      
      processor.onaudioprocess = (e) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          const base64 = pcmToBase64(e.inputBuffer.getChannelData(0));
          wsRef.current.send(JSON.stringify({ audio: base64 }));
        }
      };
      
      source.connect(processor);
      processor.connect(inputCtx.destination);
      processorRef.current = processor;
    } catch (err: any) {
      console.error('Error binding microphone processor:', err);
      setErrorMessage('Audio processing error.');
    }
  };

  const playAudioChunk = async (base64Audio: string) => {
    if (!outputAudioCtxRef.current) return;
    const ctx = outputAudioCtxRef.current;
    
    // Decode base64
    const binary = atob(base64Audio);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    
    // Convert 16-bit PCM little endian to Float32Array
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

    if (nextStartTimeRef.current < ctx.currentTime) {
      nextStartTimeRef.current = ctx.currentTime + 0.1; // Small buffer
    }
    source.start(nextStartTimeRef.current);
    nextStartTimeRef.current += audioBuffer.duration;
  };

  const pcmToBase64 = (float32Array: Float32Array) => {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const stopMic = () => {
    if (processorRef.current && audioContextRef.current) {
      try {
        processorRef.current.disconnect();
        audioContextRef.current.close();
      } catch (e) {
        // AudioContext close error handling
      }
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
  };

  const stopSession = () => {
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch (e) {
        // Ignore ws close error
      }
    }
    stopMic();
    setIsActive(false);
    setStatus('IDLE');
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 space-y-8 glass rounded-lg">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold tracking-widest uppercase text-emerald-400">Universal Translator & Agronomist AI</h2>
        <p className="text-slate-400 max-w-lg mx-auto text-sm">
          Connect in real-time to translate speech dynamically or consult with the NexusLIMS AI Assistant. Voice streams at 16kHz directly to the edge.
        </p>
      </div>

      <div className="bg-[#05070a]/80 p-6 rounded-lg border border-slate-700 shadow-2xl flex flex-col items-center gap-6 w-full max-w-md">
        <LanguageSelector targetLang={targetLang} setTargetLang={setTargetLang} disabled={isActive} />

        {errorMessage && (
          <div className="w-full bg-red-950/40 border border-red-500/40 rounded-lg p-3.5 text-xs text-red-200 flex flex-col gap-1.5 animate-in fade-in">
            <div className="flex items-center gap-2 font-bold text-red-400 uppercase text-[10px] tracking-wider">
              <AlertCircle className="w-4 h-4 shrink-0" />
              Microphone Access Notice
            </div>
            <p className="text-slate-300 leading-relaxed">{errorMessage}</p>
            <div className="text-[10px] text-slate-400 mt-1 border-t border-red-500/20 pt-1.5">
              Tip: Ensure microphone permission is enabled for this frame/browser tab, or click the lock icon in your address bar.
            </div>
          </div>
        )}

        <div className="flex flex-col items-center gap-4">
          <button 
            onClick={isActive ? stopSession : startSession}
            className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 shadow-[0_0_30px_rgba(16,185,129,0.1)] ${
              isActive 
                ? 'bg-red-500/20 text-red-400 border-2 border-red-500 hover:bg-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.3)] animate-pulse' 
                : 'bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500 hover:bg-emerald-500/30'
            }`}
          >
            {isActive ? <Mic className="w-12 h-12" /> : <MicOff className="w-12 h-12" />}
          </button>
          <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold flex items-center gap-2">
            <Activity className="w-3 h-3" />
            STATUS: <span className={isActive ? 'text-emerald-400 font-bold' : status === 'MIC_DENIED' ? 'text-red-400 font-bold' : 'text-slate-400'}>{status}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
