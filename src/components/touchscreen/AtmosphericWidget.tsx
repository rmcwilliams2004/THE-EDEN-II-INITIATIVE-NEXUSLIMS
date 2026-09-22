import React, { useState } from 'react';
import {
  Cloud,
  Sun,
  CloudRain,
  Wind,
  Droplets,
  Thermometer,
  AlertTriangle,
  Flame,
  ShieldCheck,
  RefreshCw,
  Zap,
  CheckCircle2,
  Compass,
  ArrowUpRight,
  Activity,
  Radio,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { useAtmosphericSync, VpdStressLevel } from '../../hooks/useAtmosphericSync';

export interface AtmosphericWidgetProps {
  nodeId?: string;
  onAnnounceAlert?: (text: string) => void;
  className?: string;
}

export const AtmosphericWidget: React.FC<AtmosphericWidgetProps> = ({
  nodeId = 'EDEN II NODE #042',
  onAnnounceAlert,
  className = '',
}) => {
  const {
    coords,
    geoProfile,
    currentWeather,
    dailyForecast,
    alerts,
    isLoading,
    error,
    isOfflineFallback,
    isPrehydrationRecommended,
    vpd,
    vpdStressLevel,
    isPrehydrationEngaged,
    prehydrationLog,
    triggerPrehydrationCycle,
    cancelPrehydrationCycle,
    refresh,
    getSevereAlertSpeechText,
  } = useAtmosphericSync();

  const [tempUnit, setTempUnit] = useState<'C' | 'F'>('C');

  const formatTemp = (celsius: number) => {
    if (tempUnit === 'F') {
      return `${((celsius * 9) / 5 + 32).toFixed(1)}°F`;
    }
    return `${celsius.toFixed(1)}°C`;
  };

  const getVpdColor = (level: VpdStressLevel) => {
    switch (level) {
      case 'OPTIMAL':
        return 'text-emerald-400 bg-emerald-950/60 border-emerald-500/40';
      case 'MODERATE_STRESS':
        return 'text-amber-400 bg-amber-950/60 border-amber-500/40';
      case 'SEVERE_TRANSPIRATION_DEFICIT':
        return 'text-red-400 bg-red-950/60 border-red-500/40';
      case 'HUMID_SATURATION':
        return 'text-blue-400 bg-blue-950/60 border-blue-500/40';
    }
  };

  const getWeatherIcon = (code?: number) => {
    if (code === undefined) return <Sun className="w-6 h-6 text-amber-400" />;
    if (code === 0 || code === 1) return <Sun className="w-6 h-6 text-amber-400" />;
    if (code === 2 || code === 3) return <Cloud className="w-6 h-6 text-cyan-300" />;
    if (code >= 51 && code <= 67) return <CloudRain className="w-6 h-6 text-blue-400" />;
    if (code >= 95) return <Zap className="w-6 h-6 text-red-400 animate-pulse" />;
    return <Cloud className="w-6 h-6 text-slate-400" />;
  };

  const handleSpeak = () => {
    const alertText = getSevereAlertSpeechText();
    if (alertText && onAnnounceAlert) {
      onAnnounceAlert(alertText);
    }
  };

  const todayForecast = dailyForecast[0];

  return (
    <div
      className={`bg-slate-900/90 rounded-2xl border border-slate-800 p-4 sm:p-5 flex flex-col gap-4 font-sans text-slate-200 shadow-2xl relative overflow-hidden backdrop-blur-md ${className}`}
    >
      {/* Background Accent Glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Widget Header */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-wide uppercase font-mono">
                Atmospheric Telemetry & Weather Sync
              </h3>
              {isOfflineFallback && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800">
                  Cached Mesh
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              GPS Lock: <span className="font-mono text-emerald-400">{coords.latitude.toFixed(3)}°N, {coords.longitude.toFixed(3)}°E</span> ({geoProfile?.regionName || 'Edge Region'})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Unit Toggle */}
          <button
            onClick={() => setTempUnit((prev) => (prev === 'C' ? 'F' : 'C'))}
            className="px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono font-bold text-slate-300 hover:text-white"
          >
            °{tempUnit}
          </button>

          {/* Refresh Button */}
          <button
            onClick={() => refresh()}
            disabled={isLoading}
            className="p-1.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 border border-slate-800 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh weather telemetry from Open-Meteo API"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Meteorological Gauges Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Temperature */}
        <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono uppercase">
            <span>Ambient Air</span>
            <Thermometer className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="my-1.5 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black font-mono text-white">
              {currentWeather ? formatTemp(currentWeather.temperature2m) : '--'}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            Feels: {currentWeather ? formatTemp(currentWeather.apparentTemperatureC) : '--'}
          </span>
        </div>

        {/* Relative Humidity */}
        <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono uppercase">
            <span>Relative Humidity</span>
            <Droplets className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="my-1.5 flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black font-mono text-cyan-400">
              {currentWeather ? `${currentWeather.relativeHumidity2m}%` : '--'}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            Dew: {currentWeather ? formatTemp(currentWeather.dewPointC) : '--'}
          </span>
        </div>

        {/* Wind Vector */}
        <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono uppercase">
            <span>Wind Velocity</span>
            <Wind className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="my-1.5 flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black font-mono text-white">
              {currentWeather ? `${currentWeather.windSpeed10m.toFixed(1)}` : '--'}
            </span>
            <span className="text-xs text-slate-400 font-mono">km/h</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            Heading: {currentWeather?.windDirection10m ?? 0}°
          </span>
        </div>

        {/* Vapor Pressure Deficit (VPD) */}
        <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono uppercase">
            <span>VPD Index</span>
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="my-1.5 flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black font-mono text-emerald-400">
              {vpd !== null ? `${vpd}` : '--'}
            </span>
            <span className="text-xs text-slate-400 font-mono">kPa</span>
          </div>
          <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border w-fit ${getVpdColor(vpdStressLevel)}`}>
            {vpdStressLevel.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      {/* Evapotranspiration Rate & Pre-Hydration Alert Banner */}
      <div className="p-3.5 rounded-xl border bg-slate-950/90 border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white uppercase font-mono flex items-center gap-1.5">
              <Sun className="w-4 h-4 text-amber-400" />
              FAO-56 Evapotranspiration (ET0):
              <span className="text-amber-400 ml-1">
                {todayForecast ? `${todayForecast.et0Evapotranspiration.toFixed(1)} mm/day` : '4.8 mm/day'}
              </span>
            </span>
            {isPrehydrationRecommended && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-red-950 text-red-300 border border-red-800 animate-pulse">
                SURGE DETECTED
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 font-sans">
            {isPrehydrationRecommended
              ? 'High atmospheric draw detected. Preemptive rootzone hydration is recommended to safeguard seedlings against nitrogen burn.'
              : 'Transpiration demand within normal baseline. Continuous closed-loop drip fertigation engaged.'}
          </p>
        </div>

        {/* Interactive Pre-Hydration Trigger */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          {isPrehydrationEngaged ? (
            <button
              onClick={cancelPrehydrationCycle}
              className="px-3.5 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50 text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(239,68,68,0.2)]"
            >
              <Zap className="w-3.5 h-3.5 animate-spin" />
              <span>Hydration Active (Stop)</span>
            </button>
          ) : (
            <button
              onClick={triggerPrehydrationCycle}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isPrehydrationRecommended
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border border-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.35)] animate-pulse'
                  : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40'
              }`}
            >
              <Droplets className="w-3.5 h-3.5" />
              <span>Engage Pre-Hydration</span>
            </button>
          )}
        </div>
      </div>

      {/* Pre-Hydration Dispatch Log */}
      {prehydrationLog && (
        <div className="px-3 py-2 rounded-lg bg-slate-950 border border-emerald-900/60 font-mono text-[10px] text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
          <span className="truncate">{prehydrationLog}</span>
        </div>
      )}

      {/* Active Severe Weather Alerts Banner */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Active Atmospheric Advisories ({alerts.length})
            </span>
            {onAnnounceAlert && (
              <button
                onClick={handleSpeak}
                className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
                title="Speak alert through Gemini Voice Kiosk"
              >
                <Volume2 className="w-3 h-3" />
                <span>Voice Announce</span>
              </button>
            )}
          </div>

          <div className="space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-xl border flex flex-col gap-1 transition-all ${
                  alert.severity === 'CRITICAL'
                    ? 'bg-red-950/40 border-red-500/50 text-red-200'
                    : alert.severity === 'WARNING'
                    ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                    : 'bg-slate-950/80 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded uppercase ${
                        alert.severity === 'CRITICAL'
                          ? 'bg-red-900 text-white'
                          : alert.severity === 'WARNING'
                          ? 'bg-amber-900 text-amber-200'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {alert.severity}
                    </span>
                    <span className="text-xs font-bold font-mono tracking-tight">{alert.headline}</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-300/90 font-sans leading-relaxed">{alert.description}</p>
                <div className="text-[10px] text-emerald-400 font-mono mt-0.5 flex items-center gap-1">
                  <span className="text-slate-500">Action:</span>
                  <span>{alert.recommendedAction}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5-Day Outlook Mini Strip */}
      <div className="pt-2 border-t border-slate-800/80">
        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 font-mono block mb-2">
          5-Day Agro-Atmospheric Outlook
        </span>
        <div className="grid grid-cols-5 gap-1.5">
          {dailyForecast.slice(0, 5).map((day, idx) => (
            <div
              key={idx}
              className="p-2 bg-slate-950/60 rounded-xl border border-slate-850 flex flex-col items-center text-center gap-1"
            >
              <span className="text-[10px] font-mono text-slate-400 font-bold">
                {idx === 0 ? 'Today' : new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' })}
              </span>
              <div className="my-0.5">{getWeatherIcon(day.weatherCode)}</div>
              <div className="text-xs font-mono font-bold text-white">
                {formatTemp(day.temperatureMax).split('.')[0]}°
              </div>
              <div className="text-[9px] font-mono text-slate-500">
                ET0: {day.et0Evapotranspiration.toFixed(1)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AtmosphericWidget;
