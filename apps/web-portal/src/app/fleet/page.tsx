import React, { useState } from 'react';
import { Globe, ShieldCheck, Flame, Gauge, Zap, AlertTriangle, Layers, Activity } from 'lucide-react';

interface FleetNode {
  id: string;
  name: string;
  type: 'COMMERCIAL_40FT' | 'HUMANITARIAN_20FT';
  country: string;
  lat: number;
  lng: number;
  status: 'ONLINE' | 'WARNING' | 'MAINTENANCE';
  rutheniumTempC: number;
  electrolyzerKw: number;
  pressureBar: number;
  sisterNodeId?: string;
}

const FLEET_NODES: FleetNode[] = [
  { id: 'US-CAL-01-EDEN', name: 'Central Valley Bio-Ag Node', type: 'COMMERCIAL_40FT', country: 'United States', lat: 36.7783, lng: -119.4179, status: 'ONLINE', rutheniumTempC: 391.4, electrolyzerKw: 295.0, pressureBar: 596.2, sisterNodeId: 'KE-RIFT-01-EDEN' },
  { id: 'KE-RIFT-01-EDEN', name: 'Rift Valley Smallholder Kiosk', type: 'HUMANITARIAN_20FT', country: 'Kenya', lat: 0.5143, lng: 35.2698, status: 'ONLINE', rutheniumTempC: 386.2, electrolyzerKw: 98.5, pressureBar: 594.8, sisterNodeId: 'US-CAL-01-EDEN' },
  { id: 'BR-MATO-02-EDEN', name: 'Cerrado Agro-Forestry Unit', type: 'COMMERCIAL_40FT', country: 'Brazil', lat: -12.6819, lng: -56.9211, status: 'ONLINE', rutheniumTempC: 394.8, electrolyzerKw: 288.0, pressureBar: 598.1, sisterNodeId: 'ID-SUM-02-EDEN' },
  { id: 'ID-SUM-02-EDEN', name: 'Sumatra Cooperative Sister Node', type: 'HUMANITARIAN_20FT', country: 'Indonesia', lat: -0.5897, lng: 101.3431, status: 'ONLINE', rutheniumTempC: 384.0, electrolyzerKw: 95.0, pressureBar: 592.3, sisterNodeId: 'BR-MATO-02-EDEN' },
];

export default function FleetPage() {
  const [selectedNode, setSelectedNode] = useState<FleetNode>(FLEET_NODES[0]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Global Paired Fleet Infrastructure</h1>
          <p className="text-xs text-slate-400 mt-1">
            Monitoring Commercial 40-ft 300kW Units paired 1-to-1 with Humanitarian 20-ft 100kW Sister Units.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-emerald-950/80 border border-emerald-500/50 rounded-lg text-emerald-400 text-xs font-mono font-bold">
            4 / 4 Nodes Operational (100% Uptime)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Node Fleet List */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
          <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold px-2">Active Node Fleet</h3>
          <div className="space-y-2">
            {FLEET_NODES.map((node) => {
              const isSelected = selectedNode.id === node.id;
              return (
                <button
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className={`w-full p-3 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                    isSelected 
                      ? 'bg-slate-800/90 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                      : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-white">{node.id}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                      {node.type === 'COMMERCIAL_40FT' ? '40FT COMM' : '20FT SISTER'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 font-medium">{node.name}</div>
                  <div className="text-[10px] text-slate-500">{node.country} • Sister: {node.sisterNodeId}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Node Telemetry & Catalyst Health */}
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <div className="text-lg font-bold text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-emerald-400" />
                {selectedNode.name}
              </div>
              <div className="text-xs font-mono text-slate-400 mt-0.5">
                Serial: {selectedNode.id} • Lat: {selectedNode.lat}, Lng: {selectedNode.lng}
              </div>
            </div>
            <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
              SIL-3 NOMINAL
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase flex items-center gap-1 mb-1">
                <Flame className="w-3.5 h-3.5 text-amber-400" /> Ru Catalyst Bed Temp
              </div>
              <div className="text-2xl font-bold text-white">{selectedNode.rutheniumTempC} <span className="text-xs text-slate-400">°C</span></div>
              <div className="text-[10px] text-emerald-400 mt-1">Optimum (380°C - 400°C)</div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase flex items-center gap-1 mb-1">
                <Zap className="w-3.5 h-3.5 text-blue-400" /> Electrolyzer Inverter
              </div>
              <div className="text-2xl font-bold text-white">{selectedNode.electrolyzerKw} <span className="text-xs text-slate-400">kW</span></div>
              <div className="text-[10px] text-blue-400 mt-1">Direct PEM Green H2</div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase flex items-center gap-1 mb-1">
                <Gauge className="w-3.5 h-3.5 text-purple-400" /> Intensifier Pressure
              </div>
              <div className="text-2xl font-bold text-white">{selectedNode.pressureBar} <span className="text-xs text-slate-400">BAR</span></div>
              <div className="text-[10px] text-purple-400 mt-1">2oo3 Voted Failsafe &lt;620B</div>
            </div>
          </div>

          {/* Sister-Link Pairing Info */}
          <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-xl space-y-2 text-xs font-mono">
            <div className="text-emerald-400 font-bold flex items-center gap-2">
              <Layers className="w-4 h-4" /> Sister-Link Humanitarian Connection
            </div>
            <p className="text-slate-300">
              This node is paired with <span className="text-white font-bold">{selectedNode.sisterNodeId}</span>. 
              30% of all generated on-chain carbon credits and foliar fertilizer surpluses are automatically routed to the sister cooperative.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
