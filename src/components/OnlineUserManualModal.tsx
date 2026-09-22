import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  X,
  Search,
  ShieldAlert,
  Droplets,
  Radio,
  Cpu,
  Award,
  Zap,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  FileText,
  Printer,
  Sparkles,
  Terminal,
  Layers,
  AlertTriangle,
  ArrowUpRight,
} from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';

export interface OnlineUserManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSectionId?: string;
}

interface ManualSection {
  id: string;
  category: 'OVERVIEW' | 'SAFETY' | 'AGRONOMY' | 'KIOSK' | 'FINANCE' | 'DIAGNOSTICS';
  title: string;
  badge?: string;
  icon: React.ElementType;
  content: React.ReactNode;
}

export const OnlineUserManualModal: React.FC<OnlineUserManualModalProps> = ({
  isOpen,
  onClose,
  initialSectionId = 'overview',
}) => {
  const { setActiveTab } = useNavigation();
  const [activeSectionId, setActiveSectionId] = useState<string>(initialSectionId);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const sections: ManualSection[] = useMemo(
    () => [
      {
        id: 'overview',
        category: 'OVERVIEW',
        title: '1. Eden II System Architecture & Overview',
        badge: 'v2.4.1 STABLE',
        icon: Cpu,
        content: (
          <div className="space-y-4 text-slate-300 text-sm leading-relaxed font-sans">
            <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <Sparkles className="w-4 h-4" />
                <span>Eden II Decentralized Green Ammonia (Micro-DGA) Container</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                The Eden II is a 20-foot self-contained, solar-hybrid micro-manufacturing container capable of producing on-demand anhydrous and aqueous ammonia (<span className="font-mono text-emerald-300">NH3</span>) directly on agricultural cooperatives and smallholder farms.
              </p>
            </div>

            <h4 className="text-base font-bold text-white mt-4">Core Operating Principles</h4>
            <ul className="list-disc pl-5 space-y-2 text-xs">
              <li>
                <strong className="text-emerald-400">Zero Scope 1 & 2 Emissions:</strong> Utilizes captive green hydrogen from PEM electrolysis and atmospheric nitrogen separated via pressure-swing adsorption (PSA).
              </li>
              <li>
                <strong className="text-emerald-400">Micro Haber-Bosch Synthesis:</strong> Operates at 450–600 Bar hydraulic pressure with ruthenium-based catalyst beds for high-efficiency low-temperature synthesis.
              </li>
              <li>
                <strong className="text-emerald-400">Autonomous Edge Operation:</strong> The container functions completely offline without requiring cloud connectivity. All SIL-3 safety interlocks and agronomic calculations run locally on industrial-grade PLCs.
              </li>
            </ul>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
                <span className="text-xs font-bold text-slate-400 uppercase block mb-1">Production Capacity</span>
                <span className="text-base font-bold text-white font-mono">1,250 kg NH3 / Month</span>
                <p className="text-[11px] text-slate-500 mt-1">Configurable between Bulk Mode A (aqueous) and Knapsack Mode B (diluted foliar).</p>
              </div>
              <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
                <span className="text-xs font-bold text-slate-400 uppercase block mb-1">Power Consumption</span>
                <span className="text-base font-bold text-emerald-400 font-mono">8.2 kWh / kg NH3</span>
                <p className="text-[11px] text-slate-500 mt-1">Direct DC-bus coupled to 45kW on-site agrivoltaic array + 120kWh LFP storage.</p>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: 'safety-sil3',
        category: 'SAFETY',
        title: '2. SIL-3 Safety Instrumented Systems (SIS)',
        badge: 'IEC 61508 / 61511',
        icon: ShieldAlert,
        content: (
          <div className="space-y-4 text-slate-300 text-sm leading-relaxed font-sans">
            <p className="text-xs">
              The Eden II platform implements strict Safety Integrity Level 3 (SIL-3) governance across all high-pressure and toxic chemical subsystems. All safety loops follow de-energize-to-trip architecture.
            </p>

            <div className="space-y-3">
              {/* SIF 1 */}
              <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-amber-400 text-xs">SIF 1: Reactor Overpressure (2oo3 Voting)</span>
                  <span className="text-[10px] font-mono bg-amber-950 text-amber-300 px-2 py-0.5 rounded border border-amber-800">
                    Trip: &gt; 600 Bar
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Monitors three independent ceramic piezoresistive pressure transmitters. If any 2 out of 3 sensors exceed 600 Bar, the fail-safe spring-return dump valve de-energizes within &lt; 50ms.
                </p>
              </div>

              {/* SIF 2 */}
              <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-cyan-400 text-xs">SIF 2: Toxic NH3 Wet Scrubber Lockdown</span>
                  <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800">
                    Trip: &gt;= 35 PPM
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Dual-channel electrochemical sensors monitor internal container air. If a leak is detected:
                  1) External motorized louvers hermetically seal, 2) Primary synthesis feed valves close, and 3) 2,850 CFM extraction fans pull air through the acidic wet scrubber.
                </p>
              </div>

              {/* SIF 3 */}
              <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-emerald-400 text-xs">SIF 3: Mode B Foliar Dilution Lockout</span>
                  <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">
                    1.0% – 2.0% N Max
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  During smallholder knapsack dispensing, the primary anhydrous line is physically locked. A closed-loop mass-balance engine injects distilled water. If water pump flow fails (&lt; 0.2 LPM), dispensing immediately aborts.
                </p>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: 'agronomy-dosing',
        category: 'AGRONOMY',
        title: '3. Autonomous Closed-Loop Agronomy & Soil pH Buffering',
        badge: 'Nitrification Failsafe',
        icon: Droplets,
        content: (
          <div className="space-y-4 text-slate-300 text-sm leading-relaxed font-sans">
            <p className="text-xs">
              Continuous drip fertigation of ammonium (<span className="font-mono text-emerald-300">NH4+</span>) undergoes soil bacterial nitrification, producing nitrate (<span className="font-mono text-blue-300">NO3-</span>) and releasing hydrogen ions (<span className="font-mono text-amber-300">H+</span>) that acidify the rootzone.
            </p>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs space-y-1 text-emerald-400">
              <div className="text-[11px] text-slate-500 uppercase">Chemical Reaction Dynamics:</div>
              <div>NH4+ + 2 O2 ──(Nitrosomonas / Nitrobacter)──&gt; NO3- + H2O + 2 H+</div>
              <div className="text-amber-400 mt-1">CaCO3 (Buffer) + 2 H+ ──&gt; Ca2+ + H2O + CO2</div>
            </div>

            <h4 className="text-base font-bold text-white mt-4">Automated Closed-Loop Workflow</h4>
            <ol className="list-decimal pl-5 space-y-2 text-xs">
              <li>
                <strong>LoRaWAN Telemetry Ingestion:</strong> Multi-depth probes at 15cm (rhizosphere) and 45cm (subsoil) transmit real-time pH and EC data to the edge controller.
              </li>
              <li>
                <strong>Stoichiometric Dosing Calculation:</strong> When soil pH drifts below 6.4 (optimal: 6.8), the driver calculates the exact required mass of micronized liquid Calcium Carbonate (<span className="font-mono">CaCO3</span>).
              </li>
              <li>
                <strong>Autonomous Injection:</strong> The positive-displacement dosing pump injects buffer directly into the outbound irrigation manifold (max 180 mL/min).
              </li>
              <li>
                <strong>Alkaline Lockout:</strong> Dosing automatically disengages if pH reaches 7.5 to prevent nutrient lockup.
              </li>
            </ol>
          </div>
        ),
      },
      {
        id: 'kiosk-operation',
        category: 'KIOSK',
        title: '4. 20-ft Sister Kiosk & Smallholder Dispensing',
        badge: 'Voice AI & NFC',
        icon: Radio,
        content: (
          <div className="space-y-4 text-slate-300 text-sm leading-relaxed font-sans">
            <p className="text-xs">
              The exterior of the Eden II container features an all-weather 21-inch industrial touchscreen, an NFC smart token reader, and a high-noise directional microphone for multi-lingual Voice AI.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <span className="font-bold text-emerald-400 block mb-1">1. NFC Tap</span>
                <p className="text-slate-400 text-[11px]">Farmers tap their allocated NFC card to retrieve crop quotas and verified plot records.</p>
              </div>
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <span className="font-bold text-cyan-400 block mb-1">2. Multilingual Voice AI</span>
                <p className="text-slate-400 text-[11px]">Supports Swahili, Hindi, French, Spanish, and English with live Gemini voice feedback.</p>
              </div>
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <span className="font-bold text-purple-400 block mb-1">3. Safe Dispensing</span>
                <p className="text-slate-400 text-[11px]">Batch-dilutes 10L–20L knapsacks to 1.0%–2.0% foliar grade in under 45 seconds.</p>
              </div>
            </div>

            <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-xl text-xs space-y-1">
              <span className="font-bold text-amber-300 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Safety Precaution for Operators:
              </span>
              <p className="text-slate-400 text-[11px]">
                Ensure the knapsack nozzle is fully seated into the dispenser bay lock ring before engaging the green DISPENSE button. Never attempt to bypass the mechanical anti-splash shroud.
              </p>
            </div>
          </div>
        ),
      },
      {
        id: 'finance-ecocreditx',
        category: 'FINANCE',
        title: '5. EcoCreditX (Hedera dMRV) & Section 179 Grants',
        badge: 'Hedera Hashgraph',
        icon: Award,
        content: (
          <div className="space-y-4 text-slate-300 text-sm leading-relaxed font-sans">
            <p className="text-xs">
              Every kilogram of green ammonia synthesized on the Eden II container generates cryptographically verifiable digital Measurement, Reporting, and Verification (dMRV) records on the Hedera Hashgraph ledger.
            </p>

            <h4 className="text-base font-bold text-white mt-2">Carbon Credit & Incentive Breakdown</h4>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex justify-between items-center">
                <span>Avoided Haber-Bosch Transportation & Coal/Gas Feedstock:</span>
                <span className="font-mono text-emerald-400 font-bold">2.87 kg CO2e / kg NH3</span>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex justify-between items-center">
                <span>Hedera Consensus Service (HCS) Transaction Hash:</span>
                <span className="font-mono text-cyan-400 font-bold">0.0.48921@1727043812</span>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex justify-between items-center">
                <span>USDA Section 179 First-Year Tax Depreciation:</span>
                <span className="font-mono text-purple-400 font-bold">100% Eligible ($1.16M Cap)</span>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: 'diagnostics-troubleshooting',
        category: 'DIAGNOSTICS',
        title: '6. Diagnostics, Fault Codes & Offline Recovery',
        badge: 'Field Guide',
        icon: Terminal,
        content: (
          <div className="space-y-4 text-slate-300 text-sm leading-relaxed font-sans">
            <p className="text-xs">
              Reference guide for edge controller error codes and manual interlock resets:
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono">
                    <th className="pb-2">Code</th>
                    <th className="pb-2">Fault Condition</th>
                    <th className="pb-2">Automated Action</th>
                    <th className="pb-2">Resolution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 font-mono text-[11px]">
                  <tr>
                    <td className="py-2 text-amber-400 font-bold">ERR_P_2oo3_TRIP</td>
                    <td className="text-slate-300">Reactor Pressure &gt; 600 Bar</td>
                    <td className="text-slate-400">Reactor dump valve de-energizes</td>
                    <td className="text-slate-300">Inspect catalyst bed backpressure & relief orifice</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-cyan-400 font-bold">ERR_NH3_LEAK_35PPM</td>
                    <td className="text-slate-300">NH3 gas leak inside container</td>
                    <td className="text-slate-400">Hermetic louvers close, scrubber fans 3,200 RPM</td>
                    <td className="text-slate-300">Allow acid bed to drop NH3 &lt; 5 PPM, then reset interlock</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-red-400 font-bold">ERR_FOLIAR_WATER_PUMP</td>
                    <td className="text-slate-300">HPDD Water pump flow &lt;= 0.2 LPM</td>
                    <td className="text-slate-400">Instant hardware lockout on raw NH3 valve</td>
                    <td className="text-slate-300">Inspect HPDD tank level & pump prime circuit</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-purple-400 font-bold">ERR_SOIL_ALKALINE_LOCK</td>
                    <td className="text-slate-300">Soil pH exceeds 7.5</td>
                    <td className="text-slate-400">CaCO3 dosing pump locked out</td>
                    <td className="text-slate-300">Flush irrigation lines with clean water</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs">
              <strong className="text-white block mb-1">Manual Interlock Reset Procedure:</strong>
              <p className="text-slate-400 text-[11px]">
                To clear an active SIL-3 hardware interlock, navigate to <em>System Settings &gt; Interlocks</em> on the touchscreen HMI and hold the dual-button <strong>RESET INTERLOCKS</strong> for 3 seconds while verifying all environmental parameters are within nominal safety bounds.
              </p>
            </div>
          </div>
        ),
      },
    ],
    []
  );

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections;
    const query = searchQuery.toLowerCase();
    return sections.filter(
      (s) =>
        s.title.toLowerCase().includes(query) ||
        s.category.toLowerCase().includes(query) ||
        s.id.toLowerCase().includes(query)
    );
  }, [sections, searchQuery]);

  const activeSection = useMemo(() => {
    return sections.find((s) => s.id === activeSectionId) || sections[0];
  }, [sections, activeSectionId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn font-sans">
      <div className="relative w-full max-w-5xl h-[88vh] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        {/* Modal Top Header */}
        <div className="h-16 px-6 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">NexusLIMS Eden II Online User Manual</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Official Technical Guide
                </span>
              </div>
              <p className="text-xs text-slate-400">Complete standard operating procedures, SIL-3 safety systems, and agronomy controls</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              title="Print / Save PDF"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors hidden sm:flex items-center gap-1.5 text-xs font-mono"
            >
              <Printer className="w-4 h-4" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-red-950/60 hover:text-red-400 text-slate-400 transition-colors"
              aria-label="Close user manual"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar & Quick Category Filter */}
        <div className="px-6 py-2.5 bg-slate-900/50 border-b border-slate-800/80 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user manual (e.g. SIL-3, pH dosing, Voice AI, 2oo3 voting)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-sans"
            />
          </div>

          <div className="text-xs text-slate-400 hidden sm:flex items-center gap-2">
            <span className="font-mono text-[11px] text-emerald-400 font-bold">Eden II Micro-DGA</span>
            <span>// Offline Edge Ready</span>
          </div>
        </div>

        {/* Main Content Layout: Sidebar Table of Contents + Active Document Reader */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          {/* Table of Contents Column */}
          <div className="md:col-span-4 border-r border-slate-800 p-3 bg-slate-950/60 overflow-y-auto space-y-1.5 custom-scrollbar">
            <div className="text-[10px] uppercase font-bold tracking-widest text-slate-500 px-2 py-1">
              Table of Contents
            </div>
            {filteredSections.map((section) => {
              const Icon = section.icon;
              const isSelected = section.id === activeSectionId;

              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSectionId(section.id)}
                  className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start gap-2.5 ${
                    isSelected
                      ? 'bg-emerald-950/60 text-white border border-emerald-500/40 shadow-sm'
                      : 'hover:bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <div
                    className={`p-1.5 rounded-lg shrink-0 ${
                      isSelected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold truncate">{section.title}</div>
                    {section.badge && (
                      <span className="text-[10px] font-mono text-slate-500 block mt-0.5">{section.badge}</span>
                    )}
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 shrink-0 mt-1 ${isSelected ? 'text-emerald-400' : 'text-slate-600'}`} />
                </button>
              );
            })}
          </div>

          {/* Active Documentation View */}
          <div className="md:col-span-8 p-6 overflow-y-auto custom-scrollbar flex flex-col gap-5 bg-slate-950">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold tracking-wider text-emerald-400 uppercase bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                  {activeSection.category}
                </span>
                <h3 className="text-xl font-bold text-white tracking-tight">{activeSection.title}</h3>
              </div>
              {activeSection.badge && (
                <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                  {activeSection.badge}
                </span>
              )}
            </div>

            {/* Section Body */}
            <div className="flex-1">{activeSection.content}</div>

            {/* Quick Link into App Module */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500">Need to execute this in the dashboard?</span>
              <button
                onClick={() => {
                  onClose();
                  if (activeSection.id === 'safety-sil3') setActiveTab('DASHBOARD');
                  else if (activeSection.id === 'agronomy-dosing') setActiveTab('FARM_COMMAND');
                  else if (activeSection.id === 'kiosk-operation') setActiveTab('KIOSK');
                  else if (activeSection.id === 'finance-ecocreditx') setActiveTab('ECOCREDITX');
                  else setActiveTab('DASHBOARD');
                }}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-xs font-bold font-mono flex items-center gap-1.5 transition-all"
              >
                <span>Jump to Interactive Module</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnlineUserManualModal;
