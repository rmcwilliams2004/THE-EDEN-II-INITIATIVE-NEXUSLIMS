import React from 'react';
import {
  Lock,
  Unlock,
  Droplet,
  ShieldCheck,
  AlertOctagon,
  Sparkles,
  RefreshCw,
  Zap,
  Activity,
  CheckCircle2,
  Sliders,
  Flame,
} from 'lucide-react';
import { useFoliarDilution } from '../hooks/useFoliarDilution';

export const ModeBFoliarDispenser: React.FC = () => {
  const {
    mode,
    targetBatchLiters,
    targetNitrogenPercent,
    stockNPercent,
    calculation,
    snapshot,
    isProcessing,
    progressStep,
    errorMessage,
    isPumpHealthy,
    setMode,
    setTargetBatchLiters,
    setTargetNitrogenPercent,
    setIsPumpHealthy,
    startAutonomousDilutionSequence,
    emergencyStop,
    resetInterlocks,
  } = useFoliarDilution({
    initialMode: 'MODE_B_BATCH',
    defaultBatchLiters: 20,
    defaultNitrogenPercent: 1.5,
    rawStockNPercent: 25.0,
  });

  const isModeB = mode === 'MODE_B_BATCH';

  return (
    <div className="w-full bg-slate-900/90 border-2 border-slate-800 rounded-3xl p-6 space-y-6 shadow-2xl font-sans">
      {/* Mode Switcher Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono uppercase bg-purple-500/20 text-purple-300 border border-purple-500/40">
              SIL-3 GOVERNED
            </span>
            <h2 className="text-xl font-black text-white uppercase tracking-wider font-mono">
              MODE B • BATCH FOLIAR DISPENSING STATION
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Governs knapsack backpack sprayer dispensing with automated HPDD water dilution and physical valve interlock.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-850">
          <button
            type="button"
            onClick={() => setMode('MODE_A_BULK')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${
              !isModeB
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Mode A (Bulk Tank)
          </button>
          <button
            type="button"
            onClick={() => setMode('MODE_B_BATCH')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${
              isModeB
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Mode B (Batch Foliar)
          </button>
        </div>
      </div>

      {/* SIL-3 Physical Lockout Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Primary Valve Physical Lock */}
        <div
          className={`p-4 rounded-2xl border-2 flex items-center gap-4 transition-all ${
            snapshot.actuators.primaryAnhydrousValveLocked
              ? 'bg-amber-950/40 border-amber-500/60 text-amber-200'
              : 'bg-slate-950/60 border-slate-800 text-slate-400'
          }`}
        >
          <div
            className={`p-3 rounded-xl ${
              snapshot.actuators.primaryAnhydrousValveLocked
                ? 'bg-amber-500 text-black'
                : 'bg-slate-800 text-slate-300'
            }`}
          >
            {snapshot.actuators.primaryAnhydrousValveLocked ? (
              <Lock className="w-6 h-6" />
            ) : (
              <Unlock className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="text-xs font-bold font-mono uppercase tracking-wider text-amber-400">
              PHYSICAL HARDWARE INTERLOCK
            </div>
            <div className="text-sm font-black text-white">
              {snapshot.actuators.primaryAnhydrousValveLocked
                ? 'PRIMARY ANHYDROUS VALVE LOCKED'
                : 'PRIMARY VALVE UNLOCKED (BULK)'}
            </div>
            <div className="text-[11px] text-slate-400">
              {snapshot.actuators.primaryAnhydrousValveLocked
                ? 'Physical solenoid interlock engaged. Zero hazardous raw concentrate can pass.'
                : 'Bulk line active for industrial storage.'}
            </div>
          </div>
        </div>

        {/* Safe Backpack Output Status */}
        <div
          className={`p-4 rounded-2xl border-2 flex items-center gap-4 transition-all ${
            snapshot.actuators.safeBackpackDispenseValveOpen
              ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200'
              : snapshot.systemState === 'HARDWARE_ABORT'
              ? 'bg-red-950/40 border-red-500 text-red-200'
              : 'bg-slate-950/60 border-slate-800 text-slate-400'
          }`}
        >
          <div
            className={`p-3 rounded-xl ${
              snapshot.actuators.safeBackpackDispenseValveOpen
                ? 'bg-emerald-500 text-black'
                : snapshot.systemState === 'HARDWARE_ABORT'
                ? 'bg-red-600 text-white'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {snapshot.systemState === 'HARDWARE_ABORT' ? (
              <AlertOctagon className="w-6 h-6" />
            ) : (
              <Droplet className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="text-xs font-bold font-mono uppercase tracking-wider text-slate-300">
              BACKPACK DISPENSE PORT
            </div>
            <div className="text-sm font-black text-white">
              {snapshot.actuators.safeBackpackDispenseValveOpen
                ? 'DISPENSING SAFE 1.0% - 2.0% FOLIAR MIX'
                : snapshot.systemState === 'HARDWARE_ABORT'
                ? 'EMERGENCY HARDWARE ABORT ACTIVE'
                : 'NOZZLE CLOSED / STANDBY'}
            </div>
            <div className="text-[11px] text-slate-400">
              Target Envelope: Strict 1.0% to 2.0% N Concentration.
            </div>
          </div>
        </div>
      </div>

      {/* Autonomous Dosing & Calculation Dashboard */}
      {calculation && (
        <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 font-mono">
              <Sliders className="w-4 h-4 text-purple-400" />
              Autonomous Mass-Balance Dilution Engine
            </div>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/60">
              Dilution Ratio: {calculation.dilutionRatio}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
            {/* Target Backpack Volume */}
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <label className="text-[10px] text-slate-400 block mb-1">KNAPSACK VOLUME</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={5}
                  max={30}
                  step={5}
                  value={targetBatchLiters}
                  onChange={(e) => setTargetBatchLiters(Number(e.target.value))}
                  disabled={isProcessing}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-white font-bold text-base focus:outline-none focus:border-purple-500"
                />
                <span className="text-xs text-slate-400 font-bold">L</span>
              </div>
            </div>

            {/* Target Nitrogen Concentration */}
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <label className="text-[10px] text-slate-400 block mb-1">TARGET N % (1.0 - 2.0%)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1.0}
                  max={2.0}
                  step={0.1}
                  value={targetNitrogenPercent}
                  onChange={(e) => setTargetNitrogenPercent(Number(e.target.value))}
                  disabled={isProcessing}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-emerald-400 font-bold text-base focus:outline-none focus:border-purple-500"
                />
                <span className="text-xs text-slate-400 font-bold">%</span>
              </div>
            </div>

            {/* Required HPDD Water */}
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-1">HPDD DISTILLED WATER</span>
              <div className="text-base font-black text-blue-400">
                {calculation.hpddDistilledWaterVolumeLiters} <span className="text-xs text-slate-400">Liters</span>
              </div>
              <span className="text-[10px] text-slate-500">Dehumidification Condensate</span>
            </div>

            {/* Required Raw NH4OH */}
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-1">RAW 25% NH4OH STOCK</span>
              <div className="text-base font-black text-purple-400">
                {calculation.rawAmmoniaVolumeLiters} <span className="text-xs text-slate-400">Liters</span>
              </div>
              <span className="text-[10px] text-slate-500">Precision Micro-Dosed</span>
            </div>
          </div>
        </div>
      )}

      {/* Progress & Error Notification */}
      {isProcessing && (
        <div className="p-4 bg-purple-950/40 border border-purple-500/60 rounded-2xl flex items-center gap-3 animate-pulse">
          <Activity className="w-5 h-5 text-purple-400 animate-spin" />
          <span className="text-xs font-mono font-bold text-purple-200">{progressStep}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-950/60 border-2 border-red-500 rounded-2xl flex items-start gap-3 text-red-200 animate-fade-slide-up font-mono text-xs">
          <AlertOctagon className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="text-white font-bold block">SIL-3 SAFETY TRIP DETECTED:</strong>
            <div>{errorMessage}</div>
          </div>
        </div>
      )}

      {/* Control Actions & Failsafe Testing Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => startAutonomousDilutionSequence(false)}
            disabled={isProcessing || !isModeB}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-xs uppercase tracking-wider rounded-xl text-white transition-all shadow-lg shadow-emerald-950/50 flex items-center gap-2 active:scale-[0.98]"
          >
            <Sparkles className="w-4 h-4" />
            Inject HPDD & Dispense {targetBatchLiters}L Knapsack
          </button>

          <button
            type="button"
            onClick={resetInterlocks}
            disabled={isProcessing}
            className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold font-mono flex items-center gap-2 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Interlocks
          </button>
        </div>

        {/* SIL-3 Hardware Fault Simulator (for audit & verification) */}
        <div className="flex items-center gap-2 bg-slate-950/90 px-3 py-2 rounded-xl border border-slate-800 font-mono text-xs">
          <span className="text-[11px] text-slate-400">Pump Status:</span>
          <button
            type="button"
            onClick={() => setIsPumpHealthy((prev) => !prev)}
            className={`px-2 py-1 rounded text-[11px] font-bold ${
              isPumpHealthy
                ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-600'
                : 'bg-red-900/60 text-red-300 border border-red-600'
            }`}
          >
            {isPumpHealthy ? 'Pump Healthy' : 'Simulate Pump Fail'}
          </button>

          <button
            type="button"
            onClick={emergencyStop}
            className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white font-bold rounded text-[11px] uppercase transition-colors"
          >
            E-STOP
          </button>
        </div>
      </div>
    </div>
  );
};
