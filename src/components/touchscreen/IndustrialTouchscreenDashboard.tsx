import React, { useState, useEffect, useCallback } from 'react';
import { 
  Hexagon, 
  BatteryCharging, 
  Radio, 
  Play, 
  Flame, 
  Droplets, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  X,
  Gauge,
  Sliders,
  Layers,
  Sparkles,
  Zap,
  Volume2,
  VolumeX,
  RefreshCw,
  Server,
  Save,
  Download,
  Plus,
  Minus,
  Check,
  ShieldCheck,
  Cpu,
  FileText
} from 'lucide-react';
import { SemiCircularGauge } from './SemiCircularGauge';
import { HorizontalProgressBar } from './HorizontalProgressBar';
import { VerticalLiquidTank } from './VerticalLiquidTank';
import { AtmosphericWidget } from './AtmosphericWidget';
import { WeatherRadioPlayer } from './WeatherRadioPlayer';
import { CognitiveDashboard } from './CognitiveDashboard';
import { useLanguage } from '../../context/LanguageContext';

export interface NodeConfiguration {
  catalystTempTarget: number;
  biogasPressureTarget: number;
  intensifierPressureTarget: number;
  aqueousOutputTarget: number;
  basePct: number;
  nitrogenPct: number;
  phosPct: number;
  potashPct: number;
  overpressureTripLimit: number;
  telemetrySyncInterval: '5s' | '15s' | '30s' | '60s';
  autoPurgeOnIdle: boolean;
  autonomousDripDispatch: boolean;
  soundFeedback: boolean;
  technicianId: string;
  lastSavedAt?: string;
}

export const DEFAULT_NODE_CONFIG: NodeConfiguration = {
  catalystTempTarget: 398,
  biogasPressureTarget: 1.4,
  intensifierPressureTarget: 600,
  aqueousOutputTarget: 18.2,
  basePct: 88,
  nitrogenPct: 12,
  phosPct: 0,
  potashPct: 0,
  overpressureTripLimit: 620,
  telemetrySyncInterval: '15s',
  autoPurgeOnIdle: true,
  autonomousDripDispatch: true,
  soundFeedback: true,
  technicianId: 'Dr. Sarah Vance (TECH-042)',
  lastSavedAt: 'Initial Factory Calibration'
};

const STORAGE_KEY = 'eden_ii_node_042_config';

export interface IndustrialTouchscreenDashboardProps {
  nodeId?: string;
  onActionTrigger?: (action: string) => void;
  onConfigurationUpdate?: (config: NodeConfiguration) => void;
  initialConfig?: Partial<NodeConfiguration>;
}

export const IndustrialTouchscreenDashboard: React.FC<IndustrialTouchscreenDashboardProps> = ({
  nodeId = 'EDEN II NODE #042',
  onActionTrigger,
  onConfigurationUpdate,
  initialConfig,
}) => {
  const { t, locale } = useLanguage();

  // 1. Persistent Configuration State
  const [committedConfig, setCommittedConfig] = useState<NodeConfiguration>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_NODE_CONFIG, ...parsed, ...initialConfig };
      }
    } catch (e) {
      console.warn('Could not read saved node config from localStorage', e);
    }
    return { ...DEFAULT_NODE_CONFIG, ...initialConfig };
  });

  // 2. Draft Configuration State for Form editing
  const [draftConfig, setDraftConfig] = useState<NodeConfiguration>(committedConfig);

  // 3. UI View Mode: 'MONITOR' (Live Telemetry), 'COGNITIVE_CORE' (Adaptive Multi-Agent Orb), 'ATMOSPHERIC' (Weather & ET0), 'WEATHER_RADIO' (Live Voice Radio), or 'CONFIGURE' (Setpoints & Recipe Form)
  const [viewMode, setViewMode] = useState<'MONITOR' | 'COGNITIVE_CORE' | 'ATMOSPHERIC' | 'WEATHER_RADIO' | 'CONFIGURE'>('MONITOR');

  // 4. Live Telemetry States (reflecting active setpoints with subtle ADC noise)
  const [catalystTemp, setCatalystTemp] = useState(committedConfig.catalystTempTarget);
  const [biogasPressure, setBiogasPressure] = useState(committedConfig.biogasPressureTarget);
  const [intensifierPressure, setIntensifierPressure] = useState(committedConfig.intensifierPressureTarget);
  const [aqueousOutput, setAqueousOutput] = useState(committedConfig.aqueousOutputTarget);

  // Blending Vat Tank Percentages
  const [basePct, setBasePct] = useState(committedConfig.basePct);
  const [nitrogenPct, setNitrogenPct] = useState(committedConfig.nitrogenPct);
  const [phosPct, setPhosPct] = useState(committedConfig.phosPct);
  const [potashPct, setPotashPct] = useState(committedConfig.potashPct);

  // Active Action State Modal
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [actionProgress, setActionProgress] = useState(0);
  const [actionLogs, setActionLogs] = useState<string[]>([]);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [soundFeedback, setSoundFeedback] = useState(committedConfig.soundFeedback);

  // Toast feedback notification
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'warning' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Subtle live fluctuation to simulate real industrial ADC stream around committed targets
  useEffect(() => {
    const interval = setInterval(() => {
      // Tiny ±0.2°C jitter around target
      setCatalystTemp(parseFloat((committedConfig.catalystTempTarget + (Math.random() - 0.5) * 0.6).toFixed(1)));
      // Tiny fluctuation around target Bar
      setBiogasPressure(parseFloat((committedConfig.biogasPressureTarget + (Math.random() - 0.5) * 0.04).toFixed(2)));
      // Steady intensifier jitter
      setIntensifierPressure(parseFloat((committedConfig.intensifierPressureTarget + (Math.random() - 0.5) * 1.5).toFixed(1)));
    }, 2000);

    return () => clearInterval(interval);
  }, [committedConfig.catalystTempTarget, committedConfig.biogasPressureTarget, committedConfig.intensifierPressureTarget]);

  // -------------------------------------------------------------
  // PERSISTENT CONFIGURATION UPDATE FUNCTION
  // -------------------------------------------------------------
  const savePersistentConfiguration = useCallback((newConfig: NodeConfiguration) => {
    const validatedConfig: NodeConfiguration = {
      ...newConfig,
      lastSavedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };

    // 1. Update internal committed config state
    setCommittedConfig(validatedConfig);
    setDraftConfig(validatedConfig);

    // 2. Synchronize all live component telemetry states to match new setpoints
    setCatalystTemp(validatedConfig.catalystTempTarget);
    setBiogasPressure(validatedConfig.biogasPressureTarget);
    setIntensifierPressure(validatedConfig.intensifierPressureTarget);
    setAqueousOutput(validatedConfig.aqueousOutputTarget);
    setBasePct(validatedConfig.basePct);
    setNitrogenPct(validatedConfig.nitrogenPct);
    setPhosPct(validatedConfig.phosPct);
    setPotashPct(validatedConfig.potashPct);
    setSoundFeedback(validatedConfig.soundFeedback);

    // 3. Write to persistent browser/device storage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(validatedConfig));
    } catch (e) {
      console.warn('Failed to write configuration to persistent localStorage', e);
    }

    // 4. Trigger external callback prop if supplied
    if (onConfigurationUpdate) {
      onConfigurationUpdate(validatedConfig);
    }

    // 5. Append entry to audit/telemetry logs
    setActionLogs(prev => [
      `[${new Date().toLocaleTimeString()}] SIL-3 CONFIG COMMIT: Written to PLC register (Temp: ${validatedConfig.catalystTempTarget}°C, BioP: ${validatedConfig.biogasPressureTarget} Bar, Intensifier: ${validatedConfig.intensifierPressureTarget} Bar, N: ${validatedConfig.nitrogenPct}%).`,
      ...prev.slice(0, 20)
    ]);

    // 6. User feedback
    showToast(
      `CONFIGURATION COMMITTED: Node #042 setpoints written to EEPROM. Catalyst ${validatedConfig.catalystTempTarget}°C | Intensifier ${validatedConfig.intensifierPressureTarget} Bar.`,
      'success'
    );
  }, [onConfigurationUpdate]);

  // Form Submit Handler
  const handleSaveForm = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Validation: Total blending ratio check
    const totalRatio = draftConfig.basePct + draftConfig.nitrogenPct + draftConfig.phosPct + draftConfig.potashPct;
    if (Math.abs(totalRatio - 100) > 0.5) {
      showToast(`Warning: Blending vat formulation total is ${totalRatio}%. Adjusting base to balance 100%.`, 'warning');
      const balancedDraft = {
        ...draftConfig,
        basePct: Math.max(0, 100 - (draftConfig.nitrogenPct + draftConfig.phosPct + draftConfig.potashPct))
      };
      savePersistentConfiguration(balancedDraft);
      return;
    }

    savePersistentConfiguration(draftConfig);
  };

  // Reset to Factory Defaults Handler
  const handleResetDefaults = () => {
    savePersistentConfiguration(DEFAULT_NODE_CONFIG);
    showToast('Node #042 restored to default SIL-3 agronomic calibration baselines.', 'info');
  };

  // Export JSON Configuration
  const handleExportConfigJson = () => {
    const payload = {
      product: 'NexusLIMS Industrial HMI',
      nodeId,
      hardwareProfile: 'Eden II Micro-DGA Container',
      configuration: committedConfig,
      exportedAt: new Date().toISOString()
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `node-042-config-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showToast('Exported node calibration JSON package.', 'success');
  };

  // Helper for formulation auto-balance
  const handleAutoBalanceFormulation = () => {
    const nonBase = draftConfig.nitrogenPct + draftConfig.phosPct + draftConfig.potashPct;
    const newBase = Math.max(0, 100 - nonBase);
    setDraftConfig(prev => ({ ...prev, basePct: newBase }));
    showToast(`Base DI Water auto-balanced to ${newBase}% (Total: 100%).`, 'info');
  };

  // Handle Action Button Clicks
  const handleActionClick = (actionName: string) => {
    if (onActionTrigger) {
      onActionTrigger(actionName);
    }
    setActiveModal(actionName);
    setIsProcessingAction(true);
    setActionProgress(10);
    setActionLogs([`[0.00s] USER COMMAND: ${actionName} registered on Touchscreen HMI`]);

    let p = 10;
    const progressTimer = setInterval(() => {
      p += 25;
      if (p >= 100) {
        setActionProgress(100);
        setIsProcessingAction(false);
        clearInterval(progressTimer);

        if (actionName === 'START BATCH CYCLE') {
          setActionLogs(prev => [
            ...prev,
            `[0.85s] Catalytic Bed pre-heat verified at ${catalystTemp}°C (Optimal).`,
            `[1.60s] Biogas dosing valve energized @ ${biogasPressure} Bar.`,
            `[2.40s] ${intensifierPressure} Bar Hydraulic Intensifier primed.`,
            `[3.00s] Batch Cycle RUNNING: Micro-DGA synthesis nominal (${aqueousOutput}L batch target).`,
          ]);
        } else if (actionName === 'PURGE GAS LINE') {
          setActionLogs(prev => [
            ...prev,
            `[0.90s] High-speed N2 inert purge valve energized.`,
            `[1.75s] Gas manifold evacuated to safe flare scrubber.`,
            `[2.50s] Residual hydrocarbon & H2 level: < 0.01% LEL.`,
            `[3.00s] Purge cycle COMPLETE. Manifold locked in safe inert state.`,
          ]);
        } else if (actionName === 'DISPATCH TO DRIP LINES') {
          setActionLogs(prev => [
            ...prev,
            `[0.80s] Solenoid Manifold unlocked for Zone A & Zone B.`,
            `[1.50s] Aqueous NH4OH output (${aqueousOutput}L) pressurized to 2.8 Bar.`,
            `[2.20s] Flow rate calibrated to ${(nitrogenPct / 12).toFixed(2)}% Aqueous N foliar concentration.`,
            `[3.00s] Dispatch active: 4,800m precision drip network irrigated.`,
          ]);
        } else if (actionName === 'SYSTEM DIAGNOSTICS') {
          setActionLogs(prev => [
            ...prev,
            `[0.50s] 2oo3 Triple Modular Redundancy Pressure Voting: PASSED (0.00% divergence).`,
            `[1.10s] Optical H2 NDIR Spectroscopy: PASSED (<1.2% LEL).`,
            `[1.80s] Acid Scrubber Blower VFD: PASSED (850 RPM Nominal, 3450 RPM Ready).`,
            `[2.40s] 100 kWh LFP Storage: 98% SoC (54.2V nominal).`,
            `[3.00s] SIL-3 Health Score: 99.98% • ALL SUBSYSTEMS NOMINAL.`,
          ]);
        }
      } else {
        setActionProgress(p);
        if (p === 35) {
          setActionLogs(prev => [...prev, `[0.60s] Interlocking SIL-3 safety check verified...`]);
        } else if (p === 60) {
          setActionLogs(prev => [...prev, `[1.20s] Executing PLC hardware relay sequence...`]);
        } else if (p === 85) {
          setActionLogs(prev => [...prev, `[2.10s] Synchronizing telemetry packet to Hedera Consensus...`]);
        }
      }
    }, 450);
  };

  const currentTotalRatio = draftConfig.basePct + draftConfig.nitrogenPct + draftConfig.phosPct + draftConfig.potashPct;
  const isRatioBalanced = Math.abs(currentTotalRatio - 100) < 0.1;

  return (
    <div className="w-full bg-gray-900 text-slate-100 p-4 sm:p-6 rounded-2xl border-2 border-gray-800 shadow-2xl flex flex-col gap-6 selection:bg-orange-500/30">
      {/* 1. Header Bar (Top): Flexbox layout for tablet & industrial touchscreen precision */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b-2 border-gray-800/80">
        {/* Left: Orange Hexagon Icon + Node Title */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <Hexagon className="w-8 h-8 sm:w-9 sm:h-9 text-orange-400 fill-orange-500/20 drop-shadow-[0_0_10px_rgba(249,115,22,0.6)] animate-pulse" />
            <span className="absolute text-[10px] font-mono font-black text-orange-300">042</span>
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-mono font-extrabold tracking-wider text-orange-400 uppercase drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]">
              {nodeId} - OFFLINE MESH ACTIVE
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-[10px] sm:text-xs font-mono text-slate-400">
              <span>CONTAINER HMI TOUCHSCREEN</span>
              <span className="text-slate-600">•</span>
              <span className="text-cyan-400">IP: 192.168.10.42</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-500">Sync: {committedConfig.lastSavedAt}</span>
            </div>
          </div>
        </div>

        {/* Center / Right: Mode Switcher & Status Indicators */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {/* View Mode Toggle: Live Telemetry vs Atmospheric Weather vs Configuration Form */}
          <div className="flex items-center p-1 rounded-xl bg-gray-950 border border-gray-800">
            <button
              id="btn-tab-monitor"
              onClick={() => setViewMode('MONITOR')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'MONITOR'
                  ? 'bg-orange-500 text-black shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              TELEMETRY
            </button>
            <button
              id="btn-tab-cognitive-core"
              onClick={() => setViewMode('COGNITIVE_CORE')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'COGNITIVE_CORE'
                  ? 'bg-emerald-500 text-black shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              COGNITIVE CORE
            </button>
            <button
              id="btn-tab-atmospheric"
              onClick={() => setViewMode('ATMOSPHERIC')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'ATMOSPHERIC'
                  ? 'bg-emerald-500 text-black shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Droplets className="w-3.5 h-3.5" />
              ATMOSPHERIC & ET0
            </button>
            <button
              id="btn-tab-weather-radio"
              onClick={() => setViewMode('WEATHER_RADIO')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'WEATHER_RADIO'
                  ? 'bg-purple-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              VOICE RADIO
            </button>
            <button
              id="btn-tab-configure"
              onClick={() => {
                setDraftConfig(committedConfig);
                setViewMode('CONFIGURE');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'CONFIGURE'
                  ? 'bg-cyan-500 text-black shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              CONFIGURE RECIPE
            </button>
          </div>

          {/* Battery Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-950/80 border border-gray-800">
            <BatteryCharging className="w-4 h-4 text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
            <div className="text-right font-mono hidden sm:block">
              <div className="text-xs font-bold text-slate-100">
                100 kWh <span className="text-green-400 font-extrabold">(98%)</span>
              </div>
            </div>
          </div>

          {/* Satellink Signal Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-950/80 border border-gray-800">
            <Radio className="w-4 h-4 text-green-400 animate-pulse drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
            <div className="text-right font-mono hidden sm:block">
              <div className="text-xs font-bold text-green-400">
                Satellink
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 2A. MODE A: LIVE TELEMETRY DISPLAY */}
      {viewMode === 'MONITOR' && (
        <main className="w-full bg-gray-900/90 rounded-xl border-2 border-gray-800 p-4 sm:p-5 shadow-inner space-y-4">
          <div className="flex items-center justify-between pb-1 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-ping" />
              REAL-TIME ADC CHANNELS • CALIBRATION LOCKED
            </span>
            <button
              onClick={() => {
                setDraftConfig(committedConfig);
                setViewMode('CONFIGURE');
              }}
              className="text-cyan-400 hover:text-cyan-300 underline font-bold flex items-center gap-1 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" /> Adjust Setpoints
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            
            {/* Col 1: Catalyst Bed Semi-Circular Gauge */}
            <div className="flex flex-col justify-between p-4 rounded-xl bg-gray-950/80 border border-gray-800/80 shadow-md">
              <div className="flex items-center justify-between pb-2 border-b border-gray-800/60 mb-2">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-orange-400" />
                  Reaction Chamber
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-green-950/80 text-green-400 border border-green-800/60 font-bold">
                  TARGET: {committedConfig.catalystTempTarget}°C
                </span>
              </div>

              {/* Reusable Semi-Circular Gauge Component */}
              <SemiCircularGauge
                value={catalystTemp}
                min={0}
                max={500}
                label="Catalyst Bed"
                unit="°C"
                statusLabel="OPTIMAL"
                statusColor="text-green-400"
                id="catalyst-bed-gauge"
              />

              <div className="mt-3 p-2 rounded bg-gray-900/90 border border-gray-800 text-[10px] font-mono text-slate-400 flex items-center justify-between">
                <span>Fe-Promoted Haber-Bosch:</span>
                <span className="text-cyan-400 font-bold">Bed Life: 99.4%</span>
              </div>
            </div>

            {/* Col 2: Pressure Vessels (3 Horizontal Progress Bars with Cyan Glow) */}
            <div className="flex flex-col justify-between p-4 rounded-xl bg-gray-950/80 border border-gray-800/80 shadow-md">
              <div className="flex items-center justify-between pb-2 border-b border-gray-800/60 mb-2">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Gauge className="w-4 h-4 text-cyan-400" />
                  Pressure Vessels & Accumulators
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 font-bold">
                  TRIPLE REDUNDANCY
                </span>
              </div>

              {/* 3 Horizontal Progress Bars */}
              <div className="flex flex-col gap-3 my-auto">
                {/* Bar 1: Biogas Digester */}
                <HorizontalProgressBar
                  label={`Biogas Digester: ${biogasPressure.toFixed(2)} Bar`}
                  value={`${biogasPressure.toFixed(2)} Bar`}
                  percentage={Math.min(100, Math.round((biogasPressure / 2.0) * 100))}
                  barColor="bg-cyan-400"
                  glowClass="shadow-[0_0_14px_rgba(6,182,212,0.7)]"
                  id="bar-biogas-digester"
                />

                {/* Bar 2: HPDD Hydraulic Intensifier */}
                <HorizontalProgressBar
                  label={`HPDD Hydraulic Intensifier: ${intensifierPressure.toFixed(0)} Bar`}
                  value={`${intensifierPressure.toFixed(0)} Bar`}
                  percentage={Math.min(100, Math.round((intensifierPressure / 650) * 100))}
                  barColor="bg-cyan-400"
                  glowClass="shadow-[0_0_16px_rgba(6,182,212,0.8)]"
                  id="bar-hydraulic-intensifier"
                />

                {/* Bar 3: Aqueous NH4OH Output */}
                <HorizontalProgressBar
                  label={`Aqueous NH4OH Output: ${aqueousOutput.toFixed(1)}L`}
                  value={`${aqueousOutput.toFixed(1)}L`}
                  percentage={Math.min(100, Math.round((aqueousOutput / 50) * 100))}
                  barColor="bg-cyan-400"
                  glowClass="shadow-[0_0_12px_rgba(6,182,212,0.6)]"
                  id="bar-aqueous-output"
                />
              </div>

              <div className="mt-3 p-2 rounded bg-gray-900/90 border border-gray-800 text-[10px] font-mono text-slate-400 flex items-center justify-between">
                <span>SIL-3 Overpressure Trip:</span>
                <span className="text-green-400 font-bold">ARMED ({committedConfig.overpressureTripLimit} Bar)</span>
              </div>
            </div>

            {/* Col 3: Omni-Nutrient Blending Vat (4 Vertical Liquid Tanks) */}
            <div className="flex flex-col justify-between p-4 rounded-xl bg-gray-950/80 border border-gray-800/80 shadow-md">
              <div className="flex items-center justify-between pb-2 border-b border-gray-800/60 mb-2">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Droplets className="w-4 h-4 text-cyan-400" />
                  Omni-Nutrient Blending Vat
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-orange-950/80 text-orange-400 border border-orange-800/60 font-bold">
                  {(nitrogenPct / 12).toFixed(2)}% N FOLIAR
                </span>
              </div>

              {/* 4 Vertical Liquid Progress Tanks */}
              <div className="flex items-end justify-center gap-3 sm:gap-4 my-auto py-2">
                {/* Tank 1: Base */}
                <VerticalLiquidTank
                  label="Base"
                  value={basePct}
                  fillPercentage={basePct}
                  subLabel="DI Water"
                  tankColor="bg-cyan-400"
                  id="tank-base"
                />

                {/* Tank 2: Nitrogen */}
                <VerticalLiquidTank
                  label="Nitrogen"
                  value={nitrogenPct}
                  fillPercentage={nitrogenPct}
                  subLabel="NH4OH"
                  tankColor="bg-cyan-400"
                  id="tank-nitrogen"
                />

                {/* Tank 3: Phos */}
                <VerticalLiquidTank
                  label="Phos"
                  value={phosPct}
                  fillPercentage={phosPct}
                  subLabel="P2O5"
                  tankColor="bg-cyan-400"
                  id="tank-phos"
                />

                {/* Tank 4: Potash */}
                <VerticalLiquidTank
                  label="Potash"
                  value={potashPct}
                  fillPercentage={potashPct}
                  subLabel="K2O"
                  tankColor="bg-cyan-400"
                  id="tank-potash"
                />
              </div>

              <div className="mt-3 p-2 rounded bg-gray-900/90 border border-gray-800 text-[10px] font-mono text-slate-400 flex items-center justify-between">
                <span>Dispense Manifold Interlock:</span>
                <span className="text-green-400 font-bold">UNLOCKED / CALIBRATED</span>
              </div>
            </div>

          </div>
        </main>
      )}

      {/* 2B. MODE B: ADAPTIVE COGNITIVE CORE MULTI-AGENT INTERFACE */}
      {viewMode === 'COGNITIVE_CORE' && (
        <main className="w-full">
          <CognitiveDashboard
            nodeId={nodeId}
            onActionTrigger={(action) => {
              showToast(`COGNITIVE ACTION: ${action}`, 'info');
              if (onActionTrigger) onActionTrigger(action);
            }}
          />
        </main>
      )}

      {/* 2C. MODE C: ATMOSPHERIC TELEMETRY & OPEN-METEO WEATHER ENGINE */}
      {viewMode === 'ATMOSPHERIC' && (
        <main className="w-full space-y-4">
          <AtmosphericWidget
            nodeId={nodeId}
            onAnnounceAlert={(text) => {
              showToast(`SPEECH SYNTHESIS: ${text}`, 'info');
              if (onActionTrigger) onActionTrigger(`ANNOUNCE_WEATHER: ${text}`);
            }}
          />
        </main>
      )}

      {/* 2C. MODE C: WEATHER VOICE TRANSLATION & RESILIENT BROADCAST ENGINE */}
      {viewMode === 'WEATHER_RADIO' && (
        <main className="w-full space-y-4">
          <WeatherRadioPlayer
            onAnnounceAlert={(text) => {
              showToast(`RADIO ADVISORY: ${text}`, 'info');
              if (onActionTrigger) onActionTrigger(`BROADCAST_ADVISORY: ${text}`);
            }}
          />
        </main>
      )}

      {/* 2D. MODE D: REFACTORED INDUSTRIAL CONFIGURATION & CALIBRATION FORM */}
      {viewMode === 'CONFIGURE' && (
        <form
          id="form-node-configuration"
          onSubmit={handleSaveForm}
          className="w-full bg-gray-900/95 rounded-xl border-2 border-cyan-500/60 p-4 sm:p-6 shadow-2xl space-y-6 font-mono"
        >
          {/* Form Header with Action Buttons */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-800">
            <div>
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-cyan-400" />
                <h2 className="text-base sm:text-lg font-extrabold text-cyan-400 uppercase tracking-wider">
                  NODE #042 HARDWARE CALIBRATION & RECIPE SETPOINTS
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Configure reaction kinetics, hydraulic pressure targets, NPK formulation, and SIL-3 safety interlocks.
              </p>
            </div>

            {/* Persistent Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                id="btn-reset-node-config"
                onClick={handleResetDefaults}
                className="px-3 py-2 rounded-lg bg-gray-950 hover:bg-gray-800 text-slate-300 hover:text-white font-mono text-xs font-bold flex items-center gap-1.5 border border-gray-700 transition-colors cursor-pointer"
                title="Restore default factory calibration"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" /> RESET DEFAULTS
              </button>

              <button
                type="button"
                id="btn-export-node-config"
                onClick={handleExportConfigJson}
                className="px-3 py-2 rounded-lg bg-gray-950 hover:bg-gray-800 text-slate-300 hover:text-white font-mono text-xs font-bold flex items-center gap-1.5 border border-gray-700 transition-colors cursor-pointer"
                title="Export calibration profile JSON"
              >
                <FileText className="w-3.5 h-3.5 text-cyan-400" /> EXPORT JSON
              </button>

              <button
                type="submit"
                id="btn-save-node-config"
                className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-black font-mono font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_15px_rgba(249,115,22,0.4)] transition-all cursor-pointer active:scale-95"
              >
                <Save className="w-4 h-4" /> SAVE CONFIGURATION
              </button>
            </div>
          </div>

          {/* Form Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Block 1: Reaction Kinetics & Catalyst Bed */}
            <div className="p-4 rounded-xl bg-gray-950 border border-gray-800 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                <span className="text-xs font-bold text-orange-400 uppercase flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-orange-400" />
                  1. Reaction Chamber
                </span>
                <span className="text-[10px] text-slate-500">THERMAL KINETICS</span>
              </div>

              {/* Catalyst Bed Target Temp */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <label htmlFor="input-catalyst-temp" className="text-slate-300 font-bold">
                    Catalyst Bed Temp Setpoint:
                  </label>
                  <span className="text-orange-400 font-extrabold">{draftConfig.catalystTempTarget}°C</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDraftConfig(p => ({ ...p, catalystTempTarget: Math.max(300, p.catalystTempTarget - 5) }))}
                    className="p-2 rounded bg-gray-900 hover:bg-gray-800 text-slate-200 border border-gray-700 active:scale-95 cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    id="input-catalyst-temp"
                    type="range"
                    min="320"
                    max="460"
                    step="1"
                    value={draftConfig.catalystTempTarget}
                    onChange={(e) => setDraftConfig(p => ({ ...p, catalystTempTarget: parseFloat(e.target.value) }))}
                    className="flex-1 accent-orange-500 bg-gray-800 rounded-lg cursor-pointer h-2"
                  />
                  <button
                    type="button"
                    onClick={() => setDraftConfig(p => ({ ...p, catalystTempTarget: Math.min(460, p.catalystTempTarget + 5) }))}
                    className="p-2 rounded bg-gray-900 hover:bg-gray-800 text-slate-200 border border-gray-700 active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex justify-between text-[9px] text-slate-500 mt-1">
                  <span>320°C (Pre-heat)</span>
                  <span>398°C (Nominal)</span>
                  <span>460°C (Max Bed Limit)</span>
                </div>
              </div>

              {/* Auto Purge Option */}
              <div className="pt-2 border-t border-gray-800/80">
                <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                  <span>Auto-Purge Nitrogen on Idle:</span>
                  <input
                    id="chk-auto-purge"
                    type="checkbox"
                    checked={draftConfig.autoPurgeOnIdle}
                    onChange={(e) => setDraftConfig(p => ({ ...p, autoPurgeOnIdle: e.target.checked }))}
                    className="w-4 h-4 accent-orange-500 rounded bg-gray-900 border-gray-700 cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* Block 2: Hydraulic & Pressure Vessels Calibration */}
            <div className="p-4 rounded-xl bg-gray-950 border border-gray-800 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                <span className="text-xs font-bold text-cyan-400 uppercase flex items-center gap-1.5">
                  <Gauge className="w-4 h-4 text-cyan-400" />
                  2. Hydraulic & Pressure Targets
                </span>
                <span className="text-[10px] text-slate-500">ACCUMULATOR</span>
              </div>

              {/* Biogas Pressure Target */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <label htmlFor="input-biogas-pressure" className="text-slate-300">
                    Biogas Dosing Pressure:
                  </label>
                  <span className="text-cyan-400 font-extrabold">{draftConfig.biogasPressureTarget.toFixed(2)} Bar</span>
                </div>
                <input
                  id="input-biogas-pressure"
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.05"
                  value={draftConfig.biogasPressureTarget}
                  onChange={(e) => setDraftConfig(p => ({ ...p, biogasPressureTarget: parseFloat(e.target.value) }))}
                  className="w-full accent-cyan-500 bg-gray-800 rounded-lg cursor-pointer h-2"
                />
              </div>

              {/* Intensifier Pressure Target */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <label htmlFor="input-intensifier-pressure" className="text-slate-300">
                    HPDD Intensifier Target:
                  </label>
                  <span className="text-cyan-400 font-extrabold">{draftConfig.intensifierPressureTarget} Bar</span>
                </div>
                <input
                  id="input-intensifier-pressure"
                  type="range"
                  min="300"
                  max="650"
                  step="10"
                  value={draftConfig.intensifierPressureTarget}
                  onChange={(e) => setDraftConfig(p => ({ ...p, intensifierPressureTarget: parseInt(e.target.value) }))}
                  className="w-full accent-cyan-500 bg-gray-800 rounded-lg cursor-pointer h-2"
                />
              </div>

              {/* Overpressure Safety Trip Limit */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <label htmlFor="input-overpressure-limit" className="text-slate-300">
                    SIL-3 Overpressure Trip Limit:
                  </label>
                  <span className="text-amber-400 font-extrabold">{draftConfig.overpressureTripLimit} Bar</span>
                </div>
                <input
                  id="input-overpressure-limit"
                  type="range"
                  min="605"
                  max="650"
                  step="1"
                  value={draftConfig.overpressureTripLimit}
                  onChange={(e) => setDraftConfig(p => ({ ...p, overpressureTripLimit: parseInt(e.target.value) }))}
                  className="w-full accent-amber-500 bg-gray-800 rounded-lg cursor-pointer h-2"
                />
              </div>

              {/* Aqueous Batch Size */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <label htmlFor="input-aqueous-output" className="text-slate-300">
                    Aqueous Batch Target Output:
                  </label>
                  <span className="text-cyan-400 font-extrabold">{draftConfig.aqueousOutputTarget} Liters</span>
                </div>
                <input
                  id="input-aqueous-output"
                  type="range"
                  min="5"
                  max="50"
                  step="0.5"
                  value={draftConfig.aqueousOutputTarget}
                  onChange={(e) => setDraftConfig(p => ({ ...p, aqueousOutputTarget: parseFloat(e.target.value) }))}
                  className="w-full accent-cyan-500 bg-gray-800 rounded-lg cursor-pointer h-2"
                />
              </div>
            </div>

            {/* Block 3: Blending Formulation & Telemetry */}
            <div className="p-4 rounded-xl bg-gray-950 border border-gray-800 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                <span className="text-xs font-bold text-cyan-400 uppercase flex items-center gap-1.5">
                  <Droplets className="w-4 h-4 text-cyan-400" />
                  3. Formulation & Network
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  isRatioBalanced ? 'bg-green-950 text-green-400 border border-green-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
                }`}>
                  Total: {currentTotalRatio}%
                </span>
              </div>

              {/* Tank Sliders */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Base (DI Water):</span>
                  <span className="text-cyan-300 font-bold">{draftConfig.basePct}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={draftConfig.basePct}
                  onChange={(e) => setDraftConfig(p => ({ ...p, basePct: parseInt(e.target.value) }))}
                  className="w-full accent-cyan-400 bg-gray-800 rounded-lg cursor-pointer h-1.5"
                />

                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Nitrogen (NH4OH):</span>
                  <span className="text-cyan-300 font-bold">{draftConfig.nitrogenPct}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={draftConfig.nitrogenPct}
                  onChange={(e) => setDraftConfig(p => ({ ...p, nitrogenPct: parseInt(e.target.value) }))}
                  className="w-full accent-cyan-400 bg-gray-800 rounded-lg cursor-pointer h-1.5"
                />

                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Phosphorus (P2O5):</span>
                  <span className="text-cyan-300 font-bold">{draftConfig.phosPct}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={draftConfig.phosPct}
                  onChange={(e) => setDraftConfig(p => ({ ...p, phosPct: parseInt(e.target.value) }))}
                  className="w-full accent-cyan-400 bg-gray-800 rounded-lg cursor-pointer h-1.5"
                />

                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Potash (K2O):</span>
                  <span className="text-cyan-300 font-bold">{draftConfig.potashPct}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={draftConfig.potashPct}
                  onChange={(e) => setDraftConfig(p => ({ ...p, potashPct: parseInt(e.target.value) }))}
                  className="w-full accent-cyan-400 bg-gray-800 rounded-lg cursor-pointer h-1.5"
                />

                {!isRatioBalanced && (
                  <button
                    type="button"
                    onClick={handleAutoBalanceFormulation}
                    className="w-full py-1 rounded bg-amber-950/70 hover:bg-amber-900 border border-amber-700/60 text-amber-300 text-[10px] font-bold transition-colors cursor-pointer mt-1"
                  >
                    Auto-Balance Base to 100%
                  </button>
                )}
              </div>

              {/* Telemetry Interval & Audio */}
              <div className="pt-2 border-t border-gray-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="select-telemetry-rate" className="text-slate-300">
                    Satellink Sync Rate:
                  </label>
                  <select
                    id="select-telemetry-rate"
                    value={draftConfig.telemetrySyncInterval}
                    onChange={(e) => setDraftConfig(p => ({ ...p, telemetrySyncInterval: e.target.value as any }))}
                    className="bg-gray-900 text-cyan-400 font-bold text-xs p-1.5 rounded border border-gray-700 focus:outline-none"
                  >
                    <option value="5s">5s (High Bandwidth)</option>
                    <option value="15s">15s (Standard SIL-3)</option>
                    <option value="30s">30s (Eco Mode)</option>
                    <option value="60s">60s (Low Power)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>Audio & Touchscreen Haptics:</span>
                  <button
                    type="button"
                    onClick={() => setDraftConfig(p => ({ ...p, soundFeedback: !p.soundFeedback }))}
                    className={`p-1 rounded transition-colors ${draftConfig.soundFeedback ? 'text-green-400 bg-green-950/60' : 'text-slate-500 bg-gray-900'}`}
                  >
                    {draftConfig.soundFeedback ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Form Bottom Save / Return Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-gray-800">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-green-400 shrink-0" />
              <span>Operator Sign-off: <strong className="text-slate-200">{draftConfig.technicianId}</strong></span>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setDraftConfig(committedConfig);
                  setViewMode('MONITOR');
                }}
                className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                DISCARD / RETURN
              </button>
              <button
                type="submit"
                id="btn-save-node-config-footer"
                className="px-6 py-2 rounded-lg bg-orange-500 hover:bg-orange-400 text-black font-extrabold text-xs uppercase tracking-wider shadow-lg flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Check className="w-4 h-4 stroke-[3]" /> COMMIT TO PLC & RETURN
              </button>
            </div>
          </div>
        </form>
      )}

      {/* 3. Action Footer (Bottom): Four equally spaced, large pill-shaped buttons */}
      <footer className="w-full pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Button 1: START BATCH CYCLE */}
          <button
            onClick={() => handleActionClick('START BATCH CYCLE')}
            id="btn-start-batch-cycle"
            className="w-full py-3.5 sm:py-4 px-5 rounded-full bg-transparent border-2 border-orange-500 text-orange-400 font-mono font-extrabold uppercase tracking-wider text-xs sm:text-sm hover:bg-orange-500 hover:text-black transition-all duration-200 shadow-[0_0_15px_rgba(249,115,22,0.3)] active:scale-95 flex items-center justify-center gap-2 group cursor-pointer"
          >
            <Play className="w-4 h-4 text-orange-400 group-hover:text-black transition-colors" />
            {t('start_batch', 'START BATCH CYCLE')}
          </button>

          {/* Button 2: PURGE GAS LINE */}
          <button
            onClick={() => handleActionClick('PURGE GAS LINE')}
            id="btn-purge-gas-line"
            className="w-full py-3.5 sm:py-4 px-5 rounded-full bg-transparent border-2 border-orange-500 text-orange-400 font-mono font-extrabold uppercase tracking-wider text-xs sm:text-sm hover:bg-orange-500 hover:text-black transition-all duration-200 shadow-[0_0_15px_rgba(249,115,22,0.3)] active:scale-95 flex items-center justify-center gap-2 group cursor-pointer"
          >
            <Flame className="w-4 h-4 text-orange-400 group-hover:text-black transition-colors" />
            {t('purge_gas', 'PURGE GAS LINE')}
          </button>

          {/* Button 3: DISPATCH TO DRIP LINES */}
          <button
            onClick={() => handleActionClick('DISPATCH TO DRIP LINES')}
            id="btn-dispatch-drip-lines"
            className="w-full py-3.5 sm:py-4 px-5 rounded-full bg-transparent border-2 border-orange-500 text-orange-400 font-mono font-extrabold uppercase tracking-wider text-xs sm:text-sm hover:bg-orange-500 hover:text-black transition-all duration-200 shadow-[0_0_15px_rgba(249,115,22,0.3)] active:scale-95 flex items-center justify-center gap-2 group cursor-pointer"
          >
            <Droplets className="w-4 h-4 text-orange-400 group-hover:text-black transition-colors" />
            {t('dispatch_drip', 'DISPATCH TO DRIP LINES')}
          </button>

          {/* Button 4: SYSTEM DIAGNOSTICS */}
          <button
            onClick={() => handleActionClick('SYSTEM DIAGNOSTICS')}
            id="btn-system-diagnostics"
            className="w-full py-3.5 sm:py-4 px-5 rounded-full bg-transparent border-2 border-orange-500 text-orange-400 font-mono font-extrabold uppercase tracking-wider text-xs sm:text-sm hover:bg-orange-500 hover:text-black transition-all duration-200 shadow-[0_0_15px_rgba(249,115,22,0.3)] active:scale-95 flex items-center justify-center gap-2 group cursor-pointer"
          >
            <Activity className="w-4 h-4 text-orange-400 group-hover:text-black transition-colors" />
            {t('system_diagnostics', 'SYSTEM DIAGNOSTICS')}
          </button>
        </div>
      </footer>

      {/* Interactive Action Modal / Execution Monitor for Touchscreen */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-gray-900 border-2 border-orange-500/80 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 font-mono text-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <Hexagon className="w-5 h-5 text-orange-400 fill-orange-400/20" />
                <h3 className="text-sm sm:text-base font-extrabold text-orange-400 uppercase tracking-wider">
                  COMMAND EXECUTION: {activeModal}
                </h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Execution Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-300">
                <span>PLC Relay & Interlock Sequence</span>
                <span className="text-cyan-400">{actionProgress}%</span>
              </div>
              <div className="w-full h-3 bg-gray-950 rounded-full border border-gray-800 p-0.5 overflow-hidden">
                <div
                  className="h-full bg-cyan-400 rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(6,182,212,0.8)]"
                  style={{ width: `${actionProgress}%` }}
                />
              </div>
            </div>

            {/* Live Terminal Output */}
            <div className="bg-gray-950 rounded-xl border border-gray-800 p-3 h-44 overflow-y-auto custom-scrollbar text-xs font-mono space-y-1.5 text-slate-300">
              {actionLogs.map((log, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-cyan-400 shrink-0">❯</span>
                  <span className={index === actionLogs.length - 1 ? 'text-green-400 font-bold' : 'text-slate-300'}>
                    {log}
                  </span>
                </div>
              ))}
              {isProcessingAction && (
                <div className="flex items-center gap-2 text-orange-400 font-bold animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping" />
                  Awaiting edge hardware acknowledgement...
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span>SIL-3 Watchdog Synced ({nodeId})</span>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="px-5 py-2 rounded-full bg-orange-500 hover:bg-orange-400 text-black font-extrabold text-xs tracking-wider transition-colors shadow-lg cursor-pointer"
              >
                DISMISS / RETURN TO HMI
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Industrial Floating Toast */}
      {toastMessage && (
        <div className="fixed bottom-20 right-6 z-50 max-w-md animate-fade-in font-mono">
          <div className={`p-4 rounded-xl shadow-2xl border flex items-start gap-3 text-xs ${
            toastMessage.type === 'success'
              ? 'bg-gray-950 text-green-400 border-green-500/60 shadow-[0_0_20px_rgba(74,222,128,0.2)]'
              : toastMessage.type === 'warning'
              ? 'bg-gray-950 text-amber-400 border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
              : 'bg-gray-950 text-cyan-400 border-cyan-500/60 shadow-[0_0_20px_rgba(6,182,212,0.2)]'
          }`}>
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-extrabold tracking-wide uppercase mb-0.5">
                {toastMessage.type === 'success' ? 'SYSTEM SETPOINT COMMITTED' : 'SYSTEM NOTICE'}
              </div>
              <div className="text-slate-300 text-[11px] leading-relaxed">
                {toastMessage.text}
              </div>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-white font-bold text-xs"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default IndustrialTouchscreenDashboard;
