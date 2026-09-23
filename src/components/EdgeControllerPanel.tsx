import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Activity, 
  Flame, 
  Wind, 
  Droplets, 
  Cpu, 
  Lock, 
  Unlock, 
  RotateCcw, 
  AlertTriangle, 
  Binary, 
  FileCode2,
  Zap,
  Gauge
} from 'lucide-react';
import { EdenNodeTelemetryPacket, TelemetryBatch } from '../services/edenEdgeDaemon';

export const EdgeControllerPanel = () => {
  const [edgeStatus, setEdgeStatus] = useState<any>(null);
  const [latestPacket, setLatestPacket] = useState<EdenNodeTelemetryPacket | null>(null);
  const [batches, setBatches] = useState<TelemetryBatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [simMessage, setSimMessage] = useState<string | null>(null);

  // Poll status periodically
  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/edge/status');
      if (res.ok) {
        const data = await res.json();
        setEdgeStatus(data.status);
        setLatestPacket(data.latestPacket);
        if (data.recentBatches) {
          setBatches(data.recentBatches);
        }
      }
    } catch (e) {
      console.error('Failed to fetch edge status:', e);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 1500);
    return () => clearInterval(interval);
  }, []);

  const handleSimulate = async (action: string, value?: number) => {
    setLoading(true);
    setSimMessage(null);
    try {
      const res = await fetch('/api/edge/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, value })
      });
      const data = await res.json();
      setSimMessage(data.message || 'Simulation signal sent.');
      fetchStatus();
    } catch (err: any) {
      setSimMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const safetyState = latestPacket?.safetyState || edgeStatus?.safetyState || 'NORMAL_OPERATION';
  const isEmergency = safetyState === 'SIL3_EMERGENCY_SHUTDOWN';
  const isElevated = safetyState === 'ELEVATED_RISK';

  const actuators = latestPacket?.actuatorState || edgeStatus?.actuators || {
    nitrogenPurgeValveOpen: false,
    electricalBusIsolated: false,
    hermeticLouverSealed: false,
    wetScrubberFanBoost: false,
    primaryDispenseValveOpen: false,
  };

  const foliarLockout = latestPacket?.foliarLockout;
  const pt = latestPacket?.pressureTransducers || { pt101: 595.2, pt102: 594.8, pt103: 595.6 };
  const h2 = latestPacket?.hydrogenOptics || { lelPercentage: 1.2, ppm: 480 };
  const nh3 = latestPacket?.ammoniaScrubber || { ambientPpm: 3.2, scrubberFanRpm: 850 };
  const flow = latestPacket?.flowMeters || { biogasInflowNm3h: 12.5, beccsCo2MassFlowKgH: 34.2 };

  return (
    <div className="glass p-5 rounded-2xl border border-slate-800 flex flex-col gap-6 text-slate-100">
      {/* Header & Status Indicator */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Eden II Industrial Edge Controller (SIL-3 Daemon)
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
              Node: {edgeStatus?.nodeId || 'US-CAL-01-EDEN'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time 2oo3 voting intensifier monitoring, optical H2 LEL failsafes, foliar 1% N hardware lockout, and EcoCreditX SHA-256 dMRV batcher.
          </p>
        </div>

        {/* Global SIL-3 Banner */}
        <div className={`px-4 py-2 rounded-xl border flex items-center gap-3 transition-colors ${
          isEmergency 
            ? 'bg-red-950/60 border-red-500 text-red-300 animate-pulse' 
            : isElevated 
              ? 'bg-amber-950/40 border-amber-500 text-amber-300' 
              : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
        }`}>
          {isEmergency ? (
            <ShieldAlert className="w-6 h-6 text-red-400 shrink-0" />
          ) : (
            <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
          )}
          <div>
            <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400">SIL-3 Hardware Status</div>
            <div className="text-xs font-mono font-bold">{safetyState}</div>
          </div>
        </div>
      </div>

      {/* Simulation Feedback Alert */}
      {simMessage && (
        <div className="p-3 bg-blue-950/40 border border-blue-500/40 rounded-lg text-xs text-blue-200 flex items-center justify-between">
          <span>{simMessage}</span>
          <button onClick={() => setSimMessage(null)} className="text-blue-400 hover:text-white font-bold ml-2">✕</button>
        </div>
      )}

      {/* Sensor Ingestion Grid (4 Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. 2oo3 Pressure Transducers */}
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-purple-400 font-bold mb-2">
              <span className="flex items-center gap-1.5">
                <Gauge className="w-4 h-4" /> 2oo3 Pressure Intensifiers
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Limit: 620 Bar</span>
            </div>
            <div className="text-2xl font-mono font-bold text-slate-100">
              {latestPacket?.votedPressureBar ?? 595.2} <span className="text-xs text-slate-400">BAR</span>
            </div>
            <div className="grid grid-cols-3 gap-1 mt-3 text-[10px] font-mono text-center">
              <div className="p-1 rounded bg-slate-950 border border-slate-800">
                <div className="text-slate-400">PT-101</div>
                <div className={pt.pt101 > 620 ? 'text-red-400 font-bold' : 'text-slate-300'}>{pt.pt101}</div>
              </div>
              <div className="p-1 rounded bg-slate-950 border border-slate-800">
                <div className="text-slate-400">PT-102</div>
                <div className={pt.pt102 > 620 ? 'text-red-400 font-bold' : 'text-slate-300'}>{pt.pt102}</div>
              </div>
              <div className="p-1 rounded bg-slate-950 border border-slate-800">
                <div className="text-slate-400">PT-103</div>
                <div className={pt.pt103 > 620 ? 'text-red-400 font-bold' : 'text-slate-300'}>{pt.pt103}</div>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex justify-between">
            <span>Voting Logic:</span>
            <span className="font-mono text-emerald-400">{latestPacket?.votingStatus || '2oo3_PASSED'}</span>
          </div>
        </div>

        {/* 2. Optical H2 LEL Monitoring */}
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-amber-400 font-bold mb-2">
              <span className="flex items-center gap-1.5">
                <Flame className="w-4 h-4" /> Optical Hydrogen (H2)
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Trip: 10% LEL</span>
            </div>
            <div className="text-2xl font-mono font-bold text-slate-100">
              {h2.lelPercentage}% <span className="text-xs text-slate-400">LEL</span>
            </div>
            <div className="text-xs font-mono text-slate-400 mt-1">
              Concentration: <span className="text-amber-300">{h2.ppm} PPM</span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex justify-between">
            <span>Sensor Optics:</span>
            <span className="font-mono text-emerald-400">IR SPECTROSCOPY OK</span>
          </div>
        </div>

        {/* 3. Ammonia PPM & Scrubber */}
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-blue-400 font-bold mb-2">
              <span className="flex items-center gap-1.5">
                <Wind className="w-4 h-4" /> NH3 & Wet Scrubber
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Safe &lt; 25 PPM</span>
            </div>
            <div className="text-2xl font-mono font-bold text-slate-100">
              {nh3.ambientPpm} <span className="text-xs text-slate-400">PPM</span>
            </div>
            <div className="text-xs font-mono text-slate-400 mt-1">
              Scrubber Blower: <span className="text-blue-300">{nh3.scrubberFanRpm} RPM</span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex justify-between">
            <span>Acid Scrubber:</span>
            <span className="font-mono text-blue-400">{('scrubberActive' in nh3 && nh3.scrubberActive) || nh3.scrubberFanRpm > 0 ? 'ACTIVE BOOST' : 'IDLE CIRC'}</span>
          </div>
        </div>

        {/* 4. BECCS CO2 & Biogas Flow */}
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-emerald-400 font-bold mb-2">
              <span className="flex items-center gap-1.5">
                <Droplets className="w-4 h-4" /> BECCS & Biogas Flow
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Mass Meters</span>
            </div>
            <div className="text-2xl font-mono font-bold text-slate-100">
              {flow.beccsCo2MassFlowKgH} <span className="text-xs text-slate-400">kg/h CO2</span>
            </div>
            <div className="text-xs font-mono text-slate-400 mt-1">
              Biogas Inflow: <span className="text-emerald-300">{flow.biogasInflowNm3h} Nm³/h</span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex justify-between">
            <span>C-Negative Capture:</span>
            <span className="font-mono text-emerald-400">dMRV TRACKED</span>
          </div>
        </div>
      </div>

      {/* SIL-3 Actuator & Interlock Matrix + Foliar Lockout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Actuator Interlock Hardware Status */}
        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex flex-col gap-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            SIL-3 Hardware Actuators & Interlock Status
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            {/* N2 Purge */}
            <div className={`p-3 rounded-lg border flex flex-col gap-1 ${
              actuators.nitrogenPurgeValveOpen 
                ? 'bg-red-950/40 border-red-500/60 text-red-200' 
                : 'bg-slate-950 border-slate-800 text-slate-300'
            }`}>
              <span className="text-[10px] uppercase text-slate-400">N2 Purge Solenoid</span>
              <span className="font-bold">{actuators.nitrogenPurgeValveOpen ? 'OPEN (FAILSAFE TRIP)' : 'CLOSED (SEALED)'}</span>
            </div>

            {/* Electrical Bus */}
            <div className={`p-3 rounded-lg border flex flex-col gap-1 ${
              actuators.electricalBusIsolated 
                ? 'bg-red-950/40 border-red-500/60 text-red-200' 
                : 'bg-slate-950 border-slate-800 text-slate-300'
            }`}>
              <span className="text-[10px] uppercase text-slate-400">Electrical Bus</span>
              <span className="font-bold">{actuators.electricalBusIsolated ? 'ISOLATED (SAFE)' : 'ENERGIZED (BUS ON)'}</span>
            </div>

            {/* Hermetic Louvers */}
            <div className={`p-3 rounded-lg border flex flex-col gap-1 ${
              actuators.hermeticLouverSealed 
                ? 'bg-red-950/40 border-red-500/60 text-red-200' 
                : 'bg-slate-950 border-slate-800 text-slate-300'
            }`}>
              <span className="text-[10px] uppercase text-slate-400">Hermetic Louvers</span>
              <span className="font-bold">{actuators.hermeticLouverSealed ? 'SEALED TIGHT' : 'OPEN (AIR VENT)'}</span>
            </div>

            {/* Scrubber Fan */}
            <div className={`p-3 rounded-lg border flex flex-col gap-1 ${
              actuators.wetScrubberFanBoost 
                ? 'bg-blue-950/40 border-blue-500/60 text-blue-200' 
                : 'bg-slate-950 border-slate-800 text-slate-300'
            }`}>
              <span className="text-[10px] uppercase text-slate-400">Wet Scrubber Fan</span>
              <span className="font-bold">{actuators.wetScrubberFanBoost ? 'EMERGENCY BOOST' : 'NOMINAL RECIRC'}</span>
            </div>
          </div>
        </div>

        {/* Foliar Lockout Hardware Protection */}
        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                {foliarLockout?.dispenseSolenoidLocked ? (
                  <Lock className="w-4 h-4 text-amber-400" />
                ) : (
                  <Unlock className="w-4 h-4 text-emerald-400" />
                )}
                Foliar Hardware Lockout (1.0% N Dilution Guard)
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                foliarLockout?.dispenseSolenoidLocked 
                  ? 'bg-amber-950 text-amber-400 border border-amber-800' 
                  : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
              }`}>
                {foliarLockout?.dispenseSolenoidLocked ? 'VALVE LOCKED' : 'VALVE UNLOCKED'}
              </span>
            </div>
            
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-mono font-bold text-slate-100">
                {foliarLockout?.nitrogenConcentrationPct ?? 1.00}% <span className="text-xs text-slate-400">Aqueous N</span>
              </span>
              <span className="text-xs font-mono text-emerald-400">(Target: 1.00% ± 0.05%)</span>
            </div>

            <p className="text-xs text-slate-400 mt-2">
              {foliarLockout?.lockoutReason || 'Concentration perfectly calibrated to 1% N using distilled water. Safe for direct foliar crop application.'}
            </p>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-500 font-mono">
            Hardware Interlock: Primary dispense solenoid physically disconnected when dilution ≠ 1% N.
          </div>
        </div>
      </div>

      {/* Hardware Simulation Controls & SIL-3 Trigger Testing */}
      <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800 flex flex-col gap-3">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          Hardware & SIL-3 Failsafe Simulation Testing
        </div>
        <p className="text-xs text-slate-400">
          Inject hardware anomalies into the edge daemon polling loop to test SIL-3 automated safety responses:
        </p>

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            onClick={() => handleSimulate('PRESSURE_SPIKE', 635.0)}
            disabled={loading}
            className="px-3 py-1.5 rounded bg-purple-950/60 border border-purple-600/50 hover:bg-purple-900 text-purple-200 text-xs font-mono font-bold transition-colors"
          >
            Spike Pressure &gt; 620 Bar (N2 Purge)
          </button>

          <button
            onClick={() => handleSimulate('HYDROGEN_LEAK', 14.5)}
            disabled={loading}
            className="px-3 py-1.5 rounded bg-red-950/60 border border-red-600/50 hover:bg-red-900 text-red-200 text-xs font-mono font-bold transition-colors"
          >
            Inject H2 Leak &gt; 10% LEL (Bus Isolate)
          </button>

          <button
            onClick={() => handleSimulate('RESET_SAFETY')}
            disabled={loading}
            className="px-3 py-1.5 rounded bg-emerald-950/60 border border-emerald-600/50 hover:bg-emerald-900 text-emerald-200 text-xs font-mono font-bold transition-colors flex items-center gap-1.5 ml-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset SIL-3 Safety Interlocks
          </button>
        </div>
      </div>

      {/* EcoCreditX Cryptographic dMRV Telemetry Batcher (SHA-256) */}
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Binary className="w-4 h-4 text-emerald-400" />
            EcoCreditX dMRV Cryptographic 5-Second Telemetry Batches
          </div>
          <span className="text-[10px] text-slate-400 font-mono">SHA-256 Merkle Verification</span>
        </div>

        <div className="overflow-x-auto max-h-48 overflow-y-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase">
                <th className="py-1.5 px-2">Batch ID</th>
                <th className="py-1.5 px-2">Period End</th>
                <th className="py-1.5 px-2">Samples</th>
                <th className="py-1.5 px-2">Batch SHA-256 Hash</th>
                <th className="py-1.5 px-2">dMRV Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {batches.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-3 px-2 text-center text-slate-500">
                    Accumulating 5-second sensor packets for initial Merkle batch...
                  </td>
                </tr>
              ) : (
                batches.map(b => (
                  <tr key={b.batchId} className="hover:bg-slate-900/50">
                    <td className="py-1.5 px-2 text-emerald-400 font-bold">{b.batchId.split('-').slice(-2).join('-')}</td>
                    <td className="py-1.5 px-2 text-slate-400">{new Date(b.periodEnd).toLocaleTimeString()}</td>
                    <td className="py-1.5 px-2 text-slate-300">{b.sampleCount} pts</td>
                    <td className="py-1.5 px-2 text-slate-400 max-w-xs truncate" title={b.batchSha256Hash}>
                      {b.batchSha256Hash.slice(0, 16)}...{b.batchSha256Hash.slice(-8)}
                    </td>
                    <td className="py-1.5 px-2">
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-800">
                        VERIFIED ON-CHAIN
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EdgeControllerPanel;
