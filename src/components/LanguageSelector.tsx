import React from 'react';
import { Globe, MapPin, Radio, Compass, RefreshCw } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { SUPPORTED_LOCALES } from '../utils/geoLocator';

interface Props {
  targetLang?: string;
  setTargetLang?: (lang: string) => void;
  disabled?: boolean;
  compact?: boolean;
}

export const LanguageSelector: React.FC<Props> = ({ 
  targetLang: propTargetLang, 
  setTargetLang: propSetTargetLang, 
  disabled,
  compact = false 
}) => {
  const { 
    locale, 
    setLocale, 
    gpsCoords, 
    setGpsCoords, 
    localeProfile, 
    isLoadingLocation, 
    refreshGeoLocation,
    simulateRegion 
  } = useLanguage();

  const currentCode = propTargetLang || locale;
  const handleChange = (code: string) => {
    if (propSetTargetLang) {
      propSetTargetLang(code);
    }
    setLocale(code);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 rounded-xl px-2.5 py-1.5 shadow-sm">
        <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <select
          value={currentCode}
          onChange={(e) => handleChange(e.target.value)}
          disabled={disabled}
          aria-label="Select Language Locale"
          className="bg-transparent text-xs font-mono font-bold text-emerald-300 outline-none cursor-pointer"
        >
          {Object.values(SUPPORTED_LOCALES).map((loc) => (
            <option key={loc.locale} value={loc.locale} className="bg-slate-900 text-slate-200">
              {loc.flag} {loc.languageName}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 w-full bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
          <Globe className="w-4 h-4" />
          <span>Zero-Touch Language & GPS Locale</span>
        </div>
        <button
          type="button"
          onClick={() => refreshGeoLocation()}
          disabled={isLoadingLocation}
          className="text-[10px] font-mono text-slate-400 hover:text-emerald-300 flex items-center gap-1 transition-colors cursor-pointer"
          title="Re-query GPS Hardware"
        >
          <RefreshCw className={`w-3 h-3 ${isLoadingLocation ? 'animate-spin text-emerald-400' : ''}`} />
          <span>{isLoadingLocation ? 'Locating...' : 'GPS Sync'}</span>
        </button>
      </div>

      {/* Active GPS telemetry badge */}
      <div className="flex items-center justify-between bg-slate-950/80 border border-slate-800 px-2.5 py-1.5 rounded-lg text-[11px] font-mono text-slate-300">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>
            {gpsCoords.latitude.toFixed(4)}°, {gpsCoords.longitude.toFixed(4)}°
          </span>
        </div>
        <span className="text-emerald-400 font-bold flex items-center gap-1">
          <span>{localeProfile.flag}</span>
          <span>{localeProfile.regionName}</span>
        </span>
      </div>

      {/* Locale Select Dropdown */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] uppercase tracking-widest text-slate-500 font-mono font-bold flex items-center justify-between">
          <span>Active Edge Locale & Voice Dialect:</span>
          <span className="text-cyan-400">{localeProfile.locale}</span>
        </label>
        <select 
          value={currentCode} 
          onChange={(e) => handleChange(e.target.value)}
          disabled={disabled}
          className="bg-slate-950 border border-slate-700 text-xs font-mono text-slate-200 rounded-lg px-3 py-2 outline-none focus:border-emerald-500 disabled:opacity-50 cursor-pointer"
        >
          {Object.values(SUPPORTED_LOCALES).map((l) => (
            <option key={l.locale} value={l.locale} className="bg-slate-900 text-slate-200">
              {l.flag} {l.languageName} ({l.locale})
            </option>
          ))}
        </select>
      </div>

      {/* Quick Regional Presets */}
      <div className="pt-2 border-t border-slate-800/80">
        <span className="text-[10px] uppercase font-mono text-slate-500 block mb-1.5">
          Simulate Zero-Touch GPS Bounding Boxes:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {Object.values(SUPPORTED_LOCALES).map((loc) => (
            <button
              key={loc.locale}
              type="button"
              onClick={() => simulateRegion(loc.locale)}
              className={`px-2 py-1 rounded text-[10px] font-mono font-bold flex items-center justify-center gap-1 border transition-all cursor-pointer ${
                locale === loc.locale 
                  ? 'bg-emerald-950 border-emerald-500 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <span>{loc.flag}</span>
              <span>{loc.countryCode}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
