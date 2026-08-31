import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface TelemetryPoint {
  timestamp: string;
  metrics: {
    ph: number;
    pressure: number;
    temperature: number;
  };
}

export const TelemetryDashboard = ({ liveData }: { liveData: any[] }) => {
  // Format data for Recharts
  const chartData = liveData.map((d: any) => ({
    time: new Date(d.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' }),
    pH: d.metrics.ph,
    Pressure: d.metrics.pressure,
    Temperature: d.metrics.temperature
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between glass p-4">
        <div>
          <h2 className="text-sm uppercase tracking-widest text-slate-500 font-bold mb-1">Live Telemetry Stream</h2>
          <p className="text-xs text-slate-400">WebSocket connection active. Data incoming from Edge Node US-CAL-01-EDEN.</p>
        </div>
        <div className="flex gap-2 text-xs">
          <button className="px-3 py-1.5 glass text-emerald-400 border-emerald-500/30">Live (5s)</button>
          <button className="px-3 py-1.5 glass text-slate-400 hover:text-slate-200">1H</button>
          <button className="px-3 py-1.5 glass text-slate-400 hover:text-slate-200">24H</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pressure Chart */}
        <div className="glass p-4 rounded-xl h-80 flex flex-col">
          <h3 className="text-xs uppercase tracking-widest text-purple-400 font-bold mb-4">Hydraulic Pressure (BAR)</h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#475569" fontSize={10} tickMargin={10} />
                <YAxis stroke="#475569" fontSize={10} domain={['auto', 'auto']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', fontSize: '12px' }}
                  itemStyle={{ color: '#c084fc' }}
                />
                <Line type="monotone" dataKey="Pressure" stroke="#c084fc" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Temperature Chart */}
        <div className="glass p-4 rounded-xl h-80 flex flex-col">
          <h3 className="text-xs uppercase tracking-widest text-amber-400 font-bold mb-4">Reactor Temperature (°C)</h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#475569" fontSize={10} tickMargin={10} />
                <YAxis stroke="#475569" fontSize={10} domain={['auto', 'auto']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', fontSize: '12px' }}
                  itemStyle={{ color: '#fbbf24' }}
                />
                <Line type="monotone" dataKey="Temperature" stroke="#fbbf24" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* pH Chart (Full Width) */}
        <div className="glass p-4 rounded-xl h-80 flex flex-col lg:col-span-2">
          <h3 className="text-xs uppercase tracking-widest text-emerald-400 font-bold mb-4">Soil/Reactor pH Level</h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#475569" fontSize={10} tickMargin={10} />
                <YAxis stroke="#475569" fontSize={10} domain={[4, 9]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', fontSize: '12px' }}
                  itemStyle={{ color: '#34d399' }}
                />
                <Line type="stepAfter" dataKey="pH" stroke="#34d399" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
