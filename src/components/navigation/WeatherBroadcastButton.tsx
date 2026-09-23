import React from 'react';
import { Radio, Volume2, VolumeX, Sparkles, Activity } from 'lucide-react';
import { useNavigationPreference } from '../../context/NavigationPreferenceContext';
import { useLanguage } from '../../context/LanguageContext';

export interface WeatherBroadcastButtonProps {
  variant?: 'hero' | 'compact' | 'inline';
  className?: string;
  showFrequencyBars?: boolean;
}

export const WeatherBroadcastButton: React.FC<WeatherBroadcastButtonProps> = ({
  variant = 'hero',
  className = '',
  showFrequencyBars = true,
}) => {
  const {
    isWeatherBroadcastActive,
    toggleWeatherBroadcast,
    isMuted,
    toggleMute,
    selectedVoice,
    setSelectedVoice,
    availableVoices,
    frequencyBands,
    currentStation,
    liveStatus,
  } = useNavigationPreference();
  const { t } = useLanguage();

  const isHero = variant === 'hero';

  return (
    <div className={`relative flex flex-col items-center sm:items-start gap-2.5 ${className}`}>
      {/* Industrial Illuminated Red Toggle Switch + Mute Control Group */}
      <div className="flex items-center gap-2.5 w-full sm:w-auto">
        <button
          id="btn-weather-broadcast-toggle"
          type="button"
          onClick={toggleWeatherBroadcast}
          aria-pressed={isWeatherBroadcastActive}
          title={isWeatherBroadcastActive ? 'Stop Live Weather Radio Broadcast' : 'Start Live Weather Radio Broadcast'}
          className={`group relative overflow-hidden transition-all duration-300 font-mono font-black uppercase tracking-wider flex items-center justify-center gap-3 cursor-pointer select-none active:scale-[0.98] ${
            isHero
              ? 'px-6 py-3.5 rounded-2xl text-sm sm:text-base border-2 shadow-xl flex-1 sm:flex-initial'
              : 'px-4 py-2 rounded-xl text-xs border shadow-md'
          } ${
            isWeatherBroadcastActive
              ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-500 text-white border-red-400/80 shadow-[0_0_30px_rgba(239,68,68,0.65)] ring-4 ring-red-500/30'
              : 'bg-gradient-to-b from-[#2a0f12] via-[#1a080a] to-[#120507] hover:from-[#3d1419] hover:to-[#22090c] text-red-200/90 border-red-900/80 hover:border-red-600/70 shadow-[0_4px_16px_rgba(0,0,0,0.6)]'
          }`}
        >
          {/* Pulsing Beacon Glow Ring when Active */}
          {isWeatherBroadcastActive && !isMuted && (
            <span className="absolute inset-0 rounded-2xl bg-red-500/20 animate-ping pointer-events-none" />
          )}

          {/* Industrial Bevel Lighting Reflection */}
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-red-200/40 to-transparent pointer-events-none" />

          {/* Status Indicator Icon / Pulsing LED */}
          <div className="relative flex items-center justify-center shrink-0">
            {isWeatherBroadcastActive ? (
              <div className="relative">
                <span className="relative flex h-3.5 w-3.5">
                  <span className={`absolute inline-flex h-full w-full rounded-full ${isMuted ? 'bg-amber-400 opacity-60' : 'animate-ping bg-red-300 opacity-75'}`}></span>
                  <span className={`relative inline-flex rounded-full h-3.5 w-3.5 ${isMuted ? 'bg-amber-300 shadow-[0_0_8px_#f59e0b]' : 'bg-white shadow-[0_0_8px_#ffffff]'}`}></span>
                </span>
              </div>
            ) : (
              <div className="w-3.5 h-3.5 rounded-full bg-red-900 border border-red-700/80 flex items-center justify-center shadow-inner group-hover:bg-red-700 transition-colors">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500/60" />
              </div>
            )}
          </div>

          {/* Button Label Text */}
          <span className="font-extrabold tracking-wide drop-shadow-sm">
            {isWeatherBroadcastActive ? (
              <span className="flex items-center gap-2">
                <span>{isMuted ? '🔇' : '🔊'} {t('weather_live_stream', 'LIVE WEATHER STREAM')}</span>
                <span className={`text-[11px] px-2 py-0.5 rounded font-mono font-bold tracking-widest border ${
                  isMuted 
                    ? 'bg-amber-950/90 border-amber-400/70 text-amber-300' 
                    : 'bg-red-950/80 border border-red-400/60 text-white animate-pulse'
                }`}>
                  {isMuted ? t('audio_muted', 'MUTED') : t('weather_active', 'ACTIVE')}
                </span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span className="text-red-500">🔴</span>
                <span>{t('weather_play_broadcast', 'PLAY WEATHER BROADCAST')}</span>
              </span>
            )}
          </span>

          {/* Mini Frequency EQ Bars (Real-Time Web Audio reactive) */}
          {showFrequencyBars && (
            <div className="flex items-end gap-[3px] h-4 shrink-0 pl-1 border-l border-red-500/30">
              {frequencyBands.slice(0, 6).map((band, idx) => (
                <div
                  key={idx}
                  className={`w-[3px] rounded-full transition-all duration-75 ${
                    isWeatherBroadcastActive
                      ? isMuted
                        ? 'bg-amber-400/60'
                        : 'bg-white shadow-[0_0_6px_rgba(255,255,255,0.9)]'
                      : 'bg-red-900/60'
                  }`}
                  style={{
                    height: isWeatherBroadcastActive 
                      ? isMuted 
                        ? '20%' 
                        : `${Math.max(20, Math.min(100, band * 100))}%` 
                      : '20%',
                  }}
                />
              ))}
            </div>
          )}
        </button>

        {/* Dedicated Industrial Mute / Unmute Button */}
        <button
          id="btn-weather-broadcast-mute"
          type="button"
          onClick={toggleMute}
          aria-label={isMuted ? t('unmute_audio', 'Unmute Audio') : t('mute_audio', 'Mute Audio')}
          title={isMuted ? t('unmute_audio', 'Unmute Audio') : t('mute_audio', 'Mute Audio')}
          className={`group relative overflow-hidden transition-all duration-300 font-mono font-bold flex items-center justify-center cursor-pointer select-none active:scale-95 shrink-0 ${
            isHero
              ? 'px-4 py-3.5 rounded-2xl border-2 text-sm shadow-xl'
              : 'px-2.5 py-2 rounded-xl border text-xs shadow-md'
          } ${
            isMuted
              ? 'bg-amber-950/90 text-amber-300 border-amber-600/80 shadow-[0_0_20px_rgba(245,158,11,0.4)] ring-2 ring-amber-500/40'
              : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700/80 hover:border-slate-500 shadow-md'
          }`}
        >
          <div className="flex items-center gap-2">
            {isMuted ? (
              <>
                <VolumeX className="w-5 h-5 text-amber-400 animate-pulse" />
                <span className="hidden md:inline text-xs uppercase tracking-wider font-extrabold text-amber-300">
                  {t('unmute_audio', 'UNMUTE')}
                </span>
              </>
            ) : (
              <>
                <Volume2 className={`w-5 h-5 ${isWeatherBroadcastActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span className="hidden md:inline text-xs uppercase tracking-wider font-semibold text-slate-300">
                  {t('mute_audio', 'MUTE')}
                </span>
              </>
            )}
          </div>
        </button>
      </div>

      {/* Subtitle with Station Info & Gemini Natural Voice Selector */}
      {isHero && (
        <div className="flex items-center flex-wrap gap-2.5 text-[11px] font-mono text-slate-400 px-1">
          <span className="text-slate-500">{t('weather_station', 'STATION')}:</span>
          <span className="text-slate-200 font-semibold">{currentStation.callSign} ({currentStation.frequency})</span>
          <span className="text-slate-600">·</span>
          
          <span className={isWeatherBroadcastActive ? (isMuted ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold') : 'text-slate-400'}>
            {isWeatherBroadcastActive 
              ? isMuted
                ? `● ${t('audio_muted', 'MUTED')} (16kHz PCM)` 
                : t('weather_receiving', 'RECEIVING 16kHz PCM') 
              : t('weather_standby', 'STANDBY')}
          </span>

          <span className="text-slate-600">·</span>

          {/* Gemini Soft Natural Voice Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-teal-500/40 px-2 py-0.5 rounded-lg shadow-sm">
            <Sparkles className="w-3 h-3 text-teal-400 animate-pulse" />
            <span className="text-teal-300 text-[10px] font-semibold">Gemini Voice:</span>
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value as any)}
              className="bg-transparent text-white text-[11px] font-bold outline-none cursor-pointer hover:text-teal-200"
              title="Select natural Gemini speech voice (softer tone, human breathing, empathetic pacing)"
            >
              {availableVoices.map((v) => (
                <option key={v.id} value={v.id} className="bg-slate-900 text-slate-100">
                  {v.name} ({v.gender})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeatherBroadcastButton;
