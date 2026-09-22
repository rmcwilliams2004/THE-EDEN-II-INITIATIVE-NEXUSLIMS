import React from 'react';

export interface VerticalLiquidTankProps {
  label: string;
  value: number; // percentage or volume
  max?: number;
  unit?: string;
  fillPercentage?: number;
  subLabel?: string;
  tankColor?: string; // default cyan
  id?: string;
}

export const VerticalLiquidTank: React.FC<VerticalLiquidTankProps> = ({
  label,
  value,
  max = 100,
  unit = '%',
  fillPercentage,
  subLabel,
  tankColor = 'bg-cyan-400',
  id,
}) => {
  const percentage = fillPercentage !== undefined ? fillPercentage : Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div id={id} className="flex flex-col items-center flex-1 h-full min-w-[50px] max-w-[90px] gap-2">
      {/* Tank Container */}
      <div className="relative w-full flex-1 min-h-[140px] max-h-[180px] bg-gray-950/90 rounded-xl border-2 border-gray-800 p-1 flex flex-col justify-end overflow-hidden shadow-inner">
        {/* Measurement Grid / Tick Marks */}
        <div className="absolute inset-y-2 left-1.5 flex flex-col justify-between z-10 pointer-events-none opacity-40">
          <div className="w-2 h-px bg-slate-400" />
          <div className="w-1.5 h-px bg-slate-600" />
          <div className="w-2 h-px bg-slate-400" />
          <div className="w-1.5 h-px bg-slate-600" />
          <div className="w-2 h-px bg-slate-400" />
        </div>

        {/* Right Tick Marks */}
        <div className="absolute inset-y-2 right-1.5 flex flex-col justify-between z-10 pointer-events-none opacity-40">
          <div className="w-2 h-px bg-slate-400" />
          <div className="w-1.5 h-px bg-slate-600" />
          <div className="w-2 h-px bg-slate-400" />
          <div className="w-1.5 h-px bg-slate-600" />
          <div className="w-2 h-px bg-slate-400" />
        </div>

        {/* Liquid Fill Level */}
        <div
          className={`w-full rounded-b-lg ${tankColor} transition-all duration-700 ease-out relative shadow-[0_0_15px_rgba(6,182,212,0.5)]`}
          style={{ height: `${percentage}%` }}
        >
          {/* Surface Meniscus Line */}
          {percentage > 0 && (
            <div className="absolute top-0 inset-x-0 h-1.5 bg-cyan-200/90 rounded-t shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
          )}

          {/* Liquid Shimmer / Bubbles overlay */}
          {percentage > 0 && (
            <div className="absolute inset-0 bg-gradient-to-t from-cyan-600/40 via-cyan-400/20 to-transparent" />
          )}
        </div>

        {/* Floating Percentage Badge inside tank */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <span className={`font-mono text-xs font-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] ${
            percentage > 40 ? 'text-gray-950 font-extrabold' : 'text-cyan-300'
          }`}>
            {percentage.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Label Below Tank */}
      <div className="text-center w-full">
        <div className="text-[11px] sm:text-xs font-mono font-bold text-slate-200 tracking-tight truncate">
          {label} ({percentage.toFixed(0)}%)
        </div>
        {subLabel && (
          <div className="text-[9px] font-mono text-slate-500 truncate">
            {subLabel}
          </div>
        )}
      </div>
    </div>
  );
};
