import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Radio,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  RefreshCw,
  AlertTriangle,
  Play,
  Square,
  Globe,
  Sliders,
  Sparkles,
  Activity,
  Layers,
  Clock,
  ShieldCheck,
  Zap,
  Info,
  ChevronRight,
  Headphones,
  Mic,
  Server,
  Terminal,
} from 'lucide-react';
import {
  WeatherAudioStreamer,
  PRESET_WEATHER_STATIONS,
  WeatherStreamStation,
} from '../../services/weatherAudioStreamer';
import {
  WeatherBroadcastFailsafe,
  FailsafeState,
  FailsafeStatusEvent,
} from '../../safety/weatherBroadcastFailsafe';
import {
  GeminiWeatherTranslator,
  SUPPORTED_BROADCAST_LOCALES,
  TranslationLocale,
} from '../../services/geminiWeatherTranslator';
import { useLanguage } from '../../context/LanguageContext';

export interface WeatherRadioPlayerProps {
  className?: string;
  onAnnounceAlert?: (text: string) => void;
}

// Check for environment-configured stream URL
const metaEnv = typeof import.meta !== 'undefined' ? (import.meta as any).env || {} : {};
const ENV_STREAM_URL = (
  metaEnv.VITE_WEATHER_STREAM_URL ||
  metaEnv.VITE_NOAA_AUDIO_STREAM_URL ||
  ''
).trim();

export const WeatherRadioPlayer: React.FC<WeatherRadioPlayerProps> = ({
  className = '',
  onAnnounceAlert,
}) => {
  // Built-in list with environment-provided station if available
  const allStations: WeatherStreamStation[] = [
    ...(ENV_STREAM_URL
      ? [
          {
            id: 'env-configured',
            name: 'Environment Configured Weather Ingress',
            callSign: 'ENV-RELAY',
            frequency: 'IP Stream Ingress',
            region: 'Configured Network Node',
            streamUrl: ENV_STREAM_URL,
            format: 'mp3' as const,
            bitrateKbps: 128,
          },
        ]
      : []),
    ...PRESET_WEATHER_STATIONS,
  ];

  // Core Engine References
  const streamerRef = useRef<WeatherAudioStreamer | null>(null);
  const failsafeRef = useRef<WeatherBroadcastFailsafe | null>(null);
  const translatorRef = useRef<GeminiWeatherTranslator | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Hardware Line-In / navigator.mediaDevices references
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaSourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const mediaProcessorNodeRef = useRef<ScriptProcessorNode | null>(null);

  const { locale: globalLocale, setLocale: setGlobalLocale } = useLanguage();

  // Component UI State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedStation, setSelectedStation] = useState<WeatherStreamStation>(allStations[0]);
  const [useHardwareLineIn, setUseHardwareLineIn] = useState<boolean>(false);
  const [selectedLocale, setSelectedLocale] = useState<TranslationLocale>(() => {
    const matched = SUPPORTED_BROADCAST_LOCALES.find(
      (l) => l.code === globalLocale || l.code.startsWith(globalLocale.slice(0, 2))
    );
    return matched || SUPPORTED_BROADCAST_LOCALES[0];
  });
  const [failsafeState, setFailsafeState] = useState<FailsafeState>('LIVE_STREAMING');
  const [volume, setVolume] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  
  // Real-time Metrics & Auto-Reconnection State
  const [rmsVolume, setRmsVolume] = useState<number>(0);
  const [bufferDurationSec, setBufferDurationSec] = useState<number>(0);
  const [bufferMemoryMb, setBufferMemoryMb] = useState<number>(0);
  const [repeatCount, setRepeatCount] = useState<number>(0);
  const [reconnectAttempts, setReconnectAttempts] = useState<number>(0);
  const [maxReconnectAttempts] = useState<number>(8);
  const [isAutoReconnecting, setIsAutoReconnecting] = useState<boolean>(false);
  const [reconnectCountdown, setReconnectCountdown] = useState<number | null>(null);
  const [latestAdvisory, setLatestAdvisory] = useState<string | null>(null);
  const [liveTranscript, setLiveTranscript] = useState<string>('Standby. Ingesting 16kHz carrier stream from satellite relay...');
  const [isAiConnected, setIsAiConnected] = useState<boolean>(false);
  const [eventLogs, setEventLogs] = useState<Array<{ time: string; msg: string; type: 'info' | 'warn' | 'success' | 'alert' }>>([]);

  // Auto-reconnect timer references
  const reconnectTimeoutRef = useRef<any>(null);
  const reconnectCountdownIntervalRef = useRef<any>(null);
  const lastAudioActivityRef = useRef<number>(Date.now());

  // Audio wave visualizer data
  const audioHistoryRef = useRef<number[]>(new Array(48).fill(0.05));

  const addLog = useCallback((msg: string, type: 'info' | 'warn' | 'success' | 'alert' = 'info') => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setEventLogs(prev => [{ time, msg, type }, ...prev.slice(0, 24)]);
  }, []);

  // Stop hardware media stream tracks
  const stopHardwareMediaStream = useCallback(() => {
    if (mediaProcessorNodeRef.current) {
      try {
        mediaProcessorNodeRef.current.disconnect();
      } catch {
        // ignore
      }
      mediaProcessorNodeRef.current = null;
    }

    if (mediaSourceNodeRef.current) {
      try {
        mediaSourceNodeRef.current.disconnect();
      } catch {
        // ignore
      }
      mediaSourceNodeRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      mediaStreamRef.current = null;
    }
  }, []);

  // Start Hardware Audio Ingress using navigator.mediaDevices
  const startHardwareMediaStream = useCallback(async () => {
    stopHardwareMediaStream();

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      throw new Error('navigator.mediaDevices API is not supported in this browser environment');
    }

    addLog('Requesting Line-In / Tuner input via navigator.mediaDevices API...', 'info');

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        channelCount: 1,
        sampleRate: 16000,
      },
    });

    mediaStreamRef.current = stream;

    // Track disconnection / device change listeners
    stream.getAudioTracks().forEach((track) => {
      track.addEventListener('ended', () => {
        addLog('Hardware audio track ended. Triggering auto-reconnection pipeline...', 'warn');
        if (isPlaying) {
          triggerAutoReconnect('Media track disconnected');
        }
      });
    });

    // Create AudioContext and processing node
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new AudioCtx({ sampleRate: 16000 });
    }

    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    const ctx = audioContextRef.current;
    const source = ctx.createMediaStreamSource(stream);
    mediaSourceNodeRef.current = source;

    // Ingest chunks using ScriptProcessor for linear PCM16 conversion
    const processor = ctx.createScriptProcessor(2048, 1, 1);
    mediaProcessorNodeRef.current = processor;

    processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      lastAudioActivityRef.current = Date.now();

      // Compute RMS
      let sum = 0;
      const pcm16 = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        const s = Math.max(-1, Math.min(1, inputData[i]));
        sum += s * s;
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }
      const rms = Math.sqrt(sum / inputData.length);
      setRmsVolume(rms);

      // Update history
      audioHistoryRef.current.shift();
      audioHistoryRef.current.push(Math.max(0.08, rms * 2.5));

      // Route to failsafe & translator
      if (failsafeRef.current) {
        failsafeRef.current.handleRawStreamChunk(pcm16);
      }
    };

    source.connect(processor);
    processor.connect(ctx.destination);

    addLog('navigator.mediaDevices Line-In stream connected successfully (16kHz Mono).', 'success');
  }, [addLog, stopHardwareMediaStream, isPlaying]);

  // Auto-reconnection trigger with exponential backoff
  const triggerAutoReconnect = useCallback((reason: string) => {
    if (!isPlaying) return;

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (reconnectCountdownIntervalRef.current) {
      clearInterval(reconnectCountdownIntervalRef.current);
    }

    setIsAutoReconnecting(true);
    setReconnectAttempts((prev) => {
      const nextAttempt = prev + 1;
      if (nextAttempt > maxReconnectAttempts) {
        addLog(`Auto-reconnection limit reached (${maxReconnectAttempts} attempts). Broadcast halted for operator review.`, 'alert');
        setIsAutoReconnecting(false);
        setReconnectCountdown(null);
        return prev;
      }

      // Calculate exponential backoff delay with jitter (1s, 2s, 4s, 8s up to 15s)
      const baseDelay = Math.min(1000 * Math.pow(1.6, nextAttempt - 1), 15000);
      const jitter = Math.floor(Math.random() * 500);
      const totalDelay = Math.round(baseDelay + jitter);
      const delaySeconds = Math.ceil(totalDelay / 1000);

      setReconnectCountdown(delaySeconds);
      addLog(`Stream link interrupted (${reason}). Auto-reconnecting in ${delaySeconds}s (Attempt ${nextAttempt}/${maxReconnectAttempts})...`, 'warn');

      // Countdown ticker
      let remaining = delaySeconds;
      reconnectCountdownIntervalRef.current = setInterval(() => {
        remaining -= 1;
        setReconnectCountdown(remaining > 0 ? remaining : null);
        if (remaining <= 0) {
          clearInterval(reconnectCountdownIntervalRef.current);
        }
      }, 1000);

      // Schedule reconnection attempt
      reconnectTimeoutRef.current = setTimeout(async () => {
        try {
          addLog(`Executing stream auto-reconnect attempt #${nextAttempt}...`, 'info');
          if (useHardwareLineIn) {
            await startHardwareMediaStream();
          } else {
            if (streamerRef.current) {
              await streamerRef.current.reconnect();
            }
          }
          setIsAutoReconnecting(false);
          setReconnectCountdown(null);
          setReconnectAttempts(0);
          addLog('Stream link re-established successfully.', 'success');
        } catch (err: any) {
          addLog(`Auto-reconnect attempt #${nextAttempt} failed: ${err?.message || err}`, 'alert');
          triggerAutoReconnect('Retry failed');
        }
      }, totalDelay);

      return nextAttempt;
    });
  }, [isPlaying, maxReconnectAttempts, addLog, useHardwareLineIn, startHardwareMediaStream]);

  // Cancel any pending reconnection timers
  const cancelAutoReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (reconnectCountdownIntervalRef.current) {
      clearInterval(reconnectCountdownIntervalRef.current);
      reconnectCountdownIntervalRef.current = null;
    }
    setIsAutoReconnecting(false);
    setReconnectCountdown(null);
  }, []);

  // Initialize Audio, Safety Pipeline & Device Watcher
  useEffect(() => {
    const streamer = new WeatherAudioStreamer(selectedStation, 6);
    const failsafe = new WeatherBroadcastFailsafe(streamer, {
      heartbeatTimeoutMs: 5000,
      minValidFramesForRecovery: 3,
      fadeDurationMs: 500,
    });
    const translator = new GeminiWeatherTranslator({
      locale: selectedLocale.code,
      volume,
      onConnectionStatus: (connected) => {
        setIsAiConnected(connected);
      },
      onTranscript: (text) => {
        setLiveTranscript(text);
      },
      onError: (err) => {
        addLog(`Translator notice: ${err}`, 'warn');
      },
    });

    streamerRef.current = streamer;
    failsafeRef.current = failsafe;
    translatorRef.current = translator;

    // Listen to streamer volume
    streamer.onVolume((rms) => {
      setRmsVolume(rms);
      lastAudioActivityRef.current = Date.now();
      audioHistoryRef.current.shift();
      audioHistoryRef.current.push(Math.max(0.08, rms));
    });

    // Wire failsafe state changes
    failsafe.onStateChange((evt: FailsafeStatusEvent) => {
      setFailsafeState(evt.state);
      setRepeatCount(evt.repeatCycleCount);
      setBufferDurationSec(evt.cachedDurationSec);

      if (evt.advisoryText) {
        setLatestAdvisory(evt.advisoryText);
        addLog(evt.advisoryText, evt.state === 'OFFLINE_REPEAT' ? 'alert' : 'success');
      }
    });

    // Wire audio output from failsafe to translator
    failsafe.onAudioOutput((chunk) => {
      translator.ingestPcmChunk(chunk);
    });

    failsafe.onAdvisorySpoken((text) => {
      if (onAnnounceAlert) {
        onAnnounceAlert(text);
      }
    });

    // Periodic buffer & stream health watchdog
    const bufferInterval = setInterval(() => {
      if (streamerRef.current) {
        const ring = streamerRef.current.getRingBuffer();
        setBufferDurationSec(ring.getDurationSeconds());
        setBufferMemoryMb(ring.getMemoryUsageMb());
      }
    }, 1000);

    // Watch for media device changes (e.g. plugging in hardware SDR / USB audio)
    const handleDeviceChange = () => {
      addLog('navigator.mediaDevices event: Audio hardware topology changed.', 'info');
      if (isPlaying && useHardwareLineIn) {
        triggerAutoReconnect('Hardware device topology changed');
      }
    };

    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    }

    return () => {
      clearInterval(bufferInterval);
      cancelAutoReconnect();
      stopHardwareMediaStream();
      failsafe.stop();
      translator.disconnect();
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.removeEventListener) {
        navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      }
    };
  }, []);

  // Visualizer Canvas Animation Loop
  useEffect(() => {
    let animationId: number;

    const renderCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Background grid lines
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
      ctx.lineWidth = 1;
      for (let y = 10; y < height; y += 15) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      const bars = audioHistoryRef.current;
      const barWidth = width / bars.length;

      for (let i = 0; i < bars.length; i++) {
        const val = bars[i];
        const barHeight = Math.max(4, val * height * 0.9);
        const x = i * barWidth;
        const y = height / 2 - barHeight / 2;

        let fillColor = 'rgba(16, 185, 129, 0.85)'; // Emerald for LIVE
        if (failsafeState === 'OFFLINE_REPEAT' || isAutoReconnecting) {
          fillColor = 'rgba(245, 158, 11, 0.9)'; // Amber for REPEAT / RECONNECTING
        } else if (failsafeState === 'RECOVERING') {
          fillColor = 'rgba(6, 182, 212, 0.9)'; // Cyan for RECOVERING
        }

        ctx.fillStyle = fillColor;
        ctx.fillRect(x + 1, y, barWidth - 2, barHeight);
      }

      animationId = requestAnimationFrame(renderCanvas);
    };

    renderCanvas();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [failsafeState, isAutoReconnecting]);

  // Handlers
  const handleTogglePlayback = async () => {
    if (isPlaying) {
      cancelAutoReconnect();
      stopHardwareMediaStream();
      failsafeRef.current?.stop();
      translatorRef.current?.disconnect();
      setIsPlaying(false);
      addLog('Weather broadcast playback halted by operator.', 'info');
    } else {
      setIsPlaying(true);
      setReconnectAttempts(0);
      try {
        if (useHardwareLineIn) {
          await startHardwareMediaStream();
        } else {
          failsafeRef.current?.start();
        }
        await translatorRef.current?.connect();
        addLog(
          useHardwareLineIn
            ? 'Ingesting raw RF via navigator.mediaDevices audio line-in.'
            : `Connected to stream ${selectedStation.callSign} (${selectedStation.frequency}). Target dialect: ${selectedLocale.name}.`,
          'success'
        );
      } catch (err: any) {
        addLog(`Playback start failed: ${err?.message || err}`, 'alert');
        triggerAutoReconnect('Initial connection fault');
      }
    }
  };

  const handleStationChange = (st: WeatherStreamStation) => {
    setSelectedStation(st);
    setUseHardwareLineIn(false);
    stopHardwareMediaStream();
    if (streamerRef.current) {
      streamerRef.current.setStation(st);
      addLog(`Switched station to ${st.callSign} [${st.frequency}] (${st.region}).`, 'info');
    }
  };

  const handleSwitchToHardwareLineIn = async () => {
    setUseHardwareLineIn(true);
    addLog('Switched audio input mode to navigator.mediaDevices Hardware Line-In / Tuner.', 'info');
    if (isPlaying) {
      try {
        await startHardwareMediaStream();
      } catch (err: any) {
        addLog(`Hardware audio input error: ${err?.message || err}`, 'alert');
      }
    }
  };

  // Synchronize with global LanguageContext updates
  useEffect(() => {
    const matched = SUPPORTED_BROADCAST_LOCALES.find(
      (l) => l.code === globalLocale || l.code.startsWith(globalLocale.slice(0, 2))
    );
    if (matched && matched.code !== selectedLocale.code) {
      setSelectedLocale(matched);
      if (translatorRef.current) {
        translatorRef.current.setLocale(matched.code);
        addLog(`Synchronized broadcast locale with global language: ${matched.name}.`, 'info');
      }
    }
  }, [globalLocale, selectedLocale.code, addLog]);

  const handleLocaleChange = (loc: TranslationLocale) => {
    setSelectedLocale(loc);
    setGlobalLocale(loc.code);
    if (translatorRef.current) {
      translatorRef.current.setLocale(loc.code);
      addLog(`Speech synthesis locale updated to ${loc.name} (${loc.dialectDescription}).`, 'info');
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    setIsMuted(newVol === 0);
    translatorRef.current?.setVolume(newVol);
  };

  const handleToggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      translatorRef.current?.setVolume(volume > 0 ? volume : 0.8);
    } else {
      setIsMuted(true);
      translatorRef.current?.setVolume(0);
    }
  };

  const handleManualForceReconnect = () => {
    addLog('Operator triggered immediate manual reconnection attempt...', 'info');
    triggerAutoReconnect('Manual operator trigger');
  };

  const handleSimulateDropout = () => {
    addLog('TEST BENCH: Simulating satellite uplink failure & data dropout (>5s)...', 'warn');
    failsafeRef.current?.simulateDropout();
    triggerAutoReconnect('Simulated test bench dropout');
  };

  const handleSimulateReconnect = () => {
    addLog('TEST BENCH: Restoring satellite carrier and verifying frame headers...', 'success');
    cancelAutoReconnect();
    failsafeRef.current?.simulateReconnect();
    setReconnectAttempts(0);
  };

  return (
    <div
      className={`bg-slate-950/95 border-2 rounded-2xl p-5 font-mono shadow-2xl relative overflow-hidden backdrop-blur-md ${
        failsafeState === 'OFFLINE_REPEAT' || isAutoReconnecting
          ? 'border-amber-500/60 shadow-amber-950/30'
          : failsafeState === 'RECOVERING'
          ? 'border-cyan-500/60 shadow-cyan-950/30'
          : 'border-emerald-500/40 shadow-emerald-950/30'
      } ${className}`}
    >
      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-3 rounded-xl border ${
              failsafeState === 'OFFLINE_REPEAT' || isAutoReconnecting
                ? 'bg-amber-950/80 text-amber-400 border-amber-800 animate-pulse'
                : 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
            }`}
          >
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider">
                Weather Voice Translation & Resilient Broadcast Engine
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded uppercase font-bold bg-slate-800 text-slate-300 border border-slate-700">
                SIL-2 RESILIENT
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              24/7 Weather Ingestion • Auto-Reconnection & Backoff • navigator.mediaDevices Line-In
            </p>
          </div>
        </div>

        {/* State Badge & Auto-reconnect Indicator */}
        <div className="flex items-center gap-2 shrink-0">
          {isAutoReconnecting ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-950/90 text-amber-300 border border-amber-500/60 flex items-center gap-1.5 shadow-lg shadow-amber-950/50 animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              AUTO-RECONNECTING {reconnectCountdown ? `IN ${reconnectCountdown}s` : ''} ({reconnectAttempts}/{maxReconnectAttempts})
            </span>
          ) : failsafeState === 'LIVE_STREAMING' ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-950/90 text-emerald-300 border border-emerald-500/60 flex items-center gap-1.5 shadow-lg shadow-emerald-950/50">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              {useHardwareLineIn ? 'LINE-IN HARDWARE LIVE' : 'LIVE SATELLITE STREAM'}
            </span>
          ) : failsafeState === 'OFFLINE_REPEAT' ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-950/90 text-amber-300 border border-amber-500/60 flex items-center gap-1.5 shadow-lg shadow-amber-950/50 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              REPEATING ARCHIVE (LOOP #{repeatCount + 1})
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-cyan-950/90 text-cyan-300 border border-cyan-500/60 flex items-center gap-1.5 shadow-lg shadow-cyan-950/50">
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
              VALIDATING FRAMES • RECOVERING LIVE
            </span>
          )}
        </div>
      </div>

      {/* Main Control Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-4">
        {/* Left Column: Radio Controls & Waveform (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Audio Ingress Source Selector (Presets, Env URL, and Hardware Line-In) */}
          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
                AUDIO INGRESS SOURCE & STREAM RELAY
              </span>
              <span className="text-[11px] text-emerald-400">
                {useHardwareLineIn ? 'navigator.mediaDevices' : `${selectedStation.bitrateKbps} kbps PCM`}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Hardware Line-In / Tuner Option */}
              <button
                type="button"
                onClick={handleSwitchToHardwareLineIn}
                className={`p-2.5 rounded-lg border text-left transition-all text-xs cursor-pointer ${
                  useHardwareLineIn
                    ? 'bg-cyan-950/80 border-cyan-500/80 text-white shadow-md'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Mic className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Hardware Line-In / Tuner</span>
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700 text-cyan-300">
                    SDR
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 truncate mt-0.5">
                  navigator.mediaDevices direct input
                </div>
              </button>

              {/* Station Presets and Environment Stream */}
              {allStations.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => handleStationChange(st)}
                  className={`p-2.5 rounded-lg border text-left transition-all text-xs cursor-pointer ${
                    !useHardwareLineIn && selectedStation.id === st.id
                      ? 'bg-emerald-950/70 border-emerald-500/70 text-white shadow-md'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold flex items-center justify-between">
                    <span className="flex items-center gap-1.5 truncate">
                      {st.id === 'env-configured' ? <Server className="w-3.5 h-3.5 text-amber-400 shrink-0" /> : null}
                      <span className="truncate">{st.callSign}</span>
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded bg-slate-900 border ${
                      st.id === 'env-configured' ? 'border-amber-500/50 text-amber-300' : 'border-slate-700 text-slate-300'
                    }`}>
                      {st.id === 'env-configured' ? 'VITE_ENV' : st.frequency}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate mt-0.5">{st.name}</div>
                </button>
              ))}
            </div>

            {/* Active URL Ingress Display */}
            <div className="text-[11px] text-slate-500 bg-slate-950/60 px-2.5 py-1.5 rounded-lg border border-slate-800/80 flex items-center justify-between gap-2">
              <span className="truncate">
                <span className="text-slate-400 font-bold">ACTIVE INGRESS: </span>
                {useHardwareLineIn ? 'navigator.mediaDevices.getUserMedia [16kHz PCM]' : selectedStation.streamUrl}
              </span>
              {isAutoReconnecting && (
                <button
                  onClick={handleManualForceReconnect}
                  className="text-amber-400 hover:text-amber-200 underline shrink-0 cursor-pointer font-bold"
                >
                  Retry Now
                </button>
              )}
            </div>
          </div>

          {/* Audio Waveform Oscilloscope */}
          <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 relative">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="flex items-center gap-1.5 font-bold text-slate-300">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                CARRIER SPECTRUM & RMS INTENSITY
              </span>
              <span className="text-[11px] text-cyan-300 font-mono">
                RMS: {(rmsVolume * 100).toFixed(0)}% • 16.0 kHz Ingress
              </span>
            </div>

            <canvas
              ref={canvasRef}
              width={520}
              height={75}
              className="w-full h-20 bg-slate-950 rounded-lg border border-slate-800/80"
            />

            {/* Play/Stop & Volume Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-slate-800/80">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTogglePlayback}
                  className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg ${
                    isPlaying
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/50'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50'
                  }`}
                >
                  {isPlaying ? (
                    <>
                      <Square className="w-4 h-4 fill-white" />
                      <span>HALT BROADCAST</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white" />
                      <span>START BROADCAST</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleToggleMute}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-amber-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                </button>
              </div>

              {/* Volume Slider */}
              <div className="flex items-center gap-2 flex-1 max-w-[180px]">
                <span className="text-[11px] text-slate-500 font-bold">VOL</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <span className="text-[11px] text-slate-400 w-8 text-right font-mono">
                  {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
                </span>
              </div>
            </div>
          </div>

          {/* Test Bench & Simulation Matrix */}
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 space-y-2">
            <div className="text-[11px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              SAFETY & FAILSAFE VERIFICATION BENCH
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleSimulateDropout}
                disabled={failsafeState === 'OFFLINE_REPEAT'}
                className="px-3 py-1.5 rounded-lg bg-amber-950/80 hover:bg-amber-900 text-amber-300 hover:text-amber-100 border border-amber-800 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                <WifiOff className="w-3.5 h-3.5" />
                <span>Simulate Dropout & Auto-Reconnect</span>
              </button>

              <button
                type="button"
                onClick={handleSimulateReconnect}
                disabled={failsafeState === 'LIVE_STREAMING' && !isAutoReconnecting}
                className="px-3 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 hover:text-cyan-100 border border-cyan-800 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                <Wifi className="w-3.5 h-3.5" />
                <span>Restore Link & Reset Retries</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Language Locale, Ring Buffer & Transcript (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Active Locale Selector */}
          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-purple-400" />
                TARGET DIALECT VOICE (GEMINI LIVE)
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800">
                24 kHz AUDIO
              </span>
            </div>

            <select
              value={selectedLocale.code}
              onChange={(e) => {
                const found = SUPPORTED_BROADCAST_LOCALES.find((l) => l.code === e.target.value);
                if (found) handleLocaleChange(found);
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-purple-500"
            >
              {SUPPORTED_BROADCAST_LOCALES.map((loc) => (
                <option key={loc.code} value={loc.code}>
                  {loc.name} — {loc.region}
                </option>
              ))}
            </select>

            <div className="text-[11px] text-slate-400 bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80">
              <strong className="text-purple-300 block mb-0.5">Style Directive:</strong>
              {selectedLocale.dialectDescription}
            </div>
          </div>

          {/* Rolling Circular Ring Buffer Telemetry */}
          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                CIRCULAR AUDIO RING BUFFER
              </span>
              <span className="text-[11px] text-emerald-400 font-bold">
                {Math.floor(bufferDurationSec / 60)}m {Math.floor(bufferDurationSec % 60)}s / 6m Max
              </span>
            </div>

            {/* Buffer Capacity Progress Bar */}
            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-emerald-600 to-cyan-500 transition-all duration-300"
                style={{ width: `${Math.min(100, (bufferDurationSec / 360) * 100)}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1">
              <div>
                <span className="text-slate-500 block text-[10px]">CACHE MEMORY:</span>
                <span className="text-white font-bold">{bufferMemoryMb} MB</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">FAILOVER LOOPS:</span>
                <span className={failsafeState === 'OFFLINE_REPEAT' ? 'text-amber-400 font-bold' : 'text-white font-bold'}>
                  {repeatCount} cycles
                </span>
              </div>
            </div>
          </div>

          {/* Live Translation Terminal & Event Log */}
          <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                LIVE TRANSLATION HUD & TELEMETRY
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {reconnectAttempts > 0 ? `RECONNECTS: ${reconnectAttempts}` : 'STATION LOGS'}
              </span>
            </div>

            <div className="h-28 bg-slate-950 rounded-lg p-2.5 overflow-y-auto custom-scrollbar border border-slate-800/80 text-[11px] space-y-1.5">
              <div className="text-emerald-400 font-mono text-[10px] leading-relaxed">
                <strong className="text-purple-300">[{selectedLocale.code}]</strong>: {liveTranscript}
              </div>

              {eventLogs.map((log, idx) => (
                <div
                  key={idx}
                  className={`text-[10px] font-mono leading-tight ${
                    log.type === 'alert'
                      ? 'text-amber-400'
                      : log.type === 'success'
                      ? 'text-emerald-300'
                      : log.type === 'warn'
                      ? 'text-rose-400'
                      : 'text-slate-400'
                  }`}
                >
                  <span className="text-slate-600">[{log.time}]</span> {log.msg}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherRadioPlayer;
