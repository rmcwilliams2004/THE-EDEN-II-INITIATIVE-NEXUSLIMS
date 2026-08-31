import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Gauge, 
  Flame, 
  Wind, 
  Zap, 
  Lock, 
  Unlock, 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle2, 
  Radio, 
  Activity,
  Layers,
  Sparkles,
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  Clock,
  Server,
  Filter,
  Check,
  Cpu,
  RefreshCw
} from 'lucide-react';
import { submitTelemetryToHCS, HCSSubmitResult } from '../services/hederaService';

export interface HealthAlert {
  id: string;
  timestamp: string;
  subsystem: '2oo3_PRESSURE' | 'H2_LEL' | 'SCRUBBER' | 'FOLIAR_LOCKOUT' | 'SYSTEM_WATCHDOG';
  severity: 'CRITICAL' | 'WARNING' | 'INFO' | 'RESOLVED';
  title: string;
  description: string;
  valueMetric: string;
  acknowledged: boolean;
}

export interface SafetyTriggerStatus {
  id: string;
  name: string;
  category: 'PRESSURE' | 'HYDROGEN' | 'AMMONIA' | 'FOLIAR_DILUTION';
  sensorInputs: string;
  threshold: string;
  currentReading: string;
  status: 'NOMINAL' | 'ARMED' | 'TRIGGERED' | 'LOCKOUT';
  actionTaken: string;
  silLevel: 'SIL-3' | 'SIL-2';
  lastEvaluated: string;
}

export const SIL3SafetyFailsafe: React.FC<{ nodeId?: string }> = ({ nodeId = 'US-CAL-01-EDEN' }) => {
  // Live sensory readings state
  const [pt101, setPt101] = useState(595.4);
  const [pt102, setPt102] = useState(594.8);
  const [pt103, setPt103] = useState(596.1);
  const [h2Lel, setH2Lel] = useState(1.15);
  const [nh3Ppm, setNh3Ppm] = useState(3.4);
  const [scrubberFanRpm, setScrubberFanRpm] = useState(850);
  const [foliarNPct, setFoliarNPct] = useState(1.00);
  const [acidLevelPct, setAcidLevelPct] = useState(88.5);

  // Failsafe triggers active state
  const [isPressureTripped, setIsPressureTripped] = useState(false);
  const [isH2Tripped, setIsH2Tripped] = useState(false);
  const [isScrubberBoosted, setIsScrubberBoosted] = useState(false);
  const [isFoliarLocked, setIsFoliarLocked] = useState(false);
  
  // Real-time Health Alerts state
  const [alerts, setAlerts] = useState<HealthAlert[]>([
    {
      id: 'ALT-1001',
      timestamp: new Date(Date.now() - 1000 * 45).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      subsystem: 'SYSTEM_WATCHDOG',
      severity: 'INFO',
      title: 'SIL-3 Watchdog Synced',
      description: 'Triple modular voting logic synchronized across 3 independent transceivers.',
      valueMetric: 'Cycle: 1ms',
      acknowledged: true,
    },
    {
      id: 'ALT-1002',
      timestamp: new Date(Date.now() - 1000 * 20).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      subsystem: 'SCRUBBER',
      severity: 'INFO',
      title: 'Acid Scrubber Baseline Healthy',
      description: 'Counter-current packed column maintaining 88.5% H2SO4 bed concentration.',
      valueMetric: '850 RPM',
      acknowledged: true,
    }
  ]);
  const [alertFilter, setAlertFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING'>('ALL');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // HCS Submission state
  const [hcsSubmission, setHcsSubmission] = useState<HCSSubmitResult | null>(null);
  const [isSubmittingHcs, setIsSubmittingHcs] = useState(false);
  const [watchdogTicks, setWatchdogTicks] = useState(189420);

  // 2oo3 Voting Calculation
  const highPressureCount = [pt101, pt102, pt103].filter(p => p > 620.0).length;
  const sortedPressures = [pt101, pt102, pt103].sort((a, b) => a - b);
  const votedMedianPressure = sortedPressures[1];
  const pressureDivergence = Math.max(pt101, pt102, pt103) - Math.min(pt101, pt102, pt103);

  // Helper to add new alerts dynamically
  const pushAlert = (
    subsystem: HealthAlert['subsystem'],
    severity: HealthAlert['severity'],
    title: string,
    description: string,
    valueMetric: string
  ) => {
    const newAlert: HealthAlert = {
      id: `ALT-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      subsystem,
      severity,
      title,
      description,
      valueMetric,
      acknowledged: false,
    };

    setAlerts(prev => [newAlert, ...prev.slice(0, 24)]);
  };

  // Monitor trip state transitions to push real-time alerts
  useEffect(() => {
    const pressureTrip = highPressureCount >= 2;
    const h2Trip = h2Lel >= 10.0;
    const scrubberBoost = nh3Ppm >= 15.0 || isScrubberBoosted;
    const foliarLock = Math.abs(foliarNPct - 1.0) > 0.05;

    if (pressureTrip && !isPressureTripped) {
      pushAlert(
        '2oo3_PRESSURE',
        'CRITICAL',
        '2oo3 Overpressure Failsafe Tripped',
        `≥ 2 Transducers exceeded 620 Bar threshold. High-speed N2 inert purge valve energized.`,
        `${votedMedianPressure.toFixed(1)} BAR`
      );
    } else if (!pressureTrip && isPressureTripped) {
      pushAlert(
        '2oo3_PRESSURE',
        'RESOLVED',
        '2oo3 Pressure Restored to Nominal',
        'Transducer voting returned below 620 Bar. Failsafe reset to ARMED.',
        `${votedMedianPressure.toFixed(1)} BAR`
      );
    }

    if (h2Trip && !isH2Tripped) {
      pushAlert(
        'H2_LEL',
        'CRITICAL',
        'Optical H2 LEL Interlock Tripped',
        'Non-dispersive IR spectroscopy detected ≥10.0% LEL. Synthesis bus isolated, hermetic louvers sealed.',
        `${h2Lel.toFixed(2)}% LEL`
      );
    } else if (!h2Trip && isH2Tripped) {
      pushAlert(
        'H2_LEL',
        'RESOLVED',
        'Hydrogen Atmosphere Cleared',
        'Enclosure optical IR reading below 10.0% LEL threshold. Bus isolator primed.',
        `${h2Lel.toFixed(2)}% LEL`
      );
    }

    if (scrubberBoost && !isScrubberBoosted) {
      pushAlert(
        'SCRUBBER',
        'WARNING',
        'Scrubber VFD Blower Boost Triggered',
        'NH3 gas level exceeded 15.0 PPM. Blower fan ramped from 850 RPM to 3450 RPM.',
        `${nh3Ppm.toFixed(1)} PPM`
      );
    }

    if (foliarLock && !isFoliarLocked) {
      pushAlert(
        'FOLIAR_LOCKOUT',
        'WARNING',
        'Foliar Dilution Lockout Engaged',
        `Concentration drifted to ${foliarNPct.toFixed(2)}% N (limit 0.95%-1.05%). Dispense lever locked.`,
        `${foliarNPct.toFixed(2)}% N`
      );
    }

    setIsPressureTripped(pressureTrip);
    setIsH2Tripped(h2Trip);
    setIsScrubberBoosted(scrubberBoost);
    setIsFoliarLocked(foliarLock);
  }, [highPressureCount, h2Lel, nh3Ppm, isScrubberBoosted, foliarNPct]);

  // Live polling oscillator
  useEffect(() => {
    const interval = setInterval(() => {
      setWatchdogTicks(t => t + 1);

      if (!isPressureTripped) {
        setPt101(parseFloat((595.0 + (Math.random() - 0.5) * 3).toFixed(2)));
        setPt102(parseFloat((594.8 + (Math.random() - 0.5) * 3).toFixed(2)));
        setPt103(parseFloat((595.5 + (Math.random() - 0.5) * 3).toFixed(2)));
      }
      if (!isH2Tripped) {
        setH2Lel(parseFloat(Math.max(0.1, (1.15 + (Math.random() - 0.5) * 0.2)).toFixed(2)));
      }
      if (!isScrubberBoosted) {
        setNh3Ppm(parseFloat(Math.max(0.2, (3.4 + (Math.random() - 0.5) * 0.5)).toFixed(2)));
        setScrubberFanRpm(850 + Math.round(Math.random() * 30));
      } else {
        setScrubberFanRpm(3450);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPressureTripped, isH2Tripped, isScrubberBoosted]);

  const globalFailsafeActive = isPressureTripped || isH2Tripped;
  const unacknowledgedCount = alerts.filter(a => !a.acknowledged).length;

  // Filtered alerts list
  const filteredAlerts = useMemo(() => {
    if (alertFilter === 'CRITICAL') return alerts.filter(a => a.severity === 'CRITICAL');
    if (alertFilter === 'WARNING') return alerts.filter(a => a.severity === 'WARNING' || a.severity === 'CRITICAL');
    return alerts;
  }, [alerts, alertFilter]);

  // Trigger safety anomaly simulations
  const handleTriggerPressureSpike = () => {
    setPt101(638.4);
    setPt102(632.1);
    setPt103(598.0); // 2 out of 3 above 620 Bar
  };

  const handleTriggerH2Leak = () => {
    setH2Lel(14.8);
  };

  const handleTriggerAmmoniaLeak = () => {
    setNh3Ppm(28.5);
    setIsScrubberBoosted(true);
  };

  const handleTriggerFoliarDrift = () => {
    setFoliarNPct(2.85); // Excess nitrogen concentration
  };

  const handleResetAllFailsafes = () => {
    setPt101(595.2);
    setPt102(594.6);
    setPt103(595.9);
    setH2Lel(1.15);
    setNh3Ppm(3.4);
    setScrubberFanRpm(850);
    setFoliarNPct(1.00);
    setIsPressureTripped(false);
    setIsH2Tripped(false);
    setIsScrubberBoosted(false);
    setIsFoliarLocked(false);
    pushAlert(
      'SYSTEM_WATCHDOG',
      'INFO',
      'Manual Interlock Reset Applied',
      'Operator confirmed all sensor trip triggers cleared and restored nominal baseline.',
      'SIL-3 READY'
    );
  };

  const handleAcknowledgeAll = () => {
    setAlerts(prev => prev.map(a => ({ ...a, acknowledged: true })));
  };

  const handleAcknowledgeSingle = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
  };

  const handleSendToHCS = async () => {
    setIsSubmittingHcs(true);
    try {
      const mockHash = `0x7f8a9b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a`;
      const res = await submitTelemetryToHCS(nodeId, mockHash, {
        votedPressureBar: votedMedianPressure,
        h2LelPct: h2Lel,
        co2CapturedKgH: 34.5,
        sil3SafetyState: globalFailsafeActive ? 'SIL3_EMERGENCY_SHUTDOWN' : 'NORMAL_OPERATION',
      });
      setHcsSubmission(res);
      pushAlert(
        'SYSTEM_WATCHDOG',
        'INFO',
        'Hedera Consensus Service Telemetry Logged',
        `Cryptographic packet sequence #${res.sequenceNumber} committed to HCS Topic 0.0.984210.`,
        `Seq #${res.sequenceNumber}`
      );
    } catch (e) {
      console.error('HCS submit error:', e);
    } finally {
      setIsSubmittingHcs(false);
    }
  };

  // Structured Safety Triggers Status Matrix
  const safetyTriggers: SafetyTriggerStatus[] = [
    {
      id: 'TRG-01',
      name: '2oo3 Intensifier Overpressure Purge',
      category: 'PRESSURE',
      sensorInputs: `PT-101 (${pt101.toFixed(1)}B) | PT-102 (${pt102.toFixed(1)}B) | PT-103 (${pt103.toFixed(1)}B)`,
      threshold: '≥ 2 Transducers > 620.0 BAR',
      currentReading: `${votedMedianPressure.toFixed(1)} BAR (${highPressureCount}/3 high)`,
      status: isPressureTripped ? 'TRIGGERED' : 'ARMED',
      actionTaken: isPressureTripped ? 'N2 Purge Solenoid Open • Feed Solenoid Vent' : 'Continuous 2oo3 Median Polling',
      silLevel: 'SIL-3',
      lastEvaluated: '100 ms ago',
    },
    {
      id: 'TRG-02',
      name: 'Optical H2 IR Spectroscopy Interlock',
      category: 'HYDROGEN',
      sensorInputs: `Non-Dispersive IR Optical Array (${(h2Lel * 400).toFixed(0)} PPM)`,
      threshold: '≥ 10.0% LEL (4,000 PPM)',
      currentReading: `${h2Lel.toFixed(2)}% LEL`,
      status: isH2Tripped ? 'TRIGGERED' : 'ARMED',
      actionTaken: isH2Tripped ? 'Synthesis Bus Isolated • Hermetic Louvers Sealed' : 'IR Transmission Healthy (0.01% LEL sensitivity)',
      silLevel: 'SIL-3',
      lastEvaluated: '100 ms ago',
    },
    {
      id: 'TRG-03',
      name: 'Ammonia Scrubber Auto-Neutralization',
      category: 'AMMONIA',
      sensorInputs: `Electrochemical NH3 Sensor + Acid Level (${acidLevelPct}%)`,
      threshold: '> 15.0 PPM NH3 Enclosure Air',
      currentReading: `${nh3Ppm.toFixed(1)} PPM (Blower ${scrubberFanRpm} RPM)`,
      status: isScrubberBoosted ? 'TRIGGERED' : 'NOMINAL',
      actionTaken: isScrubberBoosted ? 'Acid Scrubber Blower Boosted (3450 RPM)' : 'Low-Speed Recirculation Active',
      silLevel: 'SIL-2',
      lastEvaluated: '100 ms ago',
    },
    {
      id: 'TRG-04',
      name: 'Aqueous Foliar N Dilution Lockout',
      category: 'FOLIAR_DILUTION',
      sensorInputs: `Mass Flow Ratio: NH3 / (H2O + NH3)`,
      threshold: 'Window: 0.95% - 1.05% N (1.00% target)',
      currentReading: `${foliarNPct.toFixed(2)}% Aqueous N`,
      status: isFoliarLocked ? 'LOCKOUT' : 'NOMINAL',
      actionTaken: isFoliarLocked ? 'Primary Dispense Solenoid Physically Locked' : 'Dispense Lever Energized',
      silLevel: 'SIL-3',
      lastEvaluated: '100 ms ago',
    },
  ];

  return (
    <div className="glass p-5 rounded-2xl border border-slate-800 flex flex-col gap-6 text-slate-100 shadow-2xl">
      {/* Top Header with Master Safety Status & Real-time Health Diagnostics */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              SIL-3 Safety & Failsafe Interlock Architecture
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
              IEC 61508 / SIL-3 Certified
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
              Node: <strong className="text-slate-100 font-bold">{nodeId}</strong>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time Triple Modular Redundancy (2oo3) pressure voting, optical $H_2$ spectroscopy interlock, and wet acid scrubber with automated health alert ingestion.
          </p>
        </div>

        {/* Status Badges & Interlock Banner */}
        <div className="flex items-center gap-3">
          {/* Watchdog Heartbeat */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-slate-400">Heartbeat:</span>
            <span className="text-slate-200 font-bold">{watchdogTicks.toLocaleString()}</span>
          </div>

          {/* Master Interlock Status */}
          <div className={`px-4 py-2 rounded-xl border flex items-center gap-3 transition-colors ${
            globalFailsafeActive 
              ? 'bg-red-950/80 border-red-500 text-red-200 animate-pulse shadow-lg shadow-red-950/60' 
              : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
          }`}>
            {globalFailsafeActive ? (
              <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            )}
            <div>
              <div className="text-[9px] uppercase font-bold tracking-widest text-slate-400">Master Interlock</div>
              <div className="text-xs font-mono font-bold">
                {globalFailsafeActive ? 'SIL-3 EMERGENCY TRIP' : 'NOMINAL 2oo3 ARMED'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Safety System Health Diagnostics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            SIL-3 Health Score
          </div>
          <div className="text-lg font-mono font-bold text-slate-100 mt-1">
            {globalFailsafeActive ? '72.4%' : '99.98%'}
          </div>
          <div className="text-[9px] text-slate-500 font-mono mt-0.5">
            PFDavg: 3.1 × 10⁻⁴ (IEC 61508)
          </div>
        </div>

        <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-purple-400" />
            2oo3 Transducer Divergence
          </div>
          <div className={`text-lg font-mono font-bold mt-1 ${pressureDivergence > 30 ? 'text-amber-400' : 'text-purple-300'}`}>
            ±{pressureDivergence.toFixed(1)} <span className="text-xs text-slate-400">BAR</span>
          </div>
          <div className="text-[9px] text-slate-500 font-mono mt-0.5">
            Threshold: ±40 BAR max skew
          </div>
        </div>

        <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            Optics Transmission (NDIR)
          </div>
          <div className="text-lg font-mono font-bold text-amber-300 mt-1">
            {(100 - (h2Lel * 2.2)).toFixed(1)}% <span className="text-xs text-slate-400">Trans</span>
          </div>
          <div className="text-[9px] text-slate-500 font-mono mt-0.5">
            Path: 3.4 µm Narrowband
          </div>
        </div>

        <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
            <Wind className="w-3.5 h-3.5 text-blue-400" />
            Wet Scrubber Neutralization
          </div>
          <div className="text-lg font-mono font-bold text-blue-300 mt-1">
            {isScrubberBoosted ? '99.4%' : '98.8%'} <span className="text-xs text-slate-400">Eff</span>
          </div>
          <div className="text-[9px] text-slate-500 font-mono mt-0.5">
            Output: (NH4)2SO4 aqueous
          </div>
        </div>
      </div>

      {/* Main 3 Visualizer Cards: 2oo3 Pressure, Optical H2 LEL, Active Scrubber */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. 2-out-of-3 (2oo3) Pressure Voting Gauge */}
        <div className={`p-4 rounded-xl border transition-all ${
          isPressureTripped 
            ? 'bg-red-950/40 border-red-500/80 shadow-lg shadow-red-950/50' 
            : 'bg-slate-900/80 border-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-purple-400" />
              2oo3 Pressure Voting
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
              isPressureTripped ? 'bg-red-900 text-red-200 animate-pulse' : 'bg-purple-950 text-purple-300 border border-purple-800'
            }`}>
              {isPressureTripped ? 'OVERPRESSURE TRIP' : '2oo3 NOMINAL'}
            </span>
          </div>

          <div className="flex items-baseline justify-between mb-2">
            <div className="text-2xl font-mono font-bold text-slate-100">
              {votedMedianPressure.toFixed(1)} <span className="text-xs text-slate-400 font-normal">BAR</span>
            </div>
            <div className="text-[10px] font-mono text-slate-400">
              Trip Limit: <span className="text-red-400 font-bold">620.0 BAR</span>
            </div>
          </div>

          {/* 3 Transducers Comparison Grid */}
          <div className="grid grid-cols-3 gap-1.5 mt-2 text-[10px] font-mono text-center">
            <div className={`p-2 rounded border transition-colors ${pt101 > 620 ? 'bg-red-950 border-red-600 text-red-300 font-bold' : 'bg-slate-950 border-slate-800 text-slate-300'}`}>
              <div className="text-slate-400 text-[9px]">PT-101</div>
              <div className="font-bold text-xs mt-0.5">{pt101.toFixed(1)}B</div>
              <div className="text-[8px] text-slate-500">Intensifier A</div>
            </div>
            <div className={`p-2 rounded border transition-colors ${pt102 > 620 ? 'bg-red-950 border-red-600 text-red-300 font-bold' : 'bg-slate-950 border-slate-800 text-slate-300'}`}>
              <div className="text-slate-400 text-[9px]">PT-102</div>
              <div className="font-bold text-xs mt-0.5">{pt102.toFixed(1)}B</div>
              <div className="text-[8px] text-slate-500">Intensifier B</div>
            </div>
            <div className={`p-2 rounded border transition-colors ${pt103 > 620 ? 'bg-red-950 border-red-600 text-red-300 font-bold' : 'bg-slate-950 border-slate-800 text-slate-300'}`}>
              <div className="text-slate-400 text-[9px]">PT-103</div>
              <div className="font-bold text-xs mt-0.5">{pt103.toFixed(1)}B</div>
              <div className="text-[8px] text-slate-500">Median Ref</div>
            </div>
          </div>

          {/* 2oo3 Voting Logic Diagram */}
          <div className="mt-3 p-2 rounded bg-slate-950 border border-slate-800/80 text-[10px] font-mono">
            <div className="flex justify-between text-slate-400 mb-1">
              <span>Voting Circuit:</span>
              <span className="text-slate-200 font-bold">{highPressureCount} of 3 &gt; 620B</span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden flex gap-0.5 p-0.5">
              <div className={`h-full flex-1 rounded ${pt101 > 620 ? 'bg-red-500' : 'bg-emerald-500'}`} />
              <div className={`h-full flex-1 rounded ${pt102 > 620 ? 'bg-red-500' : 'bg-emerald-500'}`} />
              <div className={`h-full flex-1 rounded ${pt103 > 620 ? 'bg-red-500' : 'bg-emerald-500'}`} />
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>N2 Purge Valve:</span>
            <span className={isPressureTripped ? 'text-red-400 font-bold' : 'text-emerald-400'}>
              {isPressureTripped ? 'ENERGIZED (VENTING)' : 'SEALED / ARMED'}
            </span>
          </div>
        </div>

        {/* 2. Optical H2 LEL Monitoring Gauge */}
        <div className={`p-4 rounded-xl border transition-all ${
          isH2Tripped 
            ? 'bg-red-950/40 border-red-500/80 shadow-lg shadow-red-950/50' 
            : 'bg-slate-900/80 border-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-400" />
              Optical H2 LEL Monitoring
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
              isH2Tripped ? 'bg-red-900 text-red-200 animate-pulse' : 'bg-amber-950 text-amber-300 border border-amber-800'
            }`}>
              {isH2Tripped ? 'BUS ISOLATED' : 'IR OPTICS OK'}
            </span>
          </div>

          <div className="flex items-baseline justify-between mb-2">
            <div className="text-2xl font-mono font-bold text-slate-100">
              {h2Lel.toFixed(2)}% <span className="text-xs text-slate-400 font-normal">LEL</span>
            </div>
            <div className="text-[10px] font-mono text-slate-400">
              Trip Limit: <span className="text-red-400 font-bold">10.0% LEL</span>
            </div>
          </div>

          {/* Progress / LEL Visual Meter */}
          <div className="w-full bg-slate-950 rounded-full h-3 border border-slate-800 overflow-hidden mt-3 p-0.5">
            <div 
              className={`h-full rounded-full transition-all duration-300 ${
                h2Lel >= 10.0 ? 'bg-red-500' : h2Lel >= 5.0 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, (h2Lel / 20) * 100)}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3 text-[10px] font-mono text-slate-400">
            <div className="bg-slate-950 p-2 rounded border border-slate-800">
              <span className="text-slate-500">PPM H2:</span> <span className="text-slate-200 font-bold">{(h2Lel * 400).toFixed(0)} PPM</span>
            </div>
            <div className="bg-slate-950 p-2 rounded border border-slate-800">
              <span className="text-slate-500">Hermetic Louvers:</span> <span className={isH2Tripped ? 'text-red-400 font-bold' : 'text-emerald-400'}>{isH2Tripped ? 'SEALED' : 'OPEN'}</span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>Synthesis Bus:</span>
            <span className={isH2Tripped ? 'text-red-400 font-bold' : 'text-emerald-400'}>
              {isH2Tripped ? 'GALVANICALLY ISOLATED' : 'ENERGIZED (400V DC)'}
            </span>
          </div>
        </div>

        {/* 3. Active Scrubber Status Gauge */}
        <div className={`p-4 rounded-xl border transition-all ${
          isScrubberBoosted 
            ? 'bg-blue-950/40 border-blue-500/80 shadow-lg shadow-blue-950/50' 
            : 'bg-slate-900/80 border-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-300 flex items-center gap-1.5">
              <Wind className="w-4 h-4 text-blue-400" />
              Active Acid Scrubber
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
              isScrubberBoosted ? 'bg-blue-900 text-blue-200 animate-pulse' : 'bg-slate-950 text-blue-300 border border-blue-900'
            }`}>
              {isScrubberBoosted ? 'BOOST (3450 RPM)' : 'IDLE CIRC'}
            </span>
          </div>

          <div className="flex items-baseline justify-between mb-2">
            <div className="text-2xl font-mono font-bold text-slate-100">
              {nh3Ppm.toFixed(1)} <span className="text-xs text-slate-400 font-normal">PPM NH3</span>
            </div>
            <div className="text-[10px] font-mono text-slate-400">
              Boost Threshold: <span className="text-amber-400 font-bold">15.0 PPM</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3 text-[10px] font-mono text-slate-400">
            <div className="bg-slate-950 p-2 rounded border border-slate-800">
              <div className="text-slate-500 text-[9px]">Blower Speed</div>
              <div className="font-bold text-blue-300 text-xs mt-0.5">{scrubberFanRpm} RPM</div>
            </div>
            <div className="bg-slate-950 p-2 rounded border border-slate-800">
              <div className="text-slate-500 text-[9px]">Acid Tank Level</div>
              <div className="font-bold text-slate-200 text-xs mt-0.5">{acidLevelPct}% H2SO4</div>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>Neutralization Salt:</span>
            <span className="text-blue-300 font-bold font-mono">
              (NH4)2SO4 Soluble
            </span>
          </div>
        </div>
      </div>

      {/* Real-time Health Alerts Stream & Incident Log */}
      <div className="bg-slate-950/90 p-4 rounded-xl border border-slate-800 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="relative">
              <BellRing className={`w-4 h-4 ${unacknowledgedCount > 0 ? 'text-amber-400 animate-bounce' : 'text-slate-400'}`} />
              {unacknowledgedCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500" />
              )}
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Real-time SIL-3 Health & Failsafe Alert Feed
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 border border-slate-800 text-slate-300">
              {alerts.length} Events ({unacknowledgedCount} unacknowledged)
            </span>
          </div>

          {/* Filter & Acknowledge Controls */}
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[10px] font-mono">
              <button
                onClick={() => setAlertFilter('ALL')}
                className={`px-2 py-1 rounded transition-colors ${alertFilter === 'ALL' ? 'bg-slate-800 text-slate-100 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
              >
                All
              </button>
              <button
                onClick={() => setAlertFilter('WARNING')}
                className={`px-2 py-1 rounded transition-colors ${alertFilter === 'WARNING' ? 'bg-amber-950/60 text-amber-300 font-bold border border-amber-800/40' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Warn/Crit
              </button>
              <button
                onClick={() => setAlertFilter('CRITICAL')}
                className={`px-2 py-1 rounded transition-colors ${alertFilter === 'CRITICAL' ? 'bg-red-950/60 text-red-300 font-bold border border-red-800/40' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Critical
              </button>
            </div>

            {unacknowledgedCount > 0 && (
              <button
                onClick={handleAcknowledgeAll}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-mono font-bold flex items-center gap-1 transition-colors"
              >
                <Check className="w-3 h-3 text-emerald-400" />
                Ack All
              </button>
            )}
          </div>
        </div>

        {/* Alerts Feed List */}
        <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-4 text-xs text-slate-500 font-mono">
              No active health alerts matching filter criteria.
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const isCrit = alert.severity === 'CRITICAL';
              const isWarn = alert.severity === 'WARNING';
              const isResolved = alert.severity === 'RESOLVED';
              return (
                <div 
                  key={alert.id}
                  className={`p-2.5 rounded-lg border text-xs font-mono flex items-start justify-between gap-3 transition-colors ${
                    isCrit 
                      ? 'bg-red-950/30 border-red-500/50 text-red-200' 
                      : isWarn 
                        ? 'bg-amber-950/20 border-amber-500/40 text-amber-200' 
                        : isResolved
                          ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span className={`mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      isCrit 
                        ? 'bg-red-900 text-red-100 animate-pulse' 
                        : isWarn 
                          ? 'bg-amber-900 text-amber-100' 
                          : isResolved
                            ? 'bg-emerald-900 text-emerald-100'
                            : 'bg-slate-800 text-slate-300'
                    }`}>
                      {alert.severity}
                    </span>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100">{alert.title}</span>
                        <span className="text-[10px] text-slate-400">({alert.subsystem})</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 font-sans leading-relaxed">
                        {alert.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end shrink-0 gap-1">
                    <div className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {alert.timestamp}
                    </div>
                    <div className="font-bold text-slate-200 text-[10px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {alert.valueMetric}
                    </div>
                    {!alert.acknowledged && (
                      <button
                        onClick={() => handleAcknowledgeSingle(alert.id)}
                        className="text-[9px] text-emerald-400 hover:text-emerald-300 underline mt-0.5"
                      >
                        Acknowledge
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Safety Trigger Status Table */}
      <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            Active SIL-3 Safety Triggers & Interlock Status Matrix
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Real-time Watchdog Loop (1000 Hz)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase">
                <th className="py-2 px-3">Trigger ID</th>
                <th className="py-2 px-3">Safety Function & Subsystem</th>
                <th className="py-2 px-3">Sensor Input Telemetry</th>
                <th className="py-2 px-3">Trip Threshold</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Failsafe Response Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {safetyTriggers.map((t) => {
                const isTriggered = t.status === 'TRIGGERED' || t.status === 'LOCKOUT';
                return (
                  <tr key={t.id} className={isTriggered ? 'bg-red-950/20' : 'hover:bg-slate-900/40'}>
                    <td className="py-2.5 px-3 font-bold text-slate-300 flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-900 border border-slate-700 text-slate-400">
                        {t.silLevel}
                      </span>
                      {t.id}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-200">
                      {t.name}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {t.sensorInputs}
                    </td>
                    <td className="py-2.5 px-3 text-amber-400/90 font-bold">
                      {t.threshold}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.status === 'TRIGGERED' 
                          ? 'bg-red-950 text-red-300 border border-red-800 animate-pulse' 
                          : t.status === 'LOCKOUT'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      {t.actionTaken}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Anomaly Simulation Testing Bar & Hedera HCS Audit Log Submitter */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Hardware Anomaly Test Triggers */}
        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex flex-col gap-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Manual Hardware Trigger & SIL-3 In Situ Test Bench
          </div>
          <p className="text-xs text-slate-400">
            Inject simulated physical sensor transients to verify SIL-3 voting and interlock responses:
          </p>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={handleTriggerPressureSpike}
              className="px-3 py-1.5 rounded bg-purple-950/70 border border-purple-600/50 hover:bg-purple-900 text-purple-200 text-xs font-mono font-bold transition-colors"
            >
              Simulate 2oo3 Overpressure (&gt;620B)
            </button>

            <button
              onClick={handleTriggerH2Leak}
              className="px-3 py-1.5 rounded bg-red-950/70 border border-red-600/50 hover:bg-red-900 text-red-200 text-xs font-mono font-bold transition-colors"
            >
              Simulate Optical H2 Leak (&gt;10% LEL)
            </button>

            <button
              onClick={handleTriggerAmmoniaLeak}
              className="px-3 py-1.5 rounded bg-blue-950/70 border border-blue-600/50 hover:bg-blue-900 text-blue-200 text-xs font-mono font-bold transition-colors"
            >
              Simulate NH3 Excursion (&gt;25 PPM)
            </button>

            <button
              onClick={handleTriggerFoliarDrift}
              className="px-3 py-1.5 rounded bg-amber-950/70 border border-amber-600/50 hover:bg-amber-900 text-amber-200 text-xs font-mono font-bold transition-colors"
            >
              Simulate Dilution Error (2.85% N)
            </button>

            <button
              onClick={handleResetAllFailsafes}
              className="px-3 py-1.5 rounded bg-emerald-950/70 border border-emerald-600/50 hover:bg-emerald-900 text-emerald-200 text-xs font-mono font-bold transition-colors flex items-center gap-1.5 ml-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset All Interlocks
            </button>
          </div>
        </div>

        {/* Hedera Consensus Service (HCS) Telemetry Verification */}
        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400" />
                Hedera Consensus Service (HCS) dMRV Sync
              </div>
              <span className="text-[10px] font-mono text-slate-400">Topic: 0.0.984210</span>
            </div>
            
            <p className="text-xs text-slate-400">
              Log cryptographically signed SIL-3 sensor telemetry packets directly to Hedera Consensus Service topic for tamper-proof carbon and safety verification.
            </p>

            {hcsSubmission && (
              <div className="mt-3 p-2.5 rounded bg-slate-950 border border-slate-800 text-[11px] font-mono flex flex-col gap-1">
                <div className="flex justify-between text-emerald-400 font-bold">
                  <span>TxID: {hcsSubmission.transactionId}</span>
                  <span>Seq #{hcsSubmission.sequenceNumber}</span>
                </div>
                <div className="text-slate-400 truncate">
                  Running Hash: {hcsSubmission.runningHash.slice(0, 32)}...
                </div>
                <div className="text-[10px] text-slate-500">
                  Consensus Time: {hcsSubmission.consensusTimestamp}
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between pt-2 border-t border-slate-800">
            <span className="text-[10px] text-slate-500 font-mono">Ed25519 Hardware Cryptographic Signature</span>
            <button
              onClick={handleSendToHCS}
              disabled={isSubmittingHcs}
              className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {isSubmittingHcs ? (
                <>
                  <Activity className="w-3.5 h-3.5 animate-spin" />
                  Submitting to HCS...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Submit Telemetry Packet to HCS
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SIL3SafetyFailsafe;
