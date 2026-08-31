import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  MOCK_HARDWARE_NODES, 
  MOCK_AGRONOMY_PROFILES, 
  generateMockTelemetryForNode 
} from '../data';
import { Sprout, Globe, Activity, Layers, Droplets, Flame, Gauge } from 'lucide-react';

export const TelemetryDashboard = ({ liveData }: { liveData: any[] }) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('US-CAL-01-EDEN');
  const [timeRange, setTimeRange] = useState<'LIVE' | '1H' | '24H'>('LIVE');

  const selectedNode = useMemo(() => {
    return MOCK_HARDWARE_NODES.find(n => n.id === selectedNodeId) || MOCK_HARDWARE_NODES[0];
  }, [selectedNodeId]);

  const agronomyProfile = useMemo(() => {
    if (!selectedNode?.agronomyProfileId) return undefined;
    return MOCK_AGRONOMY_PROFILES[selectedNode.agronomyProfileId];
  }, [selectedNode]);

  // Combine live stream for US-CAL-01-EDEN or generate realistic mock telemetry for the chosen global node
  const chartData = useMemo(() => {
    if (selectedNodeId === 'US-CAL-01-EDEN' && liveData.length > 0 && timeRange === 'LIVE') {
      return liveData.map((d: any) => ({
        time: new Date(d.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        pH: d.metrics.ph,
        Pressure: d.metrics.pressure,
        Temperature: d.metrics.temperature,
        Moisture: d.metrics.moisture ?? agronomyProfile?.soilMoistureIndex ?? 35,
      }));
    }

    const count = timeRange === '24H' ? 24 : timeRange === '1H' ? 12 : 10;
    const generated = generateMockTelemetryForNode(selectedNodeId, count);
    return generated.map(d => ({
      time: new Date(d.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      pH: d.phLevel,
      Pressure: d.pressureBar,
      Temperature: d.temperatureC,
      Moisture: d.moisturePercent,
    }));
  }, [selectedNodeId, liveData, timeRange, agronomyProfile]);

  return (
    <div className="flex flex-col gap-5">
      {/* Node Selector & Stream Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between glass p-4 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <h2 className="text-sm uppercase tracking-widest text-emerald-400 font-bold">
              Global Telemetry Ingestion
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Streaming edge telemetry & baseline verification for <span className="font-mono text-slate-200 font-bold">{selectedNode.id}</span> ({selectedNode.country}).
          </p>
        </div>

        {/* Global Node Dropdown & Range Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={selectedNodeId}
            onChange={e => setSelectedNodeId(e.target.value)}
            aria-label="Select Target Hardware Node"
            className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded px-3 py-1.5 outline-none focus:border-emerald-500 font-mono"
          >
            {MOCK_HARDWARE_NODES.map(node => (
              <option key={node.id} value={node.id}>
                {node.id} — {node.country} ({node.cropFocus?.split('&')[0].trim() || 'General'})
              </option>
            ))}
          </select>

          <div className="flex gap-1 text-xs">
            <button
              onClick={() => setTimeRange('LIVE')}
              className={`px-3 py-1.5 rounded transition-colors text-xs font-bold ${
                timeRange === 'LIVE' 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                  : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              Live
            </button>
            <button
              onClick={() => setTimeRange('1H')}
              className={`px-3 py-1.5 rounded transition-colors text-xs font-bold ${
                timeRange === '1H' 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                  : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              1H
            </button>
            <button
              onClick={() => setTimeRange('24H')}
              className={`px-3 py-1.5 rounded transition-colors text-xs font-bold ${
                timeRange === '24H' 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                  : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              24H
            </button>
          </div>
        </div>
      </div>

      {/* Regional In-Situ Baseline Banner */}
      {agronomyProfile && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="glass p-3 rounded-lg border border-slate-800">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-slate-400 mb-1">
              <Sprout className="w-3.5 h-3.5 text-emerald-400" />
              <span>FAO Soil Base</span>
            </div>
            <div className="text-xs font-bold text-slate-200 truncate">{agronomyProfile.faoClassification}</div>
          </div>

          <div className="glass p-3 rounded-lg border border-slate-800">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-slate-400 mb-1">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>CEC Baseline</span>
            </div>
            <div className="text-xs font-bold text-purple-300 font-mono">{agronomyProfile.cecRatio.toFixed(1)} cmol(+)/kg</div>
          </div>

          <div className="glass p-3 rounded-lg border border-slate-800">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-slate-400 mb-1">
              <Droplets className="w-3.5 h-3.5 text-blue-400" />
              <span>Volumetric Moisture</span>
            </div>
            <div className="text-xs font-bold text-blue-300 font-mono">{agronomyProfile.soilMoistureIndex.toFixed(1)}%</div>
          </div>

          <div className="glass p-3 rounded-lg border border-slate-800">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-slate-400 mb-1">
              <Gauge className="w-3.5 h-3.5 text-amber-400" />
              <span>Electrical Cond. (EC)</span>
            </div>
            <div className="text-xs font-bold text-amber-300 font-mono">{agronomyProfile.electricalConductivity.toFixed(2)} dS/m</div>
          </div>
        </div>
      )}

      {/* Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Pressure Chart */}
        <div className="glass p-4 rounded-xl h-80 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs uppercase tracking-widest text-purple-400 font-bold">
              Hydraulic Chamber Pressure (BAR)
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">Range: 550 - 650 BAR</span>
          </div>
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
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs uppercase tracking-widest text-amber-400 font-bold">
              Pyrolysis Reactor Core Temp (°C)
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">Nominal: 350°C - 420°C</span>
          </div>
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
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs uppercase tracking-widest text-emerald-400 font-bold flex items-center gap-2">
              <Sprout className="w-4 h-4" />
              Soil & Reactor pH Baseline Tracking
            </h3>
            {agronomyProfile && (
              <span className="text-[10px] text-emerald-400/90 font-mono">
                Agronomic Baseline: {agronomyProfile.phBaseline.toFixed(1)} pH
              </span>
            )}
          </div>
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
