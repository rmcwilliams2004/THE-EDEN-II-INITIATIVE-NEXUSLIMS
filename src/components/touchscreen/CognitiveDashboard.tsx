import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Sun, Moon, Sparkles, Shield, Compass, Sprout, Wrench, HeartHandshake, 
  Mic, MicOff, Radio, Volume2, Power, AlertTriangle, CheckCircle2, 
  ChevronRight, RefreshCw, Zap, Activity, Droplets, Gauge, Thermometer,
  Layers, ArrowRight, CornerDownLeft, Eye, EyeOff, Play, Square
} from 'lucide-react';
import { useAmbientTheme } from '../../context/AmbientThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useCognitiveAgent, AgentPersona, AGENT_PERSONAS } from '../../hooks/useCognitiveAgent';

interface CognitiveDashboardProps {
  nodeId?: string;
  onActionTrigger?: (actionName: string) => void;
}

export const CognitiveDashboard: React.FC<CognitiveDashboardProps> = ({
  nodeId = 'EDEN II NODE #042',
  onActionTrigger
}) => {
  const { visualTheme, mode: ambientMode, setMode: setAmbientMode, solarData } = useAmbientTheme();
  const { locale, localeProfile } = useLanguage();
  
  const [textPromptInput, setTextPromptInput] = useState('');
  const [isPeripheralExpanded, setIsPeripheralExpanded] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [activeEmergencyLock, setActiveEmergencyLock] = useState(false);

  // Live Telemetry State
  const [telemetry, setTelemetry] = useState({
    ph: 6.35,
    pressureBar: 597.2,
    temperatureC: 390.4,
    tankLevelPercent: 84.2,
    solarRadiation: 840,
    flowRateLpm: 12.8,
  });

  const isSunlight = visualTheme === 'sunlight';

  // Multi-Agent Voice & Visualizer Hook
  const {
    activePersona,
    personaProfile,
    coreState,
    isConnected,
    isMicMuted,
    audioLevel,
    frequencyBands,
    liveTranscript,
    errorMessage,
    connectSession,
    disconnectSession,
    switchPersona,
    sendUserPrompt,
    toggleMicMute,
  } = useCognitiveAgent({
    initialPersona: 'AGRONOMIST',
    onPersonaChange: (newPersona) => {
      showToast(`Switched active cognitive persona to ${AGENT_PERSONAS[newPersona].name} (${AGENT_PERSONAS[newPersona].role})`);
    }
  });

  const showToast = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 3500);
  };

  // Canvas ref for High-Fidelity Cognitive Core Pulsing Orb
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Dynamic Canvas Shader Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const renderOrb = () => {
      time += 0.035;
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Color selection based on Persona & Ambient Mode
      let baseR = 16, baseG = 185, baseB = 129; // Emerald (Agronomist)
      if (activePersona === 'ENGINEER') {
        baseR = 245; baseG = 158; baseB = 11; // Amber / Orange
      } else if (activePersona === 'MENTOR') {
        baseR = 168; baseG = 85; baseB = 247; // Purple / Violet
      }

      // Base radius calculation with audio expansion
      const dynamicMultiplier = 1 + audioLevel * 1.8;
      const baseRadius = 68 * dynamicMultiplier;

      // Outer ambient glow halo
      const glowGrad = ctx.createRadialGradient(
        centerX, centerY, baseRadius * 0.4,
        centerX, centerY, baseRadius * 2.2
      );
      glowGrad.addColorStop(0, `rgba(${baseR}, ${baseG}, ${baseB}, ${0.45 * dynamicMultiplier})`);
      glowGrad.addColorStop(0.5, `rgba(${baseR}, ${baseG}, ${baseB}, ${0.15 * dynamicMultiplier})`);
      glowGrad.addColorStop(1, `rgba(${baseR}, ${baseG}, ${baseB}, 0)`);

      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Multi-layer waveform rings
      const numRings = 3;
      for (let r = 0; r < numRings; r++) {
        const ringOffset = (r * Math.PI) / 3;
        const ringRadius = baseRadius * (0.85 + r * 0.18);
        ctx.beginPath();
        for (let a = 0; a < Math.PI * 2; a += 0.08) {
          const bandIndex = Math.floor((a / (Math.PI * 2)) * frequencyBands.length);
          const bandFreq = frequencyBands[bandIndex] || 0.1;
          const wobble = Math.sin(a * 6 + time * (2 + r) + ringOffset) * (8 + bandFreq * 24);
          const rad = ringRadius + wobble;
          const x = centerX + Math.cos(a) * rad;
          const y = centerY + Math.sin(a) * rad;

          if (a === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = `rgba(${baseR}, ${baseG}, ${baseB}, ${0.7 - r * 0.2})`;
        ctx.lineWidth = 2.2;
        ctx.stroke();
      }

      // Inner Solid Plasma Core
      const coreGrad = ctx.createRadialGradient(
        centerX - baseRadius * 0.25,
        centerY - baseRadius * 0.25,
        4,
        centerX,
        centerY,
        baseRadius
      );
      
      if (isSunlight) {
        coreGrad.addColorStop(0, '#ffffff');
        coreGrad.addColorStop(0.4, `rgba(${baseR}, ${baseG}, ${baseB}, 0.9)`);
        coreGrad.addColorStop(1, `rgba(${Math.max(0, baseR - 40)}, ${Math.max(0, baseG - 40)}, ${Math.max(0, baseB - 40)}, 0.95)`);
      } else {
        coreGrad.addColorStop(0, '#ffffff');
        coreGrad.addColorStop(0.3, `rgba(${baseR}, ${baseG}, ${baseB}, 0.85)`);
        coreGrad.addColorStop(0.8, `rgba(${Math.max(0, baseR - 30)}, ${Math.max(0, baseG - 30)}, ${Math.max(0, baseB - 30)}, 0.95)`);
        coreGrad.addColorStop(1, '#020617');
      }

      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 0.82, 0, Math.PI * 2);
      ctx.fill();

      // Central Activity Sparkles
      ctx.fillStyle = '#ffffff';
      const sparkCount = 6;
      for (let s = 0; s < sparkCount; s++) {
        const sAngle = time * (1.5 + s * 0.3) + (s * Math.PI) / 3;
        const sDist = baseRadius * 0.45 * Math.sin(time + s);
        const sx = centerX + Math.cos(sAngle) * sDist;
        const sy = centerY + Math.sin(sAngle) * sDist;
        ctx.beginPath();
        ctx.arc(sx, sy, 2 + audioLevel * 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(renderOrb);
    };

    renderOrb();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [activePersona, audioLevel, frequencyBands, isSunlight]);

  const handlePromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textPromptInput.trim()) return;
    sendUserPrompt(textPromptInput.trim());
    setTextPromptInput('');
  };

  const handleHardwareAction = (action: string) => {
    if (onActionTrigger) onActionTrigger(action);
    if (action === 'EMERGENCY_LOCKOUT') {
      setActiveEmergencyLock(prev => !prev);
      showToast(activeEmergencyLock ? 'SIL-3 Interlock released. System online.' : 'SIL-3 Emergency Lockout activated. High pressure dump open.');
    } else {
      showToast(`Executed: ${action}`);
    }
  };

  // State text badge for Cognitive Core
  const coreStateBadge = useMemo(() => {
    switch (coreState) {
      case 'SPEAKING':
        return { text: 'VOICE TRANSMITTING', bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' };
      case 'LISTENING':
        return { text: 'LISTENING FOR SPEECH', bg: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40' };
      case 'THINKING':
        return { text: 'REASONING & SYNTHESIZING', bg: 'bg-amber-500/20 text-amber-400 border-amber-500/40' };
      case 'ALERT':
        return { text: 'LINK RECONNECTING', bg: 'bg-rose-500/20 text-rose-400 border-rose-500/40' };
      default:
        return { text: 'STANDBY / TAP TO ENGAGE', bg: 'bg-slate-700/30 text-slate-400 border-slate-700/50' };
    }
  }, [coreState]);

  // Is AI actively talking or listening? (For peripheral focus fading)
  const isConversing = coreState === 'SPEAKING' || coreState === 'LISTENING' || coreState === 'THINKING';

  return (
    <div className={`w-full min-h-[780px] rounded-3xl p-6 transition-colors duration-500 flex flex-col justify-between relative overflow-hidden border shadow-2xl ${
      isSunlight 
        ? 'bg-gradient-to-b from-slate-50 via-white to-slate-100 border-slate-300 text-slate-900 shadow-slate-300/60' 
        : 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-slate-800 text-slate-100 shadow-black/80'
    }`}>
      
      {/* Background Decorative Ambient Grid / Aurora */}
      <div className="absolute inset-0 pointer-events-none opacity-40 overflow-hidden">
        <div className={`absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[350px] rounded-full blur-3xl transition-colors duration-700 ${
          activePersona === 'AGRONOMIST' 
            ? 'bg-emerald-500/20' 
            : activePersona === 'ENGINEER' 
            ? 'bg-amber-500/20' 
            : 'bg-purple-500/20'
        }`} />
      </div>

      {/* Action Toast Notification */}
      {actionFeedback && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className="px-5 py-2.5 rounded-full bg-slate-900/90 backdrop-blur-md border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold shadow-2xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{actionFeedback}</span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. TOP HEADER: AMBIENT SOLAR TELEMETRY & MULTI-AGENT ROUTER               */}
      {/* ========================================================================= */}
      <header className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4 pb-4 border-b border-inherit">
        
        {/* Left: Node & Ambient Light Indicator */}
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl border flex items-center gap-2.5 ${
            isSunlight ? 'bg-white border-slate-300 shadow-sm' : 'bg-slate-900/80 border-slate-800 shadow-inner'
          }`}>
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold">
                {nodeId}
              </div>
              <div className="text-xs font-mono font-bold flex items-center gap-1.5">
                <span>{localeProfile?.languageName || 'US English'}</span>
                <span className="text-slate-400">({locale})</span>
              </div>
            </div>
          </div>

          {/* Ambient Solar Status */}
          <div className={`px-3 py-2 rounded-2xl border flex items-center gap-3 text-xs font-mono ${
            isSunlight ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-slate-900/80 border-slate-800 text-slate-300'
          }`}>
            {isSunlight ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-cyan-400" />}
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">
                Solar Elev: {solarData.solarElevationDeg}°
              </span>
              <span className="font-bold">
                {isSunlight ? `Sunset ${solarData.sunset}` : `Sunrise ${solarData.sunrise}`}
              </span>
            </div>
            
            {/* Theme Toggle Button */}
            <button
              id="btn-toggle-ambient-mode"
              onClick={() => setAmbientMode(ambientMode === 'SUNLIGHT' ? 'NIGHT' : ambientMode === 'NIGHT' ? 'AUTO_SOLAR' : 'SUNLIGHT')}
              title="Toggle Ambient Sunlight / Night Mode"
              className={`p-1.5 rounded-lg border text-[10px] font-bold cursor-pointer transition-all ${
                ambientMode === 'AUTO_SOLAR'
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                  : isSunlight
                  ? 'bg-amber-200 border-amber-400 text-amber-950'
                  : 'bg-slate-800 border-slate-700 text-slate-200'
              }`}
            >
              {ambientMode === 'AUTO_SOLAR' ? 'AUTO-SOLAR' : ambientMode}
            </button>
          </div>
        </div>

        {/* Right: Multi-Agent Hot-Swappable Persona Switcher */}
        <div className="flex items-center gap-2 p-1 rounded-2xl border bg-slate-900/40 backdrop-blur-md border-inherit">
          {(['AGRONOMIST', 'ENGINEER', 'MENTOR'] as AgentPersona[]).map((personaKey) => {
            const persona = AGENT_PERSONAS[personaKey];
            const isSelected = activePersona === personaKey;

            return (
              <button
                key={personaKey}
                id={`btn-persona-${personaKey.toLowerCase()}`}
                onClick={() => switchPersona(personaKey)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? personaKey === 'AGRONOMIST'
                      ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30'
                      : personaKey === 'ENGINEER'
                      ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30'
                      : 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                    : isSunlight
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                {personaKey === 'AGRONOMIST' && <Sprout className="w-3.5 h-3.5" />}
                {personaKey === 'ENGINEER' && <Wrench className="w-3.5 h-3.5" />}
                {personaKey === 'MENTOR' && <HeartHandshake className="w-3.5 h-3.5" />}
                <span>{persona.name.split(' ')[0]}</span>
                <span className="hidden sm:inline text-[10px] opacity-80 uppercase tracking-wider font-mono">({personaKey})</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. CENTER: DYNAMIC COGNITIVE CORE (PULSING ORB) & VOICE INTERFACE         */}
      {/* ========================================================================= */}
      <main className="relative z-10 flex-1 my-4 flex flex-col items-center justify-center">
        
        {/* Active Persona Banner */}
        <div className="text-center mb-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wide uppercase border mb-1.5"
            style={{
              borderColor: personaProfile.accentColor,
              backgroundColor: `${personaProfile.accentColor}18`,
              color: isSunlight ? '#0f172a' : personaProfile.accentColor
            }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{personaProfile.name} • {personaProfile.role}</span>
          </div>
          <p className="text-xs text-slate-400 max-w-lg mx-auto">
            {personaProfile.tagline}
          </p>
        </div>

        {/* Central Orb Visualizer Stack */}
        <div className="relative flex items-center justify-center my-2">
          {/* Canvas WebGL/2D Waveform Core */}
          <canvas
            ref={canvasRef}
            width={340}
            height={340}
            className="w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] pointer-events-none"
          />

          {/* Center Interactive Touch-to-Engage Trigger */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-auto">
            <button
              id="btn-cognitive-orb-trigger"
              onClick={() => {
                if (isConnected) {
                  disconnectSession();
                } else {
                  connectSession(activePersona);
                }
              }}
              className={`w-24 h-24 rounded-full flex flex-col items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer shadow-2xl backdrop-blur-md border ${
                isConnected
                  ? isSunlight
                    ? 'bg-slate-900/90 text-white border-slate-700'
                    : 'bg-slate-950/80 text-emerald-400 border-emerald-500/50'
                  : isSunlight
                  ? 'bg-white/90 text-slate-800 border-slate-300 shadow-slate-400/50'
                  : 'bg-slate-900/80 text-slate-200 border-slate-700'
              }`}
            >
              {isConnected ? (
                <>
                  <Mic className="w-7 h-7 mb-1 animate-pulse" />
                  <span className="text-[9px] font-mono font-bold tracking-widest uppercase">LIVE</span>
                </>
              ) : (
                <>
                  <Power className="w-7 h-7 mb-1 text-slate-400" />
                  <span className="text-[9px] font-mono font-bold tracking-widest uppercase">START</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Orb Core Status Badge */}
        <div className="mt-2 flex items-center gap-3">
          <span className={`px-4 py-1.5 rounded-full border text-xs font-mono font-bold tracking-widest uppercase shadow-md ${coreStateBadge.bg}`}>
            {coreStateBadge.text}
          </span>
          
          {isConnected && (
            <button
              onClick={toggleMicMute}
              className={`p-2 rounded-full border text-xs cursor-pointer transition-all ${
                isMicMuted
                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                  : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:text-white'
              }`}
              title={isMicMuted ? 'Unmute Microphone' : 'Mute Microphone'}
            >
              {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Live Streaming Spoken Transcript Banner */}
        <div className="w-full max-w-2xl mt-4 px-4">
          <div className={`p-4 rounded-2xl border transition-all ${
            isSunlight ? 'bg-white/90 border-slate-200 shadow-md' : 'bg-slate-900/70 border-slate-800 shadow-inner'
          }`}>
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 uppercase font-bold mb-1.5">
              <span className="flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                Live Conversation Stream
              </span>
              <span className="text-[10px] text-slate-400">Gemini Live WebRTC</span>
            </div>
            
            <p className={`text-xs sm:text-sm font-sans leading-relaxed min-h-[36px] ${
              liveTranscript ? (isSunlight ? 'text-slate-900 font-semibold' : 'text-slate-100 font-medium') : 'text-slate-400 italic'
            }`}>
              {liveTranscript || `"${personaProfile.suggestedPrompts[0]}"`}
            </p>

            {/* Quick-Prompt Suggestions */}
            <div className="mt-3 pt-3 border-t border-inherit flex flex-wrap gap-2">
              {personaProfile.suggestedPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => sendUserPrompt(prompt)}
                  className={`text-[11px] px-3 py-1 rounded-lg border transition-all text-left truncate max-w-xs cursor-pointer ${
                    isSunlight 
                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800' 
                      : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  "{prompt}"
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Text Input Fallback Bar */}
        <form onSubmit={handlePromptSubmit} className="w-full max-w-2xl mt-3 flex items-center gap-2">
          <input
            type="text"
            value={textPromptInput}
            onChange={(e) => setTextPromptInput(e.target.value)}
            placeholder={`Ask ${personaProfile.name} anything about ${activePersona === 'AGRONOMIST' ? 'soil pH, dosing, and crop health...' : activePersona === 'ENGINEER' ? '600-bar safety, pumps, and catalyst temp...' : 'basic hydroponic growing...'}`}
            className={`flex-1 px-4 py-2.5 rounded-xl border text-xs focus:outline-none transition-all ${
              isSunlight 
                ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500' 
                : 'bg-slate-950 border-slate-800 text-slate-200 placeholder:text-slate-500 focus:border-emerald-500'
            }`}
          />
          <button
            type="submit"
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md ${
              isSunlight 
                ? 'bg-slate-900 hover:bg-slate-800 text-white' 
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
            }`}
          >
            <span>Ask</span>
            <CornerDownLeft className="w-3.5 h-3.5" />
          </button>
        </form>

      </main>

      {/* ========================================================================= */}
      {/* 3. PERIPHERAL TELEMETRY LAYER (SMART FOCUSED FADING)                      */}
      {/* ========================================================================= */}
      <section className={`relative z-10 my-2 transition-all duration-500 ${
        isConversing ? 'opacity-40 hover:opacity-100 scale-[0.99]' : 'opacity-100 scale-100'
      }`}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          
          {/* Soil pH Capsule */}
          <div className={`p-3 rounded-2xl border transition-all ${
            isSunlight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/60 border-slate-800'
          }`}>
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 uppercase font-bold">
              <span className="flex items-center gap-1"><Droplets className="w-3 h-3 text-emerald-500" /> Soil pH</span>
              <span className="text-emerald-500">OPT</span>
            </div>
            <div className="text-lg font-mono font-black mt-1 flex items-baseline gap-1">
              <span>{telemetry.ph}</span>
              <span className="text-[10px] text-slate-400 font-normal">pH</span>
            </div>
            <div className="w-full bg-slate-700/30 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div className="bg-emerald-400 h-full rounded-full" style={{ width: '68%' }} />
            </div>
          </div>

          {/* Hydraulic Pressure Capsule */}
          <div className={`p-3 rounded-2xl border transition-all ${
            telemetry.pressureBar > 610 
              ? 'bg-rose-950/60 border-rose-600 text-rose-300' 
              : isSunlight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/60 border-slate-800'
          }`}>
            <div className="flex items-center justify-between text-[10px] font-mono uppercase font-bold">
              <span className="flex items-center gap-1 text-slate-500"><Gauge className="w-3 h-3 text-amber-500" /> Line Press.</span>
              <span className={telemetry.pressureBar > 610 ? 'text-rose-400 font-bold' : 'text-slate-400'}>SIL-3</span>
            </div>
            <div className="text-lg font-mono font-black mt-1 flex items-baseline gap-1">
              <span>{telemetry.pressureBar}</span>
              <span className="text-[10px] text-slate-400 font-normal">bar</span>
            </div>
            <div className="w-full bg-slate-700/30 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div className="bg-amber-400 h-full rounded-full" style={{ width: '85%' }} />
            </div>
          </div>

          {/* Catalyst Reactor Temp Capsule */}
          <div className={`p-3 rounded-2xl border transition-all ${
            isSunlight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/60 border-slate-800'
          }`}>
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 uppercase font-bold">
              <span className="flex items-center gap-1"><Thermometer className="w-3 h-3 text-rose-500" /> Catalyst</span>
              <span className="text-emerald-500">380-410°C</span>
            </div>
            <div className="text-lg font-mono font-black mt-1 flex items-baseline gap-1">
              <span>{telemetry.temperatureC}</span>
              <span className="text-[10px] text-slate-400 font-normal">°C</span>
            </div>
            <div className="w-full bg-slate-700/30 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div className="bg-rose-400 h-full rounded-full" style={{ width: '74%' }} />
            </div>
          </div>

          {/* Bio-Sol Tank Level */}
          <div className={`p-3 rounded-2xl border transition-all ${
            isSunlight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/60 border-slate-800'
          }`}>
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 uppercase font-bold">
              <span className="flex items-center gap-1"><Layers className="w-3 h-3 text-cyan-500" /> Bio-Sol Tank</span>
              <span className="text-cyan-400">2,400L</span>
            </div>
            <div className="text-lg font-mono font-black mt-1 flex items-baseline gap-1">
              <span>{telemetry.tankLevelPercent}</span>
              <span className="text-[10px] text-slate-400 font-normal">%</span>
            </div>
            <div className="w-full bg-slate-700/30 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div className="bg-cyan-400 h-full rounded-full" style={{ width: `${telemetry.tankLevelPercent}%` }} />
            </div>
          </div>

          {/* Solar Flux & PV Yield */}
          <div className={`p-3 rounded-2xl border transition-all ${
            isSunlight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/60 border-slate-800'
          }`}>
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 uppercase font-bold">
              <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-amber-400" /> Solar Lux</span>
              <span className="text-amber-400">HIGH</span>
            </div>
            <div className="text-lg font-mono font-black mt-1 flex items-baseline gap-1">
              <span>{telemetry.solarRadiation}</span>
              <span className="text-[10px] text-slate-400 font-normal">W/m²</span>
            </div>
            <div className="w-full bg-slate-700/30 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div className="bg-amber-400 h-full rounded-full" style={{ width: '84%' }} />
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. BOTTOM ACTION BAR: TOUCH INDUSTRIAL HARDWARE OVERRIDES                  */}
      {/* ========================================================================= */}
      <footer className="relative z-10 pt-4 border-t border-inherit flex flex-wrap items-center justify-between gap-3">
        
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar py-1">
          {/* Quick Dispense */}
          <button
            id="btn-quick-dispense"
            onClick={() => handleHardwareAction('DISPENSE_20L_FOLIAR')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md ${
              isSunlight 
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
            }`}
          >
            <Droplets className="w-3.5 h-3.5" />
            <span>DISPENSE 20L FOLIAR</span>
          </button>

          {/* Vent 600-Bar Manifold */}
          <button
            id="btn-vent-hydraulic"
            onClick={() => handleHardwareAction('VENT_HYDRAULIC_LINE')}
            className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              isSunlight 
                ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800' 
                : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
            }`}
          >
            <Gauge className="w-3.5 h-3.5 text-amber-500" />
            <span>VENT 600-BAR LINE</span>
          </button>

          {/* Recirculate Loop */}
          <button
            id="btn-recirculate-loop"
            onClick={() => handleHardwareAction('RECIRCULATE_LOOP')}
            className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              isSunlight 
                ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800' 
                : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>RECIRCULATE LOOP</span>
          </button>

          {/* Hedera dMRV Audit Export */}
          <button
            id="btn-export-dmrv"
            onClick={() => handleHardwareAction('AUDIT_DMRV_PROOFS')}
            className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              isSunlight 
                ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800' 
                : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-purple-400" />
            <span>HEDERA DMRV AUDIT</span>
          </button>
        </div>

        {/* SIL-3 Emergency Lockout Push Button */}
        <div>
          <button
            id="btn-sil3-emergency-lockout"
            onClick={() => handleHardwareAction('EMERGENCY_LOCKOUT')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg ${
              activeEmergencyLock
                ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                : 'bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-700'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>{activeEmergencyLock ? 'SIL-3 INTERLOCK ENGAGED' : 'SIL-3 EMERGENCY LOCKOUT'}</span>
          </button>
        </div>

      </footer>

    </div>
  );
};
