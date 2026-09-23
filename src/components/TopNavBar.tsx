import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Users,
  LayoutGrid,
  Radio,
  Tablet,
  Droplets,
  BarChart3,
  Hexagon,
  Award,
  Sprout,
  Calculator,
  Map,
  Mic,
  Video,
  Settings,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Compass,
  Layers,
  Search,
  ExternalLink,
  Globe,
  Menu,
  X,
  SlidersHorizontal,
  ArrowRight,
  ShieldCheck,
  Zap,
  Activity,
  ChevronsUpDown,
} from 'lucide-react';
import { useNavigation, NavigationTab, NavItemConfig } from '../context/NavigationContext';

export interface TopNavBarProps {
  onOpenUserManual: () => void;
}

interface NavGroupDef {
  id: string;
  label: string;
  badge?: string;
  icon: React.ElementType;
  items: {
    id: NavigationTab;
    label: string;
    shortLabel: string;
    desc: string;
    icon: React.ElementType;
    badge?: string;
  }[];
}

export const TopNavBar: React.FC<TopNavBarProps> = ({ onOpenUserManual }) => {
  const { activeTab, setActiveTab, navItems } = useNavigation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Accordion open state for categories in the slide-out drawer
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    primary: true,
    field: true,
    compliance: true,
    tools: true,
  });

  const navGroups: NavGroupDef[] = useMemo(
    () => [
      {
        id: 'primary',
        label: 'Core Operations',
        badge: 'Live',
        icon: LayoutGrid,
        items: [
          {
            id: 'LAUNCHPAD',
            label: 'Launchpad Grid',
            shortLabel: 'Launchpad',
            desc: 'Overview block-menu, direct tactical routing & live weather radio',
            icon: Layers,
            badge: 'Home',
          },
          {
            id: 'FEED',
            label: 'Sister-Link Feed',
            shortLabel: 'Feed',
            desc: 'Real-time farm network, peer updates & telemetry media posts',
            icon: Users,
            badge: 'P2P',
          },
          {
            id: 'DASHBOARD',
            label: 'Live Telemetry & SIL-3',
            shortLabel: 'Telemetry',
            desc: 'Real-time 2oo3 voting, reactor pressure & optical sensor graphs',
            icon: LayoutGrid,
            badge: 'SIL-3',
          },
          {
            id: 'KIOSK',
            label: '20-ft Sister Kiosk',
            shortLabel: 'Kiosk UI',
            desc: 'Exterior touchscreen, Voice AI & Mode B 1.0% foliar dilution',
            icon: Radio,
            badge: 'HMI',
          },
        ],
      },
      {
        id: 'field',
        label: 'Field & Agronomy',
        badge: 'LoRaWAN',
        icon: Tablet,
        items: [
          {
            id: 'FARM_COMMAND',
            label: 'Farm Command (Overview)',
            shortLabel: 'Farm Command',
            desc: 'Multi-depth soil probes, rhizosphere pH & automated CaCO3 dosing',
            icon: Tablet,
          },
          {
            id: 'MAP',
            label: 'GIS Heatmap & Contours',
            shortLabel: 'GIS Map',
            desc: 'Sub-acre NDVI, moisture contours & soil nutrient spatial analysis',
            icon: Droplets,
          },
          {
            id: 'ANALYTICS',
            label: 'Soil & Crop Analytics',
            shortLabel: 'Analytics',
            desc: 'Nitrification flux curves, EC conductivity & yield impact models',
            icon: BarChart3,
          },
          {
            id: 'TOUCHSCREEN',
            label: 'Eden II Touchscreen HMI',
            shortLabel: 'Touch HMI',
            desc: 'Direct 21" container control panel & hardware diagnostic triggers',
            icon: Hexagon,
            badge: '21-inch',
          },
        ],
      },
      {
        id: 'compliance',
        label: 'dMRV & Carbon Finance',
        badge: 'Hedera',
        icon: Award,
        items: [
          {
            id: 'MARKET_NEWS',
            label: 'Market & Carbon Intel',
            shortLabel: 'Live Intel',
            desc: 'Google Search Grounding for real-time agricultural news & laws',
            icon: Globe,
            badge: 'Live AI',
          },
          {
            id: 'ECOCREDITX',
            label: 'EcoCreditX Hedera dMRV',
            shortLabel: 'EcoCreditX',
            desc: 'Cryptographic Scope 1 green ledger & tokenized fertilizer offsets',
            icon: Award,
            badge: 'Hedera',
          },
          {
            id: 'VCM',
            label: 'Carbon Credits (VCM)',
            shortLabel: 'Carbon VCM',
            desc: 'Voluntary carbon market trading, verification & retirement ledger',
            icon: Sprout,
          },
          {
            id: 'ONBOARDING',
            label: 'Section 179 & Grants',
            shortLabel: 'Sec. 179',
            desc: 'USDA REAP grants, tax write-offs & clean equipment depreciation',
            icon: Calculator,
            badge: '$1.22M Cap',
          },
        ],
      },
      {
        id: 'tools',
        label: 'AI & Intelligence Diagnostics',
        badge: 'Gemini',
        icon: Sparkles,
        items: [
          {
            id: 'ASSET_MAP',
            label: 'Hardware Asset Map',
            shortLabel: 'Asset Map',
            desc: 'Global fleet node telemetry, GPS coordinates & container status',
            icon: Map,
          },
          {
            id: 'VOICE_ASSISTANT',
            label: 'Universal Voice AI',
            shortLabel: 'Voice AI',
            desc: 'Zero-touch voice translation, diagnostics & field voice logs',
            icon: Mic,
          },
          {
            id: 'VIDEO_GEN',
            label: 'Neural Video Gen',
            shortLabel: 'Video Gen',
            desc: 'AI-assisted crop visualization & visual synthesis engine',
            icon: Video,
          },
          {
            id: 'SETTINGS',
            label: 'System Settings & Safety',
            shortLabel: 'Settings',
            desc: 'Hardware interlocks, calibration & telemetry polling rates',
            icon: Settings,
          },
        ],
      },
    ],
    []
  );

  // Close drawer on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsDrawerOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleCategory = (catId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  const expandAll = () => {
    setExpandedCategories({
      primary: true,
      field: true,
      compliance: true,
      tools: true,
    });
  };

  const collapseAll = () => {
    setExpandedCategories({
      primary: false,
      field: false,
      compliance: false,
      tools: false,
    });
  };

  const activeItemConfig = useMemo(() => {
    for (const group of navGroups) {
      const match = group.items.find((item) => item.id === activeTab);
      if (match) return { group, item: match };
    }
    return { group: navGroups[0], item: navGroups[0].items[0] };
  }, [activeTab, navGroups]);

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return navGroups;
    const query = searchQuery.toLowerCase();
    return navGroups
      .map((group) => {
        const filteredItems = group.items.filter(
          (item) =>
            item.label.toLowerCase().includes(query) ||
            item.desc.toLowerCase().includes(query) ||
            item.shortLabel.toLowerCase().includes(query) ||
            group.label.toLowerCase().includes(query)
        );
        return {
          ...group,
          items: filteredItems,
        };
      })
      .filter((group) => group.items.length > 0);
  }, [navGroups, searchQuery]);

  return (
    <>
      <nav
        aria-label="Top Navigation Menu"
        className="w-full bg-slate-900/95 backdrop-blur-lg border-b border-slate-800 px-3 sm:px-4 py-2 flex items-center justify-between gap-3 shrink-0 z-30 font-sans shadow-md"
      >
        {/* Left: Slide-In Drawer Trigger + Quick Active Breadcrumb */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold text-xs font-mono transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer"
            title="Open Full Navigation Drawer with Expandable Accordions"
          >
            <Menu className="w-4 h-4 text-slate-950" />
            <span className="hidden sm:inline">All Modules & Accordion Menu</span>
            <span className="sm:hidden">Menu</span>
            <span className="text-[10px] bg-slate-950 text-emerald-300 px-1.5 py-0.2 rounded font-mono">
              15 Views
            </span>
          </button>

          {/* Quick Active Module Pill */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-slate-950/80 rounded-lg border border-slate-800 text-xs">
            <span className="text-[10px] uppercase font-bold text-slate-500 font-mono">
              {activeItemConfig.group.label}:
            </span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <activeItemConfig.item.icon className="w-3.5 h-3.5" />
              {activeItemConfig.item.label}
            </span>
          </div>
        </div>

        {/* Center: Quick Horizontal Module Pills for Instant 1-Click Access */}
        <div className="hidden lg:flex items-center gap-1 overflow-x-auto custom-scrollbar py-0.5 max-w-2xl">
          {navGroups.flatMap((g) => g.items.slice(0, 2)).map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                    : 'bg-slate-950/40 hover:bg-slate-800/80 text-slate-300 hover:text-white border border-slate-800/60'
                }`}
              >
                <Icon className={`w-3 h-3 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.shortLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Online User Manual & Search Trigger */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenUserManual}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 hover:text-white text-xs font-bold font-mono transition-all flex items-center gap-1.5 border border-slate-700 cursor-pointer shadow-sm"
            title="Open Comprehensive Online User Manual & System Guide"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Online User Manual</span>
            <span className="sm:hidden">Manual</span>
            <span className="text-[9px] bg-emerald-950 text-emerald-300 px-1.5 py-0.2 rounded font-mono hidden md:inline border border-emerald-800">
              v2.4.1
            </span>
          </button>
        </div>
      </nav>

      {/* ========================================================================= */}
      {/* FULL SLIDE-IN NAVIGATION ACCORDION DRAWER                                */}
      {/* ========================================================================= */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex font-sans animate-fadeIn">
          {/* Backdrop */}
          <div
            onClick={() => setIsDrawerOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            aria-hidden="true"
          />

          {/* Slide-in Panel from the Left */}
          <div className="relative w-full max-w-lg bg-slate-950 border-r border-slate-800 shadow-2xl flex flex-col h-full z-10 text-slate-200 transform transition-transform duration-300 ease-out">
            {/* Drawer Header */}
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center font-bold text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                  NX
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                    System Navigation Menu
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                      NexusLIMS
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">All modular views, sub-systems & diagnostic tools</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-red-950/60 hover:text-red-400 text-slate-400 transition-colors"
                aria-label="Close navigation drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Search & Accordion Controls */}
            <div className="p-3.5 bg-slate-900/60 border-b border-slate-800 flex flex-col gap-2.5">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search views (e.g. SIL-3, Farm Command, Hedera dMRV)..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-sans"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 text-xs text-slate-500 hover:text-slate-300"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span className="text-[11px] font-mono text-slate-500">
                  {filteredGroups.reduce((acc, g) => acc + g.items.length, 0)} Total Accessible Views
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={expandAll}
                    className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    Expand All
                  </button>
                  <span className="text-slate-600">|</span>
                  <button
                    type="button"
                    onClick={collapseAll}
                    className="text-[11px] font-mono text-slate-400 hover:text-white transition-colors"
                  >
                    Collapse All
                  </button>
                </div>
              </div>
            </div>

            {/* Main Accordion List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
              {filteredGroups.map((group) => {
                const isExpanded = expandedCategories[group.id] ?? true;
                const GroupIcon = group.icon;
                const hasActiveChild = group.items.some((item) => item.id === activeTab);

                return (
                  <div
                    key={group.id}
                    className={`rounded-2xl border transition-all overflow-hidden ${
                      hasActiveChild
                        ? 'border-emerald-500/40 bg-slate-900/90 shadow-[0_0_15px_rgba(16,185,129,0.06)]'
                        : 'border-slate-800 bg-slate-900/40'
                    }`}
                  >
                    {/* Accordion Category Header */}
                    <button
                      type="button"
                      onClick={() => toggleCategory(group.id)}
                      className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-850/60 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`p-1.5 rounded-lg ${
                            hasActiveChild
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          <GroupIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white tracking-wide">
                              {group.label}
                            </span>
                            {group.badge && (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                {group.badge}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {group.items.length} sub-modules
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <ChevronRight
                          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                            isExpanded ? 'rotate-90 text-emerald-400' : ''
                          }`}
                        />
                      </div>
                    </button>

                    {/* Accordion Sub-items */}
                    {isExpanded && (
                      <div className="p-2 pt-0 space-y-1.5 border-t border-slate-800/60 bg-slate-950/60">
                        {group.items.map((item) => {
                          const isItemActive = activeTab === item.id;
                          const ItemIcon = item.icon;

                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                setActiveTab(item.id);
                                setIsDrawerOpen(false);
                              }}
                              className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start gap-3 group cursor-pointer ${
                                isItemActive
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-md'
                                  : 'hover:bg-slate-900 text-slate-300 hover:text-white border border-transparent'
                              }`}
                            >
                              <div
                                className={`p-2 rounded-lg shrink-0 mt-0.5 transition-colors ${
                                  isItemActive
                                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                                    : 'bg-slate-900 text-slate-400 group-hover:text-emerald-400 group-hover:bg-slate-800'
                                }`}
                              >
                                <ItemIcon className="w-4 h-4" />
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold tracking-tight">
                                    {item.label}
                                  </span>
                                  {item.badge && (
                                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-emerald-400 border border-slate-800 shrink-0 ml-1">
                                      {item.badge}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-400 group-hover:text-slate-300 line-clamp-2 mt-0.5 leading-relaxed font-sans">
                                  {item.desc}
                                </p>
                              </div>

                              {isItemActive ? (
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mt-1.5 shrink-0" />
                              ) : (
                                <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-emerald-400 opacity-0 group-hover:opacity-100 transition-all mt-1 shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Drawer Bottom Actions: User Manual & System Specs */}
            <div className="p-4 bg-slate-900 border-t border-slate-800 shrink-0 space-y-2">
              <button
                type="button"
                onClick={() => {
                  setIsDrawerOpen(false);
                  onOpenUserManual();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-slate-950 font-bold text-xs font-mono transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] border border-emerald-400 cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-slate-950" />
                <span>Open Online User Manual (SOP & Safety)</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-950" />
              </button>

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 px-1 pt-1">
                <span>SIL-3 SIS: ACTIVE</span>
                <span>EDGE CONTROLLER: HEALTHY</span>
                <span>v2.4.1</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TopNavBar;
