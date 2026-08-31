import React from 'react';
import { currentHardware } from '../data';
import { Wifi, Cpu, Clock, AlertTriangle, CloudOff } from 'lucide-react';

export const HardwareStatusWidget = () => {
  const isOnline = currentHardware.status === 'ONLINE';

  return (
    <div className="bg-slate-900/50 border border-white/5 rounded-lg p-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Cpu className="w-4 h-4 text-slate-500" />
          Hardware Telemetry
        </h2>
        <div className={`px-2 py-1 rounded border text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
          isOnline 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
            : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
        }`}>
          {isOnline ? <Wifi className="w-3 h-3" /> : <CloudOff className="w-3 h-3" />}
          {currentHardware.status}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-[10px] text-slate-400 mb-1 uppercase">
            <span>HYDRAULIC_PRESSURE</span>
            <span className="telemetry-font text-emerald-400">600 BAR</span>
          </div>
          <div className="w-full h-1 bg-slate-800 rounded-full"><div className="h-full bg-emerald-500 w-[90%] glow-green"></div></div>
        </div>
        
        <div>
          <div className="flex justify-between text-[10px] text-slate-400 mb-1 uppercase">
            <span>REACTOR_TEMP</span>
            <span className="telemetry-font text-amber-400">392.4 °C</span>
          </div>
          <div className="w-full h-1 bg-slate-800 rounded-full"><div className="h-full bg-amber-500 w-[75%] shadow-[0_0_15px_rgba(245,158,11,0.2)]"></div></div>
        </div>

        <div>
          <div className="flex justify-between text-[10px] text-slate-400 mb-1 uppercase">
            <span>SOIL_MOISTURE_IDX</span>
            <span className="telemetry-font text-blue-400">0.421</span>
          </div>
          <div className="w-full h-1 bg-slate-800 rounded-full"><div className="h-full bg-blue-500 w-[42%] shadow-[0_0_15px_rgba(59,130,246,0.2)]"></div></div>
        </div>

        <div className="pt-4 mt-2 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase tracking-wider">Node ID</span>
            <span className="text-xs telemetry-font text-slate-200">{currentHardware.id}</span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-slate-400 uppercase tracking-wider">Firmware</span>
            <span className="text-xs telemetry-font text-slate-200">{currentHardware.firmwareVer}</span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-slate-400 uppercase tracking-wider">Uptime</span>
            <span className="text-xs telemetry-font text-emerald-400">{currentHardware.uptime}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
