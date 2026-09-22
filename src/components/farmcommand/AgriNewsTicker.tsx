import React, { useState } from 'react';
import {
  Globe,
  AlertTriangle,
  Flame,
  Bug,
  Sprout,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Info,
  Clock,
  Layers,
  FileText,
  X,
  Volume2,
  Droplets,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { useAtmosphericSync } from '../../hooks/useAtmosphericSync';
import { AgriNewsItem, AgriNewsCategory } from '../../services/agriNewsService';

export interface AgriNewsTickerProps {
  onAnnounceBulletin?: (text: string) => void;
  className?: string;
}

export const AgriNewsTicker: React.FC<AgriNewsTickerProps> = ({
  onAnnounceBulletin,
  className = '',
}) => {
  const {
    newsItems,
    alerts,
    agroZone,
    geoProfile,
    isLoading,
    isOfflineFallback,
    getSevereAlertSpeechText,
  } = useAtmosphericSync();

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [activeModalItem, setActiveModalItem] = useState<AgriNewsItem | null>(null);

  const filterCategory = (cat: string) => {
    setSelectedCategory(cat);
  };

  const filteredItems = newsItems.filter((item) => {
    if (selectedCategory === 'ALL') return true;
    if (selectedCategory === 'WEATHER') return item.category === 'WEATHER_ALERT';
    if (selectedCategory === 'PESTS') return item.category === 'PEST_EPIDEMIOLOGY';
    if (selectedCategory === 'AGRONOMY') return item.category === 'AGRONOMY_ADVISORY';
    if (selectedCategory === 'FERTILIZER') return item.category === 'FERTILIZER_MARKET' || item.category === 'REGULATORY';
    return true;
  });

  const getCategoryIcon = (category: AgriNewsCategory) => {
    switch (category) {
      case 'WEATHER_ALERT':
        return <Flame className="w-3.5 h-3.5 text-amber-400" />;
      case 'PEST_EPIDEMIOLOGY':
        return <Bug className="w-3.5 h-3.5 text-red-400" />;
      case 'AGRONOMY_ADVISORY':
        return <Sprout className="w-3.5 h-3.5 text-emerald-400" />;
      case 'FERTILIZER_MARKET':
      case 'REGULATORY':
        return <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-950 text-red-300 border-red-800';
      case 'WARNING':
        return 'bg-amber-950 text-amber-300 border-amber-800';
      case 'ADVISORY':
        return 'bg-blue-950 text-blue-300 border-blue-800';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className={`space-y-3 font-sans ${className}`}>
      {/* Ticker Header & Category Filters */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-900/90 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white tracking-wide uppercase font-mono flex items-center gap-1.5">
              Regional Agronomic & Weather Bulletins
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                {agroZone.replace('_', ' ')}
              </span>
            </h4>
            <span className="text-[10px] text-slate-400">
              Synchronized with localized extension desks & Open-Meteo telemetry
            </span>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'WEATHER', label: 'Weather' },
            { id: 'PESTS', label: 'Pests' },
            { id: 'AGRONOMY', label: 'Agronomy' },
            { id: 'FERTILIZER', label: 'Fertilizer' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => filterCategory(cat.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                selectedCategory === cat.id
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Severe Alerts Urgent Marquee / Ribbon (If active) */}
      {alerts.length > 0 && (
        <div className="p-2.5 rounded-xl bg-gradient-to-r from-red-950/80 via-slate-900 to-amber-950/80 border border-red-500/40 flex items-center justify-between gap-3 shadow-lg animate-pulse">
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="text-[10px] font-mono font-bold bg-red-900 text-white px-1.5 py-0.5 rounded uppercase shrink-0">
              URGENT ADVISORY
            </span>
            <span className="text-xs font-semibold text-slate-200 truncate font-sans">
              {alerts[0].headline}: {alerts[0].recommendedAction}
            </span>
          </div>

          {onAnnounceBulletin && (
            <button
              onClick={() => {
                const speech = getSevereAlertSpeechText();
                if (speech) onAnnounceBulletin(speech);
              }}
              className="px-2.5 py-1 rounded-lg bg-red-900/60 hover:bg-red-800 text-white text-[11px] font-mono font-bold shrink-0 flex items-center gap-1 border border-red-500/50"
            >
              <Volume2 className="w-3 h-3" />
              <span>Voice</span>
            </button>
          )}
        </div>
      )}

      {/* Bulletins Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            onClick={() => setActiveModalItem(item)}
            className="p-3.5 bg-slate-900/80 hover:bg-slate-850 rounded-xl border border-slate-800 hover:border-emerald-500/40 transition-all cursor-pointer flex flex-col justify-between gap-2.5 group shadow-sm"
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="p-1 rounded bg-slate-800">{getCategoryIcon(item.category)}</span>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">
                    {item.category.replace('_', ' ')}
                  </span>
                </div>
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.2 rounded uppercase border ${getSeverityBadge(
                    item.severity
                  )}`}
                >
                  {item.severity}
                </span>
              </div>

              <h5 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-2 leading-snug">
                {item.title}
              </h5>

              <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed font-sans">
                {item.summary}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
              <span className="truncate max-w-[160px]">{item.source}</span>
              <span className="text-emerald-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                Details <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Full Bulletin Modal View */}
      {activeModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-xl w-full p-5 space-y-4 shadow-2xl relative text-slate-200">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase border font-bold ${getSeverityBadge(
                      activeModalItem.severity
                    )}`}
                  >
                    {activeModalItem.severity}
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                    {activeModalItem.regionName}
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white leading-snug mt-1">
                  {activeModalItem.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveModalItem(null)}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Summary */}
            <div className="space-y-2">
              <h6 className="text-xs font-bold text-slate-400 uppercase font-mono">Bulletin Details</h6>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                {activeModalItem.summary}
              </p>
            </div>

            {/* Crop Impacts */}
            {activeModalItem.cropImpacts && activeModalItem.cropImpacts.length > 0 && (
              <div className="space-y-1.5">
                <h6 className="text-xs font-bold text-slate-400 uppercase font-mono">Affected Crops</h6>
                <div className="flex flex-wrap gap-1.5">
                  {activeModalItem.cropImpacts.map((crop, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg font-mono"
                    >
                      🌱 {crop}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended Action Prompt */}
            {activeModalItem.actionPrompt && (
              <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-1">
                <span className="text-xs font-bold text-emerald-300 uppercase font-mono flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Recommended Agronomic Protocol
                </span>
                <p className="text-xs text-emerald-200/90 leading-relaxed font-sans">
                  {activeModalItem.actionPrompt}
                </p>
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-500">
              <span>Source: {activeModalItem.source}</span>
              <button
                onClick={() => setActiveModalItem(null)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold font-mono transition-colors"
              >
                Close Bulletin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgriNewsTicker;
