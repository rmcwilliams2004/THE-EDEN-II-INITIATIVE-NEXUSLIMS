import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Settings, Activity } from 'lucide-react';
import { LanguageSelector } from './LanguageSelector';

export const VoiceAssistant = () => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState('IDLE');
  const [targetLang, setTargetLang] = useState('en');
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Buffer to handle incoming audio
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);

  const startSession = async () => {
    try {
      setStatus('CONNECTING');
      
      const ws = new WebSocket(`ws://${window.location.host}/live`);
      wsRef.current = ws;

      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      outputAudioCtxRef.current = outputCtx;
      nextStartTimeRef.current = 0;

      ws.onopen = () => {
        setStatus('ACTIVE');
        setIsActive(true);
        // Send init message with language
        ws.send(JSON.stringify({ type: 'init', targetLanguageCode: targetLang }));
        startMic();
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.audio) {
          playAudioChunk(msg.audio);
        }
        if (msg.interrupted) {
          nextStartTimeRef.current = outputCtx.currentTime;
        }
      };

      ws.onclose = () => {
        setIsActive(false);
        setStatus('DISCONNECTED');
        stopMic();
      };

    } catch (err) {
      console.error(err);
      setStatus('ERROR');
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

  const startMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      
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
      
    } catch (err) {
      console.error('Error accessing microphone', err);
    }
  };

  const stopMic = () => {
    if (processorRef.current && audioContextRef.current) {
      processorRef.current.disconnect();
      audioContextRef.current.close();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
    }
  };

  const stopSession = () => {
    if (wsRef.current) {
      wsRef.current.close();
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

        <div className="flex flex-col items-center gap-4">
          <button 
            onClick={isActive ? stopSession : startSession}
            className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 shadow-[0_0_30px_rgba(16,185,129,0.1)] ${isActive ? 'bg-red-500/20 text-red-400 border-2 border-red-500 hover:bg-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.3)] animate-pulse' : 'bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500 hover:bg-emerald-500/30'}`}
          >
            {isActive ? <Mic className="w-12 h-12" /> : <MicOff className="w-12 h-12" />}
          </button>
          <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold flex items-center gap-2">
            <Activity className="w-3 h-3" />
            STATUS: <span className={isActive ? 'text-emerald-400' : 'text-slate-400'}>{status}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
