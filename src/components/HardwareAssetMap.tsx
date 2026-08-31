import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Map, X, Cpu, Wifi, Terminal, Activity, Zap, Power, AlertTriangle, Loader2 } from 'lucide-react';

interface NodeLocation {
  id: string;
  name: string;
  coordinates: [number, number]; // [longitude, latitude]
  status: 'ONLINE' | 'WARNING' | 'OFFLINE';
  metrics?: { ph: number; pressure: number; temp: number };
}

const ASSET_NODES: NodeLocation[] = [
  { id: 'US-CAL-01-EDEN', name: 'California Commercial Farm', coordinates: [-119.4179, 36.7783], status: 'ONLINE', metrics: { ph: 6.8, pressure: 600, temp: 390 } },
  { id: 'KE-NBI-04-COOP', name: 'Kenya Mwea Cooperative', coordinates: [37.3381, -0.6698], status: 'ONLINE', metrics: { ph: 7.1, pressure: 580, temp: 410 } },
  { id: 'ID-JKT-12-EDEN', name: 'Jakarta Palm Plantation', coordinates: [106.8456, -6.2088], status: 'WARNING', metrics: { ph: 6.2, pressure: 635, temp: 425 } },
  { id: 'BR-SP-09-COOP', name: 'São Paulo Soy Co-op', coordinates: [-46.6333, -23.5505], status: 'OFFLINE' },
  { id: 'AU-SYD-22-EDEN', name: 'Sydney Ag-Tech Hub', coordinates: [151.2093, -33.8688], status: 'ONLINE', metrics: { ph: 6.5, pressure: 610, temp: 395 } },
];

const getMockDetails = (id: string) => ({
  specs: {
    mcu: 'ARM Cortex-M7 (480MHz)',
    firmware: 'v2.4.1-edge',
    network: id.includes('EDEN') ? 'Starlink / 5G Failover' : 'Iridium Sat / 3G',
    power: 'Solar + 12V LiFePO4',
    installed: '2023-11-12'
  },
  logs: [
    { time: '14:32:05', type: 'VCM', event: 'VCM Hash verified. Block #2928 appended.' },
    { time: '14:30:12', type: 'SYNC', event: 'Telemetry sync complete (42 packets payload).' },
    { time: '14:15:00', type: 'DIAG', event: 'Sensor calibration routine finished normally.' },
    { time: '12:00:01', type: 'MODEL', event: 'Daily edge inference model updated (4.2MB).' },
  ]
});

export const HardwareAssetMap = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number, y: number, node: NodeLocation | null }>({ x: 0, y: 0, node: null });
  const [selectedNode, setSelectedNode] = useState<NodeLocation | null>(null);
  const [commandStatus, setCommandStatus] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const sendCommand = async (command: 'SHUTDOWN' | 'OVERRIDE') => {
    if (!selectedNode) return;
    setIsSending(true);
    setCommandStatus(`Transmitting ${command} via MQTT...`);
    try {
      const res = await fetch('/api/node/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodeId: selectedNode.id, command })
      });
      const data = await res.json();
      if (data.success) {
        setCommandStatus(`Success: ${data.message}`);
      } else {
        setCommandStatus('Error: Command failed to reach edge node.');
      }
    } catch (err) {
      setCommandStatus('Network error during transmission.');
    } finally {
      setIsSending(false);
      setTimeout(() => setCommandStatus(null), 5000);
    }
  };

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    svg
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`);

    // Create a projection
    const projection = d3.geoMercator()
      .scale(width / (2 * Math.PI))
      .translate([width / 2, height / 1.5]); // slightly lower to account for Antarctica

    const path = d3.geoPath().projection(projection);

    const g = svg.append('g');

    // Add zoom capabilities
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom as any);

    // Load GeoJSON and render map
    d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then((worldData: any) => {
      // world-atlas provides TopoJSON. To avoid topojson-client, we can just use a raw GeoJSON url instead.
      // Actually, let's use a pure GeoJSON source:
    }).catch(e => console.error("Could not load map data:", e));

    // Better to fetch raw GeoJSON
    d3.json('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson').then((geoData: any) => {
      
      // Draw countries
      g.selectAll('path')
        .data(geoData.features)
        .enter()
        .append('path')
        .attr('d', path as any)
        .attr('fill', '#0f172a') // slate-950/90ish
        .attr('stroke', '#334155') // slate-700
        .attr('stroke-width', 0.5)
        .attr('class', 'transition-colors duration-300 hover:fill-[#1e293b]');

      // Add nodes
      const nodes = g.selectAll('circle')
        .data(ASSET_NODES)
        .enter()
        .append('g')
        .attr('transform', (d) => {
          const [x, y] = projection(d.coordinates) || [0, 0];
          return `translate(${x}, ${y})`;
        });

      // Pulse ring for warning/online nodes
      nodes.append('circle')
        .attr('r', 12)
        .attr('fill', d => d.status === 'ONLINE' ? '#10b981' : d.status === 'WARNING' ? '#f59e0b' : '#64748b')
        .attr('opacity', 0.2)
        .attr('class', d => d.status !== 'OFFLINE' ? 'animate-ping origin-center' : '');

      // Core dot
      nodes.append('circle')
        .attr('r', 5)
        .attr('fill', d => d.status === 'ONLINE' ? '#10b981' : d.status === 'WARNING' ? '#f59e0b' : '#64748b')
        .attr('stroke', '#05070a')
        .attr('stroke-width', 1.5)
        .style('cursor', 'pointer')
        .on('mouseenter', (event, d) => {
          const [x, y] = d3.pointer(event, svgRef.current);
          setTooltip({ x, y, node: d });
        })
        .on('mouseleave', () => {
          setTooltip({ x: 0, y: 0, node: null });
        })
        .on('click', (event, d) => {
          setSelectedNode(d);
          setTooltip({ x: 0, y: 0, node: null }); // hide tooltip on click
        });

      // Label
      nodes.append('text')
        .attr('x', 10)
        .attr('y', 4)
        .text(d => d.id)
        .attr('fill', '#cbd5e1')
        .attr('font-size', '8px')
        .attr('font-family', 'Courier New, monospace')
        .attr('font-weight', 'bold')
        .attr('class', 'pointer-events-none drop-shadow-md');
        
    }).catch(err => {
      console.error('Failed to load GeoJSON', err);
    });

  }, []);

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between glass p-4 shrink-0">
        <div>
          <h2 className="text-sm uppercase tracking-widest text-emerald-400 font-bold mb-1 flex items-center gap-2">
            <Map className="w-4 h-4" />
            Global Asset Map
          </h2>
          <p className="text-xs text-slate-400">Live geographic distribution of Eden II Edge Nodes.</p>
        </div>
        <div className="flex gap-4 text-[10px] uppercase font-bold tracking-widest text-slate-500">
          <div className="flex items-center gap-1.5"><span className="dot bg-emerald-500"></span> Online (3)</div>
          <div className="flex items-center gap-1.5"><span className="dot bg-amber-500"></span> Warning (1)</div>
          <div className="flex items-center gap-1.5"><span className="dot bg-slate-500"></span> Offline (1)</div>
        </div>
      </div>

      <div className="flex-1 glass rounded-xl overflow-hidden relative" ref={containerRef}>
        <div className="absolute top-4 left-4 z-10 pointer-events-none">
          <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Overlay Control</div>
          <div className="flex flex-col gap-2">
            <div className="bg-slate-900/80 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-300 font-medium border-l-2 border-l-emerald-500">VCM Minting Network</div>
            <div className="bg-slate-900/40 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-500">Sister-Link Graph (Hidden)</div>
          </div>
        </div>
        
        <svg ref={svgRef} className="w-full h-full bg-[#030406]" />

        {tooltip.node && (
          <div 
            className="absolute z-20 glass p-3 border border-slate-700 shadow-2xl pointer-events-none transform -translate-x-1/2 -translate-y-[110%]"
            style={{ left: tooltip.x, top: tooltip.y, minWidth: '200px' }}
          >
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{tooltip.node.id}</span>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${
                tooltip.node.status === 'ONLINE' ? 'text-emerald-400' : tooltip.node.status === 'WARNING' ? 'text-amber-400' : 'text-slate-500'
              }`}>
                {tooltip.node.status}
              </span>
            </div>
            <div className="text-xs text-slate-400 mb-3">{tooltip.node.name}</div>
            
            {tooltip.node.metrics ? (
              <div className="grid grid-cols-2 gap-2 text-[10px] telemetry-font">
                <div className="flex flex-col">
                  <span className="text-slate-500">PH</span>
                  <span className="text-emerald-400">{tooltip.node.metrics.ph.toFixed(1)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-500">PRES</span>
                  <span className="text-purple-400">{tooltip.node.metrics.pressure} <span className="text-[8px] text-slate-600">BAR</span></span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-500">TEMP</span>
                  <span className="text-amber-400">{tooltip.node.metrics.temp}°C</span>
                </div>
              </div>
            ) : (
              <div className="text-[10px] text-slate-600 uppercase tracking-widest telemetry-font">
                Telemetry Unavailable
              </div>
            )}
          </div>
        )}
      </div>

      {selectedNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#05070a]/80 backdrop-blur-sm p-4">
          <div className="glass w-full max-w-2xl flex flex-col border border-slate-700 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded ${selectedNode.status === 'ONLINE' ? 'bg-emerald-500/20 text-emerald-400' : selectedNode.status === 'WARNING' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-500/20 text-slate-400'}`}>
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-widest text-slate-100 uppercase flex items-center gap-2">
                    {selectedNode.id}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${selectedNode.status === 'ONLINE' ? 'border-emerald-500/30 text-emerald-400' : selectedNode.status === 'WARNING' ? 'border-amber-500/30 text-amber-400' : 'border-slate-500/30 text-slate-400'}`}>
                      {selectedNode.status}
                    </span>
                  </h3>
                  <span className="text-xs text-slate-400">{selectedNode.name}</span>
                </div>
              </div>
              <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#0a0d14]/50">
              {/* Specs Section */}
              <div className="flex flex-col gap-4">
                <h4 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold border-b border-slate-800 pb-2">Hardware Specs</h4>
                <div className="flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <Cpu className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest">Compute Core</span>
                      <span className="text-xs text-slate-300 font-medium">{getMockDetails(selectedNode.id).specs.mcu}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Terminal className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest">Firmware</span>
                      <span className="text-xs text-slate-300 font-medium telemetry-font">{getMockDetails(selectedNode.id).specs.firmware}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Wifi className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest">Network Uplink</span>
                      <span className="text-xs text-slate-300 font-medium">{getMockDetails(selectedNode.id).specs.network}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Zap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest">Power Subsystem</span>
                      <span className="text-xs text-slate-300 font-medium">{getMockDetails(selectedNode.id).specs.power}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Logs Section */}
              <div className="flex flex-col gap-4">
                <h4 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold border-b border-slate-800 pb-2">Recent Execution Logs</h4>
                <div className="flex flex-col gap-2 relative before:content-[''] before:absolute before:left-[11px] before:top-1 before:bottom-1 before:w-px before:bg-slate-800">
                  {getMockDetails(selectedNode.id).logs.map((log, i) => (
                    <div key={i} className="flex gap-3 relative">
                      <div className="w-[6px] h-[6px] rounded-full bg-emerald-500 mt-1.5 shrink-0 ml-[8px] z-10 border border-[#0a0d14]" />
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400 telemetry-font">{log.time}</span>
                          <span className="text-[9px] px-1 py-0.5 rounded bg-slate-800/80 text-slate-300 uppercase tracking-widest">{log.type}</span>
                        </div>
                        <span className="text-xs text-slate-300 mt-0.5">{log.event}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Real-time Status Footer */}
            <div className="p-4 border-t border-white/10 flex items-center justify-between bg-slate-900/50">
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest">Health</span>
                  <span className="text-xs font-bold text-emerald-400">99.9% (Optimal)</span>
                </div>
                <div className="h-6 w-px bg-slate-800" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest">Uptime</span>
                  <span className="text-xs font-bold text-slate-300 telemetry-font">45d 12h 02m</span>
                </div>
              </div>
              <button className="text-[10px] uppercase tracking-widest px-4 py-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors rounded border border-emerald-500/30 font-bold">
                Run Diagnostics
              </button>
            </div>

            {/* Remote Command Center */}
            <div className="p-4 border-t border-slate-700 bg-[#05070a] flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold flex items-center gap-2">
                  <Terminal className="w-3 h-3" />
                  Remote Command Center (MQTT)
                </h4>
                {commandStatus && (
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-2 animate-in fade-in">
                    {isSending && <Loader2 className="w-3 h-3 animate-spin" />}
                    {commandStatus}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => sendCommand('SHUTDOWN')}
                  disabled={isSending}
                  className="flex-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-widest py-3 rounded flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Power className="w-4 h-4" />
                  Shutdown Sequence
                </button>
                <button 
                  onClick={() => sendCommand('OVERRIDE')}
                  disabled={isSending}
                  className="flex-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-widest py-3 rounded flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Emergency Override
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
