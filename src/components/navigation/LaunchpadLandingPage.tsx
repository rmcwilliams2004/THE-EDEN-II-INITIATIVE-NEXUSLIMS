import React, { useState } from 'react';
import { 
  Sprout, 
  Cpu, 
  Leaf, 
  Users, 
  CloudSun, 
  ShieldCheck, 
  ArrowUpRight, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  ChevronDown, 
  Globe, 
  Radio, 
  Settings2,
  Clock,
  Layers
} from 'lucide-react';
import { useNavigation, NavigationTab } from '../../context/NavigationContext';
import { useNavigationPreference } from '../../context/NavigationPreferenceContext';
import { useAmbientTheme } from '../../context/AmbientThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { WeatherBroadcastButton } from './WeatherBroadcastButton';
import { LanguageSelector } from '../LanguageSelector';

interface LaunchpadBlock {
  id: string;
  title: string;
  subtitle: string;
  summary: string;
  tab: NavigationTab;
  icon: React.ReactNode;
  accentColor: 'emerald' | 'cyan' | 'amber' | 'purple' | 'blue' | 'rose';
  status: {
    label: string;
    variant: 'optimal' | 'normal' | 'alert' | 'synced';
    details: string;
  };
}

export const LaunchpadLandingPage: React.FC = () => {
  const { setActiveTab } = useNavigation();
  const { defaultView, setDefaultView, availableDefaultViews } = useNavigationPreference();
  const { visualTheme } = useAmbientTheme();
  const { t, localeProfile, locale } = useLanguage();

  const isLight = visualTheme === 'sunlight';

  // The 6 Primary Architectural Blocks with localized text
  const blocks: LaunchpadBlock[] = [
    {
      id: 'farm-command',
      title: t('block_farm_command_title', 'Farm Command'),
      subtitle: t('block_farm_command_subtitle', 'Agronomy & Precision Drip Fertigation'),
      summary: t('block_farm_command_summary', 'Automated closed-loop drip fertigation, soil NPK balancing, and crop evapotranspiration scheduling.'),
      tab: 'FARM_COMMAND',
      icon: <Sprout className="w-8 h-8" />,
      accentColor: 'emerald',
      status: {
        label: t('block_farm_command_status', 'Optimal'),
        variant: 'optimal',
        details: t('block_farm_command_details', 'Soil VWC 31.4% · pH 6.35 · Drip Active'),
      },
    },
    {
      id: 'edge-core',
      title: t('block_edge_core_title', 'Edge Core'),
      subtitle: t('block_edge_core_subtitle', 'Hardware Kiosk & 600-Bar Microgrid'),
      summary: t('block_edge_core_summary', '20-ft container catalytic telemetry, hydraulic intensifier, and tactile smallholder foliar dispenser.'),
      tab: 'TOUCHSCREEN',
      icon: <Cpu className="w-8 h-8" />,
      accentColor: 'cyan',
      status: {
        label: t('block_edge_core_status', 'Normal'),
        variant: 'normal',
        details: t('block_edge_core_details', '597.2 bar · 390.4°C · 2,400L Ready'),
      },
    },
    {
      id: 'esg-ledger',
      title: t('block_esg_ledger_title', 'ESG Ledger'),
      subtitle: t('block_esg_ledger_subtitle', 'EcoCreditX & Verified Carbon Minting'),
      summary: t('block_esg_ledger_summary', 'Tamper-proof Hedera Guardian dMRV tokens, verified regenerative offsets, and carbon audit certificates.'),
      tab: 'ECOCREDITX',
      icon: <Leaf className="w-8 h-8" />,
      accentColor: 'amber',
      status: {
        label: t('block_esg_ledger_status', 'Synced'),
        variant: 'synced',
        details: t('block_esg_ledger_details', '14,820 kg CO₂e Minted · Guardian Block #402,918'),
      },
    },
    {
      id: 'sister-link',
      title: t('block_sister_link_title', 'Sister-Link'),
      subtitle: t('block_sister_link_subtitle', 'Feeders of the World Social Hub'),
      summary: t('block_sister_link_summary', 'Decentralized peer exchange, farmer cooperative field updates, and regional agronomic notes.'),
      tab: 'FEED',
      icon: <Users className="w-8 h-8" />,
      accentColor: 'purple',
      status: {
        label: t('block_sister_link_status', 'Normal'),
        variant: 'normal',
        details: t('block_sister_link_details', '12 Connected Co-ops · 84 Transmissions'),
      },
    },
    {
      id: 'atmospheric-feed',
      title: t('block_atmospheric_feed_title', 'Atmospheric Feed'),
      subtitle: t('block_atmospheric_feed_subtitle', 'Agronomic News & Regional Warnings'),
      summary: t('block_atmospheric_feed_summary', 'Open-Meteo micro-climate tracking, localized weather radio bulletins, and market price radar.'),
      tab: 'MARKET_NEWS',
      icon: <CloudSun className="w-8 h-8" />,
      accentColor: 'blue',
      status: {
        label: t('block_atmospheric_feed_status', '3 Alerts'),
        variant: 'alert',
        details: t('block_atmospheric_feed_details', 'High Evapotranspiration · 0.0 mm Rain · Low Frost'),
      },
    },
    {
      id: 'system-safety',
      title: t('block_system_safety_title', 'System & Safety'),
      subtitle: t('block_system_safety_subtitle', 'Diagnostics, IAM & SIL-3 Interlocks'),
      summary: t('block_system_safety_summary', 'SIL-3 hardware interlock controls, cryptographic firmware signing, and diagnostic telemetry archives.'),
      tab: 'SETTINGS',
      icon: <ShieldCheck className="w-8 h-8" />,
      accentColor: 'rose',
      status: {
        label: t('block_system_safety_status', 'Optimal'),
        variant: 'optimal',
        details: t('block_system_safety_details', 'SIL-3 Certified · 0 Interlocks Tripped · 4ms Lag'),
      },
    },
  ];

  const getAccentClasses = (color: LaunchpadBlock['accentColor']) => {
    switch (color) {
      case 'emerald':
        return {
          cardBorder: isLight ? 'border-emerald-200 hover:border-emerald-500' : 'border-emerald-950/80 hover:border-emerald-500/80',
          iconBg: isLight ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30',
          hoverGlow: 'hover:shadow-[0_8px_30px_rgba(16,185,129,0.15)]',
          badgeText: isLight ? 'text-emerald-800 bg-emerald-50 border-emerald-200' : 'text-emerald-300 bg-emerald-950/70 border-emerald-500/40',
        };
      case 'cyan':
        return {
          cardBorder: isLight ? 'border-cyan-200 hover:border-cyan-500' : 'border-cyan-950/80 hover:border-cyan-500/80',
          iconBg: isLight ? 'bg-cyan-100 text-cyan-700' : 'bg-cyan-950/80 text-cyan-400 border border-cyan-500/30',
          hoverGlow: 'hover:shadow-[0_8px_30px_rgba(6,182,212,0.15)]',
          badgeText: isLight ? 'text-cyan-800 bg-cyan-50 border-cyan-200' : 'text-cyan-300 bg-cyan-950/70 border-cyan-500/40',
        };
      case 'amber':
        return {
          cardBorder: isLight ? 'border-amber-200 hover:border-amber-500' : 'border-amber-950/80 hover:border-amber-500/80',
          iconBg: isLight ? 'bg-amber-100 text-amber-700' : 'bg-amber-950/80 text-amber-400 border border-amber-500/30',
          hoverGlow: 'hover:shadow-[0_8px_30px_rgba(245,158,11,0.15)]',
          badgeText: isLight ? 'text-amber-800 bg-amber-50 border-amber-200' : 'text-amber-300 bg-amber-950/70 border-amber-500/40',
        };
      case 'purple':
        return {
          cardBorder: isLight ? 'border-purple-200 hover:border-purple-500' : 'border-purple-950/80 hover:border-purple-500/80',
          iconBg: isLight ? 'bg-purple-100 text-purple-700' : 'bg-purple-950/80 text-purple-400 border border-purple-500/30',
          hoverGlow: 'hover:shadow-[0_8px_30px_rgba(168,85,247,0.15)]',
          badgeText: isLight ? 'text-purple-800 bg-purple-50 border-purple-200' : 'text-purple-300 bg-purple-950/70 border-purple-500/40',
        };
      case 'blue':
        return {
          cardBorder: isLight ? 'border-blue-200 hover:border-blue-500' : 'border-blue-950/80 hover:border-blue-500/80',
          iconBg: isLight ? 'bg-blue-100 text-blue-700' : 'bg-blue-950/80 text-blue-400 border border-blue-500/30',
          hoverGlow: 'hover:shadow-[0_8px_30px_rgba(59,130,246,0.15)]',
          badgeText: isLight ? 'text-blue-800 bg-blue-50 border-blue-200' : 'text-blue-300 bg-blue-950/70 border-blue-500/40',
        };
      case 'rose':
      default:
        return {
          cardBorder: isLight ? 'border-rose-200 hover:border-rose-500' : 'border-rose-950/80 hover:border-rose-500/80',
          iconBg: isLight ? 'bg-rose-100 text-rose-700' : 'bg-rose-950/80 text-rose-400 border border-rose-500/30',
          hoverGlow: 'hover:shadow-[0_8px_30px_rgba(244,63,94,0.15)]',
          badgeText: isLight ? 'text-rose-800 bg-rose-50 border-rose-200' : 'text-rose-300 bg-rose-950/70 border-rose-500/40',
        };
    }
  };

  return (
    <div
      className={`min-h-[calc(100vh-8rem)] w-full transition-colors duration-300 font-sans ${
        isLight ? 'bg-slate-100 text-slate-900' : 'bg-[#05070a] text-slate-100'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        {/* ========================================================================= */}
        {/* 1. HEADER & HERO CONTROL SECTION                                          */}
        {/* ========================================================================= */}
        <header
          className={`p-6 sm:p-8 rounded-3xl border transition-all duration-300 ${
            isLight
              ? 'bg-white border-slate-200 shadow-xl'
              : 'bg-slate-900/85 border-slate-800/90 shadow-2xl backdrop-blur-md'
          }`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Logo and Brand Kicker */}
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <span className="h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse" />
                <span className="font-mono text-xs uppercase tracking-widest text-emerald-500 font-bold">
                  {t('launchpad_kicker', 'AUTONOMOUS AGRO-SYNTHESIS PLATFORM · SIL-3 CERTIFIED')}
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-mono tracking-tight flex items-baseline gap-3">
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                  EDEN II
                </span>
                <span className="text-slate-400 text-xl sm:text-2xl font-normal">//</span>
                <span className={isLight ? 'text-slate-800' : 'text-white'}>
                  NexusLIMS
                </span>
              </h1>
              <p className={`text-xs sm:text-sm max-w-2xl leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                {t('launchpad_desc', 'Clean command launchpad for containerized biological synthesis, automated precision drip fertigation, and verified Hedera dMRV ESG asset auditing.')}
              </p>
            </div>

            {/* Quick Language & Node Telemetry Badge */}
            <div className="flex flex-wrap items-center gap-3">
              <div className={`px-3 py-1.5 rounded-xl border text-xs font-mono flex items-center gap-2 ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-950 border-slate-800 text-slate-300'
              }`}>
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                <span>{localeProfile?.regionName || 'Global Agri Hub'}</span>
                <span className="text-slate-500">·</span>
                <span className="font-bold text-emerald-400">{locale}</span>
              </div>
              <LanguageSelector compact />
            </div>
          </div>

          {/* Sub-Header Industrial Controls Bar: Red Toggle + Boot Preference Dropdown */}
          <div className="mt-6 pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            {/* Tactical Red Broadcast Toggle Button */}
            <div className="flex-1 max-w-xl">
              <WeatherBroadcastButton variant="hero" showFrequencyBars />
            </div>

            {/* Default View Selector Dropdown */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 shrink-0">
              <label htmlFor="select-default-view" className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
                <Settings2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>{t('default_view_boot', 'Default View on Boot:')}</span>
              </label>
              <div className="relative inline-block w-full sm:w-auto">
                <select
                  id="select-default-view"
                  value={defaultView}
                  onChange={(e) => setDefaultView(e.target.value as NavigationTab)}
                  className={`w-full sm:w-auto appearance-none pl-3 pr-8 py-2 rounded-xl text-xs font-mono font-bold border transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 hover:bg-white'
                      : 'bg-slate-950 border-slate-700 text-cyan-300 hover:border-slate-500'
                  }`}
                >
                  {availableDefaultViews.map((item) => (
                    <option key={item.id} value={item.id} className="bg-slate-900 text-white">
                      {item.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* 2. RESPONSIVE BLOCK MENU GRID (3x2 or 2x3 Large Tactile Cards)            */}
        {/* ========================================================================= */}
        <section aria-label="System Launchpad Modules" className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t('core_operational_modules', 'CORE OPERATIONAL MODULES')}</span>
            </h2>
            <span className="text-xs font-mono text-slate-500">{t('active_domains', '6 ACTIVE DOMAINS')}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {blocks.map((block) => {
              const accent = getAccentClasses(block.accentColor);
              const isDefault = defaultView === block.tab;

              return (
                <button
                  key={block.id}
                  id={`launchpad-card-${block.id}`}
                  onClick={() => setActiveTab(block.tab)}
                  className={`group relative text-left p-6 rounded-3xl border-2 transition-all duration-300 cursor-pointer flex flex-col justify-between gap-6 ${
                    isLight ? 'bg-white' : 'bg-slate-900/90'
                  } ${accent.cardBorder} ${accent.hoverGlow} active:scale-[0.985] shadow-lg`}
                >
                  {/* Top Bar: Icon + Default Pin Indicator + Arrow */}
                  <div className="flex items-start justify-between gap-4">
                    <div className={`p-3.5 rounded-2xl transition-transform group-hover:scale-105 duration-200 ${accent.iconBg}`}>
                      {block.icon}
                    </div>

                    <div className="flex items-center gap-2">
                      {isDefault && (
                        <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md border ${
                          isLight ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-amber-950 text-amber-300 border-amber-500/40'
                        }`}>
                          {t('default_boot_badge', 'DEFAULT BOOT')}
                        </span>
                      )}
                      <div className={`p-2 rounded-xl transition-colors ${
                        isLight ? 'bg-slate-100 text-slate-600 group-hover:bg-slate-200' : 'bg-slate-800 text-slate-400 group-hover:text-white group-hover:bg-slate-700'
                      }`}>
                        <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </div>
                    </div>
                  </div>

                  {/* Middle Content: Title, Subtitle, 1-Sentence Summary */}
                  <div className="space-y-2">
                    <h3 className={`text-xl font-bold font-mono tracking-tight transition-colors ${
                      isLight ? 'text-slate-900 group-hover:text-emerald-700' : 'text-white group-hover:text-emerald-300'
                    }`}>
                      {block.title}
                    </h3>
                    <p className={`text-xs font-mono font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      {block.subtitle}
                    </p>
                    <p className={`text-xs leading-relaxed pt-1 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                      {block.summary}
                    </p>
                  </div>

                  {/* Bottom Bar: Subtle Status Badge & Telemetry String */}
                  <div className={`pt-4 border-t flex flex-col gap-1.5 font-mono ${
                    isLight ? 'border-slate-100' : 'border-slate-800'
                  }`}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-500 uppercase tracking-wider">{t('status_label', 'Status:')}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${accent.badgeText}`}>
                        {block.status.label}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {block.status.details}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. QUICK NAVIGATION FOOTER BAR                                            */}
        {/* ========================================================================= */}
        <footer
          className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono ${
            isLight
              ? 'bg-white border-slate-200 text-slate-600'
              : 'bg-slate-900/60 border-slate-800 text-slate-400'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>{t('container_node_id', 'CONTAINER NODE ID')}: <strong className={isLight ? 'text-slate-900' : 'text-white'}>EDEN-II-ALPHA-042</strong></span>
            <span className="text-slate-600">·</span>
            <span>{t('firmware', 'FIRMWARE')}: <strong className="text-emerald-400">v2.4.1-STABLE</strong></span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('SETTINGS')}
              className="hover:text-cyan-400 transition-colors cursor-pointer"
            >
              {t('system_config', 'System Config')}
            </button>
            <span className="text-slate-600">·</span>
            <button
              onClick={() => setActiveTab('KIOSK')}
              className="hover:text-emerald-400 transition-colors cursor-pointer"
            >
              {t('dispenser_kiosk', 'Dispenser Kiosk')}
            </button>
            <span className="text-slate-600">·</span>
            <button
              onClick={() => setActiveTab('DASHBOARD')}
              className="hover:text-amber-400 transition-colors cursor-pointer"
            >
              {t('hardware_sil3', 'Hardware SIL-3 Telemetry')}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default LaunchpadLandingPage;
