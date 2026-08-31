import React from 'react';
import { Droplet, Lock, CheckCircle2, AlertOctagon } from 'lucide-react';

interface DispenseGaugeProps {
  currentLiters: number;
  maxLiters?: number;
  valveStatus: 'locked' | 'ready' | 'dispensing' | 'complete' | 'emergency_stop';
  concentrationPercent?: number;
}

export const DispenseGauge: React.FC<DispenseGaugeProps> = ({
  currentLiters,
  maxLiters = 20,
  valveStatus,
  concentrationPercent = 1.0,
}) => {
  const percentage = Math.min(100, Math.round((currentLiters / maxLiters) * 100));

  const statusConfig = {
    locked: { color: 'text-amber-400 border-amber-500 bg-amber-950/40', text: 'VALVE LOCKED / FUNGWA', icon: <Lock className="w-8 h-8" /> },
    ready: { color: 'text-emerald-400 border-emerald-500 bg-emerald-950/40', text: 'PULL LEVER TO DISPENSE', icon: <CheckCircle2 className="w-8 h-8" /> },
    dispensing: { color: 'text-blue-400 border-blue-500 bg-blue-950/40', text: 'DISPENSING SAFE MIX...', icon: <Droplet className="w-8 h-8 animate-bounce" /> },
    complete: { color: 'text-emerald-300 border-emerald-400 bg-emerald-900/60', text: 'DISPENSE COMPLETE!', icon: <CheckCircle2 className="w-8 h-8" /> },
    emergency_stop: { color: 'text-red-400 border-red-500 bg-red-950/60', text: 'EMERGENCY SHUTDOWN', icon: <AlertOctagon className="w-8 h-8" /> },
  }[valveStatus];

  return (
    <div className="w-full bg-slate-900/90 border-4 border-slate-800 rounded-3xl p-6 flex flex-col items-center gap-6 shadow-2xl">
      {/* High-Contrast Fill Tank Graphic */}
      <div className="w-full flex items-center justify-between gap-6">
        <div className="flex flex-col">
          <span className="text-xs uppercase font-extrabold tracking-widest text-slate-400">ALLOCATION / KIASI</span>
          <div className="text-5xl font-black text-white font-mono flex items-baseline gap-2 mt-1">
            {currentLiters} <span className="text-2xl text-emerald-400">LITERS</span>
          </div>
          <span className="text-xs font-mono text-emerald-400/80 mt-1">
            Exact Dilution: {concentrationPercent.toFixed(1)}% Safe Foliar N
          </span>
        </div>

        {/* Vertical Fill Level Bar */}
        <div className="w-16 h-40 bg-slate-950 rounded-2xl border-2 border-slate-700 p-1 flex flex-col-reverse relative overflow-hidden">
          <div 
            className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-xl transition-all duration-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]"
            style={{ height: `${percentage}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-xs font-black font-mono text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              {percentage}%
            </span>
          </div>
        </div>
      </div>

      {/* Valve Status Banner */}
      <div className={`w-full py-4 px-6 rounded-2xl border-4 flex items-center justify-center gap-4 ${statusConfig.color}`}>
        {statusConfig.icon}
        <span className="text-lg font-black uppercase tracking-wider text-center">
          {statusConfig.text}
        </span>
      </div>
    </div>
  );
};
