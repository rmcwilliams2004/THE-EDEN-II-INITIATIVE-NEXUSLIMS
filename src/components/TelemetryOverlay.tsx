import React from 'react';
import { TelemetryLog } from '../types';
import { Droplet, Thermometer, Gauge, Activity } from 'lucide-react';

export const TelemetryOverlay = ({ data }: { data: TelemetryLog }) => {
  return (
    <>
      <div className="absolute top-4 left-4 p-3 rounded bg-black/60 backdrop-blur-md border border-white/10 pointer-events-none">
        <div className="text-[10px] text-slate-400 mb-1 tracking-widest">LIVE_TELEMETRY_OVERLAY</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 telemetry-font text-xs">
          <div>PH: <span className="text-emerald-400">{data.phLevel.toFixed(1)}</span></div>
          <div>TEMP: <span className="text-amber-400">{data.temperatureC.toFixed(1)}°C</span></div>
          <div>PRES: <span className="text-purple-400">{data.pressureBar.toFixed(1)}</span></div>
          {data.moisturePercent !== undefined && (
            <div>MOIS: <span className="text-blue-400">{data.moisturePercent}%</span></div>
          )}
        </div>
      </div>
      <div className="absolute top-4 right-4 pointer-events-none">
        <span className="px-2 py-1 bg-red-600/90 text-white rounded text-[10px] font-bold uppercase tracking-widest backdrop-blur shadow-[0_0_15px_rgba(220,38,38,0.4)]">
          DMRV Verified
        </span>
      </div>
    </>
  );
};
