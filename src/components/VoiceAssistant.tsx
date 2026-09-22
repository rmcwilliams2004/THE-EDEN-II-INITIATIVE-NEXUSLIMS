import React from 'react';
import { Mic, MicOff, Activity, AlertCircle, Sparkles, Volume2, ShieldCheck, MapPin } from 'lucide-react';
import { LanguageSelector } from './LanguageSelector';
import { useLanguage } from '../context/LanguageContext';
import { useGeminiLive } from '../hooks/useGeminiLive';

export const VoiceAssistant: React.FC = () => {
  const { locale, localeProfile, t, gpsCoords } = useLanguage();
  const { 
    isActive, 
    status, 
    errorMessage, 
    isAudioOutputPlaying, 
    startSession, 
    stopSession 
  } = useGeminiLive({ locale });

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 sm:p-8 space-y-6 glass rounded-2xl overflow-y-auto custom-scrollbar">
      <div className="text-center space-y-2 max-w-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-mono font-bold">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>GEMINI LIVE • ZERO-TOUCH REGIONAL VOICE AGENT</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-wider uppercase text-white font-mono">
          Universal Agronomist & Dialect AI
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm">
          Bi-directional 16kHz PCM audio streaming configured to auto-adapt dialects, idioms, and agricultural terminology based on GPS bounding boxes.
        </p>
      </div>

      <div className="bg-[#05070a]/90 p-5 sm:p-6 rounded-2xl border border-slate-700 shadow-2xl flex flex-col items-center gap-5 w-full max-w-lg">
        {/* Language & GPS Selector */}
        <LanguageSelector disabled={isActive} />

        {/* Dynamic Context Directive Box */}
        <div className="w-full bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
          <div className="flex items-center justify-between text-slate-300 font-bold border-b border-slate-800/80 pb-1">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <MapPin className="w-3.5 h-3.5" />
              Injected Gemini Live Prompt Directive
            </span>
            <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/60">
              {localeProfile.flag} {locale}
            </span>
          </div>
          <p className="text-slate-300 italic pt-1">
            &ldquo;CRITICAL DIRECTIVE: You are physically located in region [{locale}]. You must instantly adapt all spoken audio responses, dialect comprehension, and idiom usage to the primary language of this locale. Do not speak English unless explicitly addressed in English.&rdquo;
          </p>
        </div>

        {errorMessage && (
          <div className="w-full bg-red-950/40 border border-red-500/40 rounded-xl p-3.5 text-xs text-red-200 flex flex-col gap-1.5 animate-in fade-in">
            <div className="flex items-center gap-2 font-bold text-red-400 uppercase text-[10px] tracking-wider font-mono">
              <AlertCircle className="w-4 h-4 shrink-0" />
              Microphone Access Notice
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">{errorMessage}</p>
          </div>
        )}

        {/* Large Interactive Voice Button */}
        <div className="flex flex-col items-center gap-3 pt-2">
          <button 
            type="button"
            onClick={isActive ? stopSession : () => startSession(locale)}
            className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full flex flex-col items-center justify-center gap-1 transition-all duration-300 cursor-pointer ${
              isActive 
                ? 'bg-red-500/20 text-red-400 border-2 border-red-500 hover:bg-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.4)] animate-pulse' 
                : 'bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500 hover:bg-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.2)]'
            }`}
          >
            {isActive ? (
              <>
                <Mic className="w-10 h-10 text-red-400" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider">TAP TO STOP</span>
              </>
            ) : (
              <>
                <MicOff className="w-10 h-10 text-emerald-400" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider">TAP TO TALK</span>
              </>
            )}
          </button>

          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-widest font-bold flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>SESSION:</span>
            <span className={`px-2 py-0.5 rounded text-[10px] ${
              isActive ? 'bg-emerald-950 text-emerald-400 border border-emerald-700' : 'bg-slate-900 text-slate-400 border border-slate-800'
            }`}>
              {status}
            </span>
            {isAudioOutputPlaying && (
              <span className="flex items-center gap-1 text-cyan-400 text-[10px] animate-pulse">
                <Volume2 className="w-3.5 h-3.5" /> SPEAKING
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
