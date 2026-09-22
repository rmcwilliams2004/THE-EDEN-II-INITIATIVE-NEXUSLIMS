import React from 'react';

export interface HorizontalProgressBarProps {
  label: string;
  value: number | string;
  max?: number;
  unit?: string;
  percentage?: number; // Optional override or calculated as (value/max)*100
  barColor?: string; // default cyan
  glowClass?: string;
  id?: string;
}

export const HorizontalProgressBar: React.FC<HorizontalProgressBarProps> = ({
  label,
  value,
  max,
  unit = '',
  percentage: customPercentage,
  barColor = 'bg-cyan-400',
  glowClass = 'shadow-[0_0_12px_rgba(6,182,212,0.6)]',
  id,
}) => {
  // Determine percentage
  let pct = 0;
  if (customPercentage !== undefined) {
    pct = customPercentage;
  } else if (typeof value === 'number' && max !== undefined && max > 0) {
    pct = Math.min(100, Math.max(0, (value / max) * 100));
  } else {
    pct = 50;
  }

  return (
    <div id={id} className="w-full flex flex-col gap-1.5 p-2 rounded-lg bg-gray-900/60 border border-gray-800/80">
      {/* Label and Value readout */}
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="text-slate-200 font-bold tracking-wide truncate">
          {label}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-cyan-400 font-extrabold text-sm drop-shadow-[0_0_6px_rgba(6,182,212,0.4)]">
            {value}
            {unit && <span className="text-xs text-cyan-300 font-normal ml-0.5">{unit}</span>}
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            ({pct.toFixed(0)}%)
          </span>
        </div>
      </div>

      {/* Progress Track & Animated Glow Bar */}
      <div className="w-full h-4 bg-gray-950 rounded-md border border-gray-800 p-0.5 overflow-hidden flex items-center">
        <div
          className={`h-full rounded ${barColor} ${glowClass} transition-all duration-700 ease-out relative`}
          style={{ width: `${pct}%` }}
        >
          {/* Inner highlight line */}
          <div className="absolute inset-x-0 top-0 h-[2px] bg-white/40 rounded-t" />
          
          {/* Subtle striped pattern animation */}
          <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:12px_12px] opacity-30 animate-[pulse_2s_infinite]" />
        </div>
      </div>
    </div>
  );
};
