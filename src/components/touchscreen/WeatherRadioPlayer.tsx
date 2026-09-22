import React, { useState, useEffect, useRef } from 'react';
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

export interface WeatherRadioPlayerProps {
  className?: string;
  onAnnounceAlert?: (text: string) => void;
}

export const WeatherRadioPlayer: React.FC<WeatherRadioPlayerProps> = ({
  className = '',
  onAnnounceAlert,
}) => {
  // Core Engine References
  const streamerRef = useRef<WeatherAudioStreamer | null>(null);
  const failsafeRef = useRef<WeatherBroadcastFailsafe | null>(null);
  const translatorRef = useRef<GeminiWeatherTranslator | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Component UI State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedStation, setSelectedStation] = useState<WeatherStreamStation>(PRESET_WEATHER_STATIONS[0]);
  const [selectedLocale, setSelectedLocale] = useState<TranslationLocale>(SUPPORTED_BROADCAST_LOCALES[0]);
  const [failsafeState, setFailsafeState] = useState<FailsafeState>('LIVE_STREAMING');
  const [volume, setVolume] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  
  // Real-time Metrics
  const [rmsVolume, setRmsVolume] = useState<number>(0);
  const [bufferDurationSec, setBufferDurationSec] = useState<number>(0);
  const [bufferMemoryMb, setBufferMemoryMb] = useState<number>(0);
  const [repeatCount, setRepeatCount] = useState<number>(0);
  const [reconnectAttempts, setReconnectAttempts] = useState<number>(0);
  const [latestAdvisory, setLatestAdvisory] = useState<string | null>(null);
  const [liveTranscript, setLiveTranscript] = useState<string>('Standby. Ingesting 16kHz carrier stream from satellite relay...');
  const [isAiConnected, setIsAiConnected] = useState<boolean>(false);
  const [eventLogs, setEventLogs] = useState<Array<{ time: string; msg: string; type: 'info' | 'warn' | 'success' | 'alert' }>>([]);

  // Audio wave visualizer data
  const audioHistoryRef = useRef<number[]>(new Array(48).fill(0.05));

  const addLog = (msg: string, type: 'info' | 'warn' | 'success' | 'alert' = 'info') => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setEventLogs(prev => [{ time, msg, type }, ...prev.slice(0, 19)]);
  };

  // Initialize Audio & Safety Pipeline
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
      // Update visualizer buffer
      audioHistoryRef.current.shift();
      audioHistoryRef.current.push(Math.max(0.08, rms));
    });

    // Wire failsafe state changes
    failsafe.onStateChange((evt: FailsafeStatusEvent) => {
      setFailsafeState(evt.state);
      setRepeatCount(evt.repeatCycleCount);
      setReconnectAttempts(evt.reconnectAttempts);
      setBufferDurationSec(evt.cachedDurationSec);

      if (evt.advisoryText) {
        setLatestAdvisory(evt.advisoryText);
        addLog(evt.advisoryText, evt.state === 'OFFLINE_REPEAT' ? 'alert' : 'success');
      }
    });

    // Wire audio output from failsafe to translator
    failsafe.onAudioOutput((chunk, isRepeat) => {
      translator.ingestPcmChunk(chunk);
    });

    failsafe.onAdvisorySpoken((text, type) => {
      if (onAnnounceAlert) {
        onAnnounceAlert(text);
      }
    });

    // Periodic buffer update
    const bufferInterval = setInterval(() => {
      if (streamerRef.current) {
        const ring = streamerRef.current.getRingBuffer();
        setBufferDurationSec(ring.getDurationSeconds());
        setBufferMemoryMb(ring.getMemoryUsageMb());
      }
    }, 1000);

    return () => {
      clearInterval(bufferInterval);
      failsafe.stop();
      translator.disconnect();
    };
  }, []);

  // Visualizer Animation Loop
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
        if (failsafeState === 'OFFLINE_REPEAT') {
          fillColor = 'rgba(245, 158, 11, 0.9)'; // Amber for REPEAT
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
  }, [failsafeState]);

  // Handlers
  const handleTogglePlayback = async () => {
    if (isPlaying) {
      failsafeRef.current?.stop();
      translatorRef.current?.disconnect();
      setIsPlaying(false);
      addLog('Weather broadcast playback halted by operator.', 'info');
    } else {
      failsafeRef.current?.start();
      await translatorRef.current?.connect();
      setIsPlaying(true);
      addLog(`Connected to ${selectedStation.callSign} (${selectedStation.frequency}). Target dialect: ${selectedLocale.name}.`, 'success');
    }
  };

  const handleStationChange = (st: WeatherStreamStation) => {
    setSelectedStation(st);
    if (streamerRef.current) {
      streamerRef.current.setStation(st);
      addLog(`Switched station to ${st.callSign} [${st.frequency}] (${st.region}).`, 'info');
    }
  };

  const handleLocaleChange = (loc: TranslationLocale) => {
    setSelectedLocale(loc);
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

  // Test Simulation Controls
  const handleSimulateDropout = () => {
    addLog('TEST BENCH: Simulating satellite uplink failure & data dropout (>5s)...', 'warn');
    failsafeRef.current?.simulateDropout();
  };

  const handleSimulateReconnect = () => {
    addLog('TEST BENCH: Restoring satellite carrier and verifying frame headers...', 'success');
    failsafeRef.current?.simulateReconnect();
  };

  return (
    <div
      className={`bg-slate-950/95 border-2 rounded-2xl p-5 font-mono shadow-2xl relative overflow-hidden backdrop-blur-md ${
        failsafeState === 'OFFLINE_REPEAT'
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
              failsafeState === 'OFFLINE_REPEAT'
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
              24/7 Satellite Weather Ingestion • Live Dialect Synthesis • Automated Ring Buffer Loop
            </p>
          </div>
        </div>

        {/* State Badge */}
        <div className="flex items-center gap-2 shrink-0">
          {failsafeState === 'LIVE_STREAMING' && (
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-950/90 text-emerald-300 border border-emerald-500/60 flex items-center gap-1.5 shadow-lg shadow-emerald-950/50">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              LIVE SATELLITE STREAM
            </span>
          )}
          {failsafeState === 'OFFLINE_REPEAT' && (
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-950/90 text-amber-300 border border-amber-500/60 flex items-center gap-1.5 shadow-lg shadow-amber-950/50 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              RECONNECTING • REPEATING ARCHIVE (LOOP #{repeatCount + 1})
            </span>
          )}
          {failsafeState === 'RECOVERING' && (
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
          {/* Station & Channel Selector */}
          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
                ACTIVE WEATHER RADIO STATION
              </span>
              <span className="text-[11px] text-emerald-400">{selectedStation.bitrateKbps} kbps PCM</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_WEATHER_STATIONS.map((st) => (
                <button
                  key={st.id}
                  onClick={() => handleStationChange(st)}
                  className={`p-2.5 rounded-lg border text-left transition-all text-xs cursor-pointer ${
                    selectedStation.id === st.id
                      ? 'bg-emerald-950/70 border-emerald-500/70 text-white shadow-md'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold flex items-center justify-between">
                    <span>{st.callSign}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700 text-slate-300">
                      {st.frequency}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate mt-0.5">{st.name}</div>
                </button>
              ))}
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
                RMS: {(rmsVolume * 100).toFixed(0)}% • 16.0 kHz Line-In
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
                onClick={handleSimulateDropout}
                disabled={failsafeState === 'OFFLINE_REPEAT'}
                className="px-3 py-1.5 rounded-lg bg-amber-950/80 hover:bg-amber-900 text-amber-300 hover:text-amber-100 border border-amber-800 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                <WifiOff className="w-3.5 h-3.5" />
                <span>Simulate Satellite Dropout (&gt;5s)</span>
              </button>

              <button
                onClick={handleSimulateReconnect}
                disabled={failsafeState === 'LIVE_STREAMING'}
                className="px-3 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 hover:text-cyan-100 border border-cyan-800 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                <Wifi className="w-3.5 h-3.5" />
                <span>Restore Satellite Link</span>
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
                const found = SUPPORTED_BROADCAST_LOCALES.find(l => l.code === e.target.value);
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
                LIVE TRANSLATION HUD
              </span>
              <span className="text-[10px] text-slate-500 font-mono">STATION LOGS</span>
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
