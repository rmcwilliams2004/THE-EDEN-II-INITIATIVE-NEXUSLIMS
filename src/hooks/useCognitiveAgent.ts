import { useState, useRef, useEffect, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';

export type AgentPersona = 'AGRONOMIST' | 'ENGINEER' | 'MENTOR';

export interface PersonaProfile {
  id: AgentPersona;
  name: string;
  role: string;
  tagline: string;
  accentColor: string; // Tailwind color name / hex
  glowColor: string;
  borderColor: string;
  systemInstruction: string;
  suggestedPrompts: string[];
}

export const AGENT_PERSONAS: Record<AgentPersona, PersonaProfile> = {
  AGRONOMIST: {
    id: 'AGRONOMIST',
    name: 'Dr. Amani Vance',
    role: 'Chief Agronomist & Soil Biochemist',
    tagline: 'Precision Soil Health & Foliar Dosing Protocols',
    accentColor: '#10b981', // Emerald 500
    glowColor: 'rgba(16, 185, 129, 0.45)',
    borderColor: 'border-emerald-500',
    systemInstruction: `You are Dr. Amani Vance, the Chief Agronomist for NexusLIMS. Focus on soil pH balance, crop calendars, foliar dosing curves, NPK nutrient balancing, evapotranspiration (ET0), and bio-fertilizer uptake. You speak with scientific precision, offering clear recommendations on dosage amounts (e.g. 15-20L 1% aqueous solution), spray timing during low-VPD windows, and crop-specific guidance. Keep spoken answers concise, conversational, and broadcast-ready.`,
    suggestedPrompts: [
      'What is our optimal foliar dosing for Maize at pH 6.35?',
      'Check current evapotranspiration (ET0) and recommend watering window.',
      'How does today\'s humidity affect nitrogen absorption?'
    ]
  },
  ENGINEER: {
    id: 'ENGINEER',
    name: 'Cmdr. Ray Tanaka',
    role: 'SIL-3 Safety & Systems Engineer',
    tagline: '600-Bar High Pressure & Thermal Catalysis Safety',
    accentColor: '#f59e0b', // Amber 500 / Orange
    glowColor: 'rgba(245, 158, 11, 0.45)',
    borderColor: 'border-amber-500',
    systemInstruction: `You are Commander Ray Tanaka, the SIL-3 Safety Engineer for the Eden II decentralized reactor system. Focus on 600-bar hydraulic line pressures, catalyst operating temperatures (380-410°C), pump cavitation risks, valve status, and hardware diagnostics. Prioritize system stability and safety interlocks above all else. If an anomaly is mentioned, immediately give clear, actionable diagnostic steps. Speak with calm, authoritative industrial engineering clarity.`,
    suggestedPrompts: [
      'Run diagnostic check on 600-bar hydraulic manifold pressure.',
      'Verify catalyst reactor chamber temperature and thermal margin.',
      'Explain the SIL-3 emergency lockout procedure.'
    ]
  },
  MENTOR: {
    id: 'MENTOR',
    name: 'Mama Elena',
    role: 'Community Farming & Education Mentor',
    tagline: 'Accessible Sustainable Agriculture for Everyone',
    accentColor: '#a855f7', // Purple 500
    glowColor: 'rgba(168, 85, 247, 0.45)',
    borderColor: 'border-purple-500',
    systemInstruction: `You are Mama Elena, a warm and encouraging community farming mentor. Speak simply, encouragingly, and guide the user through basic growing steps, sustainable cultivation, and cooperative clean fertilizer benefits. Avoid overly dense engineering jargon; explain concepts using relatable metaphors and practical farmer wisdom. Be enthusiastic and supportive of beginners, students, and cooperative members.`,
    suggestedPrompts: [
      'I am new to hydroponics—how does this container help our farm?',
      'Can you explain how clean green ammonia replaces bagged fertilizer?',
      'What simple steps should I take before dispensing foliar feed?'
    ]
  }
};

export type CognitiveCoreState = 'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING' | 'ALERT';

export interface UseCognitiveAgentOptions {
  initialPersona?: AgentPersona;
  onTranscript?: (text: string, isUser: boolean) => void;
  onPersonaChange?: (newPersona: AgentPersona) => void;
}

export function useCognitiveAgent(options?: UseCognitiveAgentOptions) {
  const { locale } = useLanguage();
  const [activePersona, setActivePersona] = useState<AgentPersona>(options?.initialPersona || 'AGRONOMIST');
  const [coreState, setCoreState] = useState<CognitiveCoreState>('IDLE');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isMicMuted, setIsMicMuted] = useState<boolean>(false);
  const [audioLevel, setAudioLevel] = useState<number>(0); // 0.0 to 1.0 for dynamic pulsing
  const [frequencyBands, setFrequencyBands] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0]);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [lastUserPrompt, setLastUserPrompt] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const inputAnalyserRef = useRef<AnalyserNode | null>(null);
  const outputAnalyserRef = useRef<AnalyserNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  const personaProfile = AGENT_PERSONAS[activePersona];

  // Convert Float32Array to 16-bit PCM Base64 string for 16kHz audio ingestion
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

  // Real-time Audio Visualizer animation loop (RMS & 8-band Frequency analysis)
  const startAudioTelemetryLoop = useCallback(() => {
    const updateLevels = () => {
      let activeAnalyser: AnalyserNode | null = null;
      
      if (coreState === 'SPEAKING' && outputAnalyserRef.current) {
        activeAnalyser = outputAnalyserRef.current;
      } else if ((coreState === 'LISTENING' || coreState === 'THINKING') && inputAnalyserRef.current && !isMicMuted) {
        activeAnalyser = inputAnalyserRef.current;
      }

      if (activeAnalyser) {
        const bufferLength = activeAnalyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        activeAnalyser.getByteFrequencyData(dataArray);

        // Calculate average RMS energy
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / (bufferLength * 255); // 0 to 1
        setAudioLevel(Math.min(1, avg * 2.2)); // Dynamic expansion

        // 8 Frequency bands for visual wave ribbons
        const step = Math.floor(bufferLength / 8);
        const bands: number[] = [];
        for (let b = 0; b < 8; b++) {
          let bSum = 0;
          for (let k = b * step; k < (b + 1) * step; k++) {
            bSum += dataArray[k] || 0;
          }
          bands.push(parseFloat(((bSum / (step * 255))).toFixed(3)));
        }
        setFrequencyBands(bands);
      } else {
        // Idle gentle breathing pulse
        setAudioLevel(prev => Math.max(0.04, prev * 0.9));
        setFrequencyBands([0.05, 0.08, 0.1, 0.08, 0.05, 0.03, 0.02, 0.01]);
      }

      animFrameRef.current = requestAnimationFrame(updateLevels);
    };

    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(updateLevels);
  }, [coreState, isMicMuted]);

  useEffect(() => {
    startAudioTelemetryLoop();
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [startAudioTelemetryLoop]);

  // Play audio chunk received from Gemini Live API (24kHz PCM)
  const playAudioChunk = useCallback((base64Audio: string) => {
    if (!outputAudioCtxRef.current) {
      outputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      outputAnalyserRef.current = outputAudioCtxRef.current.createAnalyser();
      outputAnalyserRef.current.fftSize = 64;
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

      // Connect through Analyser for Orb reactions
      if (outputAnalyserRef.current) {
        source.connect(outputAnalyserRef.current);
        outputAnalyserRef.current.connect(ctx.destination);
      } else {
        source.connect(ctx.destination);
      }

      const currentTime = ctx.currentTime;
      if (nextStartTimeRef.current < currentTime) {
        nextStartTimeRef.current = currentTime;
      }

      source.start(nextStartTimeRef.current);
      nextStartTimeRef.current += audioBuffer.duration;
      setCoreState('SPEAKING');

      source.onended = () => {
        if (ctx.currentTime >= nextStartTimeRef.current - 0.06) {
          setCoreState('LISTENING');
        }
      };
    } catch (err) {
      console.error('Error decoding/playing agent audio frame:', err);
    }
  }, []);

  // Stop mic and hardware streams
  const stopHardwareStreams = useCallback(() => {
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

  // Connect / Re-initiate Gemini Live session
  const connectSession = useCallback(async (targetPersona: AgentPersona = activePersona) => {
    try {
      setErrorMessage(null);
      setCoreState('THINKING');

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live`;

      if (wsRef.current) {
        wsRef.current.close();
      }

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = async () => {
        setIsConnected(true);
        setCoreState('LISTENING');

        // Transmit initialization handshake with persona directive
        const profile = AGENT_PERSONAS[targetPersona];
        ws.send(JSON.stringify({
          type: 'init',
          persona: targetPersona,
          locale,
          systemInstruction: profile.systemInstruction,
        }));

        // Request microphone access
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              channelCount: 1,
              sampleRate: 16000,
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            }
          });
          mediaStreamRef.current = stream;

          const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
          inputAudioCtxRef.current = inputCtx;
          
          const source = inputCtx.createMediaStreamSource(stream);
          const analyser = inputCtx.createAnalyser();
          analyser.fftSize = 64;
          inputAnalyserRef.current = analyser;

          const processor = inputCtx.createScriptProcessor(4096, 1, 1);
          processor.onaudioprocess = (e) => {
            if (ws.readyState === WebSocket.OPEN && !isMicMuted) {
              const channelData = e.inputBuffer.getChannelData(0);
              const base64 = pcmToBase64(channelData);
              ws.send(JSON.stringify({ audio: base64 }));
            }
          };

          source.connect(analyser);
          analyser.connect(processor);
          processor.connect(inputCtx.destination);
          processorRef.current = processor;
        } catch (micErr: any) {
          console.warn('Microphone access not available or denied; running in simulated audio mode:', micErr);
          setErrorMessage('Mic disabled. Running in text & audio broadcast mode.');
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.audio) {
            playAudioChunk(msg.audio);
          }
          if (msg.transcript) {
            setLiveTranscript(msg.transcript);
            options?.onTranscript?.(msg.transcript, false);
          }
          if (msg.interrupted) {
            if (outputAudioCtxRef.current) {
              outputAudioCtxRef.current.close().catch(() => {});
              outputAudioCtxRef.current = null;
            }
            nextStartTimeRef.current = 0;
            setCoreState('LISTENING');
          }
        } catch (err) {
          console.error('Failed to parse agent message:', err);
        }
      };

      ws.onerror = (err) => {
        console.error('Agent WebSocket connection error:', err);
        setErrorMessage('Agent live stream link error.');
        setCoreState('ALERT');
      };

      ws.onclose = () => {
        setIsConnected(false);
        setCoreState('IDLE');
      };
    } catch (err: any) {
      console.error('Failed to connect cognitive agent:', err);
      setErrorMessage(err.message || 'Connection failed');
      setCoreState('ALERT');
    }
  }, [activePersona, locale, isMicMuted, pcmToBase64, playAudioChunk, options]);

  // Disconnect session
  const disconnectSession = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    stopHardwareStreams();
    if (outputAudioCtxRef.current) {
      outputAudioCtxRef.current.close().catch(() => {});
      outputAudioCtxRef.current = null;
    }
    setIsConnected(false);
    setCoreState('IDLE');
    setLiveTranscript('');
  }, [stopHardwareStreams]);

  // Hot-swap AI Persona on the fly
  const switchPersona = useCallback((newPersona: AgentPersona) => {
    setActivePersona(newPersona);
    options?.onPersonaChange?.(newPersona);
    const profile = AGENT_PERSONAS[newPersona];

    // Push new directive payload directly across active WebSocket without audio tearing
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'switch_persona',
        persona: newPersona,
        locale,
        systemInstruction: profile.systemInstruction,
      }));
    } else {
      // Re-connect with target persona if not active
      connectSession(newPersona);
    }
  }, [locale, connectSession, options]);

  // Send a text prompt / query to the agent
  const sendUserPrompt = useCallback((promptText: string) => {
    if (!promptText.trim()) return;
    setLastUserPrompt(promptText);
    setCoreState('THINKING');

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'text_input',
        text: promptText,
        persona: activePersona,
      }));
    } else {
      // Auto connect and execute
      connectSession(activePersona).then(() => {
        setTimeout(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              type: 'text_input',
              text: promptText,
              persona: activePersona,
            }));
          }
        }, 500);
      });
    }
  }, [activePersona, connectSession]);

  const toggleMicMute = useCallback(() => {
    setIsMicMuted(prev => !prev);
  }, []);

  return {
    activePersona,
    personaProfile,
    coreState,
    isConnected,
    isMicMuted,
    audioLevel,
    frequencyBands,
    liveTranscript,
    lastUserPrompt,
    errorMessage,
    connectSession,
    disconnectSession,
    switchPersona,
    sendUserPrompt,
    toggleMicMute,
  };
}
