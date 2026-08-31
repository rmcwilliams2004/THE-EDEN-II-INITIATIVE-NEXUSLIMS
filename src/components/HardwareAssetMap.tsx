import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { 
  Map, X, Cpu, Wifi, Terminal, Activity, Zap, Power, 
  AlertTriangle, Loader2, Sprout, Layers, Globe, Compass, 
  Droplet, Gauge, CheckCircle2 
} from 'lucide-react';
import { 
  MOCK_HARDWARE_NODES, 
  MOCK_AGRONOMY_PROFILES, 
  GLOBAL_REGIONS, 
  MOCK_GLOBAL_USERS, 
  getRegionalNodeData 
} from '../data';
import { HardwareNode, HardwareStatus } from '../types';

export const HardwareAssetMap = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');
  const [tooltip, setTooltip] = useState<{ x: number; y: number; node: HardwareNode | null }>({ x: 0, y: 0, node: null });
  const [selectedNode, setSelectedNode] = useState<HardwareNode | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<'SPECS' | 'AGRONOMY' | 'LOGS'>('SPECS');
  const [commandStatus, setCommandStatus] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    if (selectedRegion === 'ALL') return MOCK_HARDWARE_NODES;
    return MOCK_HARDWARE_NODES.filter(n => n.region === selectedRegion || n.country === selectedRegion);
  }, [selectedRegion]);

  // Counts
  const onlineCount = useMemo(() => MOCK_HARDWARE_NODES.filter(n => n.status === 'ONLINE').length, []);
  const warningCount = useMemo(() => MOCK_HARDWARE_NODES.filter(n => n.status === 'WARNING').length, []);
  const offlineCount = useMemo(() => MOCK_HARDWARE_NODES.filter(n => n.status === 'OFFLINE').length, []);

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
    } catch {
      setCommandStatus('Network error during transmission.');
    } finally {
      setIsSending(false);
      setTimeout(() => setCommandStatus(null), 5000);
    }
  };

  const selectedNodeBundle = useMemo(() => {
    if (!selectedNode) return null;
    return getRegionalNodeData(selectedNode.id);
  }, [selectedNode]);

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

    // Mercator projection
    const projection = d3.geoMercator()
      .scale(width / (2 * Math.PI) * 0.95)
      .translate([width / 2, height / 1.55]);

    const path = d3.geoPath().projection(projection);
    const g = svg.append('g');

    // Zoom setup
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom as any);

    // Fetch GeoJSON world boundary
    d3.json('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson').then((geoData: any) => {
      // Draw world countries
      g.selectAll('path')
        .data(geoData.features)
        .enter()
        .append('path')
        .attr('d', path as any)
        .attr('fill', '#0b1120') // slate-900 / 950
        .attr('stroke', '#1e293b') // slate-800
        .attr('stroke-width', 0.6)
        .attr('class', 'transition-colors duration-200 hover:fill-[#162032]');

      // Graticule lines (subtle latitude/longitude grid)
      const graticule = d3.geoGraticule();
      g.append('path')
        .datum(graticule)
        .attr('d', path as any)
        .attr('fill', 'none')
        .attr('stroke', '#1e293b')
        .attr('stroke-width', 0.25)
        .attr('stroke-dasharray', '2,4')
        .attr('opacity', 0.4);

      // Node groups
      const nodeGroups = g.selectAll<SVGGElement, HardwareNode>('g.hardware-node')
        .data(filteredNodes, (d: HardwareNode) => d.id)
        .enter()
        .append('g')
        .attr('class', 'hardware-node')
        .attr('transform', (d: HardwareNode) => {
          const coords = d.coordinates || [0, 0];
          const [x, y] = projection(coords) || [0, 0];
          return `translate(${x}, ${y})`;
        });

      // Pulse ring for warning/online nodes
      nodeGroups.append('circle')
        .attr('r', 12)
        .attr('fill', (d: HardwareNode) => d.status === 'ONLINE' ? '#10b981' : d.status === 'WARNING' ? '#f59e0b' : '#64748b')
        .attr('opacity', 0.25)
        .attr('class', (d: HardwareNode) => d.status !== 'OFFLINE' ? 'animate-ping origin-center' : '');

      // Core dot
      nodeGroups.append('circle')
        .attr('r', 5.5)
        .attr('fill', (d: HardwareNode) => d.status === 'ONLINE' ? '#10b981' : d.status === 'WARNING' ? '#f59e0b' : '#64748b')
        .attr('stroke', '#030712')
        .attr('stroke-width', 1.5)
        .style('cursor', 'pointer')
        .on('mouseenter', (event, d: HardwareNode) => {
          const [x, y] = d3.pointer(event, svgRef.current);
          setTooltip({ x, y, node: d });
        })
        .on('mouseleave', () => {
          setTooltip({ x: 0, y: 0, node: null });
        })
        .on('click', (event, d: HardwareNode) => {
          setSelectedNode(d);
          setActiveModalTab('SPECS');
          setTooltip({ x: 0, y: 0, node: null });
        });

      // Label with monospace coordinate badge
      nodeGroups.append('text')
        .attr('x', 9)
        .attr('y', 3.5)
        .text((d: HardwareNode) => d.id)
        .attr('fill', '#94a3b8')
        .attr('font-size', '8.5px')
        .attr('font-family', 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace')
        .attr('font-weight', '600')
        .attr('class', 'pointer-events-none drop-shadow-md select-none');

    }).catch(err => {
      console.error('Failed to load World GeoJSON map:', err);
    });

  }, [filteredNodes]);

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Top Header & Regional Filter Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between glass p-4 gap-3 shrink-0">
        <div>
          <h2 className="text-sm uppercase tracking-widest text-emerald-400 font-bold mb-1 flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-400" />
            Global Telemetry & Agronomy Network
          </h2>
          <p className="text-xs text-slate-400">
            Geographically distributed Eden II Edge Nodes & In-Situ Agronomy Soil Baselines.
          </p>
        </div>

        {/* Global Filter & Status Counters */}
        <div className="flex flex-wrap items-center gap-4 text-[10px] uppercase font-bold tracking-widest text-slate-400">
          <div className="flex items-center gap-1.5 bg-slate-900/60 px-2.5 py-1 rounded border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> 
            Online ({onlineCount})
          </div>
          <div className="flex items-center gap-1.5 bg-slate-900/60 px-2.5 py-1 rounded border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span> 
            Warning ({warningCount})
          </div>
          <div className="flex items-center gap-1.5 bg-slate-900/60 px-2.5 py-1 rounded border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-slate-500"></span> 
            Offline ({offlineCount})
          </div>
        </div>
      </div>

      {/* Region Cluster Switcher */}
      <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 text-xs">
        <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold shrink-0 mr-1 flex items-center gap-1">
          <Compass className="w-3.5 h-3.5" /> Region:
        </span>
        {GLOBAL_REGIONS.map(reg => (
          <button
            key={reg.id}
            onClick={() => setSelectedRegion(reg.id)}
            className={`px-3 py-1 rounded whitespace-nowrap text-xs transition-colors font-medium border ${
              selectedRegion === reg.id
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                : 'bg-slate-900/50 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            {reg.name} <span className="text-[10px] opacity-70 ml-1">({reg.nodeCount})</span>
          </button>
        ))}
      </div>

      {/* Map Canvas */}
      <div className="flex-1 glass rounded-xl overflow-hidden relative min-h-[420px]" ref={containerRef}>
        <div className="absolute top-4 left-4 z-10 pointer-events-none">
          <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1.5 font-bold">Network Topology</div>
          <div className="flex flex-col gap-1.5">
            <div className="bg-slate-900/80 backdrop-blur border border-slate-700/70 rounded px-3 py-1 text-[11px] text-slate-300 font-medium border-l-2 border-l-emerald-500">
              VCM Soil Telemetry Grid
            </div>
            <div className="bg-slate-900/60 backdrop-blur border border-slate-800 rounded px-3 py-1 text-[11px] text-slate-400">
              Active Nodes: {filteredNodes.length}
            </div>
          </div>
        </div>

        <svg ref={svgRef} className="w-full h-full bg-[#030611]" />

        {/* Hover Tooltip */}
        {tooltip.node && (
          <div 
            className="absolute z-20 glass p-3 border border-slate-700 shadow-2xl pointer-events-none transform -translate-x-1/2 -translate-y-[115%]"
            style={{ left: tooltip.x, top: tooltip.y, minWidth: '220px' }}
          >
            <div className="flex items-center justify-between mb-1.5 pb-1.5 border-b border-slate-800">
              <span className="text-[10px] font-bold text-slate-200 uppercase tracking-widest font-mono">
                {tooltip.node.id}
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border ${
                tooltip.node.status === 'ONLINE' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' :
                tooltip.node.status === 'WARNING' ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' : 
                'text-slate-400 border-slate-700 bg-slate-800/40'
              }`}>
                {tooltip.node.status}
              </span>
            </div>

            <div className="text-xs font-medium text-slate-200 mb-0.5">{tooltip.node.name}</div>
            <div className="text-[10px] text-emerald-400/90 mb-2.5 flex items-center gap-1">
              <Sprout className="w-3 h-3" /> {tooltip.node.cropFocus || 'Precision Agriculture'}
            </div>
            
            {tooltip.node.metrics ? (
              <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono bg-slate-950/60 p-1.5 rounded border border-slate-800">
                <div className="flex flex-col">
                  <span className="text-slate-500 text-[9px]">pH</span>
                  <span className="text-emerald-400 font-bold">{tooltip.node.metrics.ph.toFixed(1)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-500 text-[9px]">PRES</span>
                  <span className="text-purple-400 font-bold">{tooltip.node.metrics.pressure} <span className="text-[7px]">BAR</span></span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-500 text-[9px]">TEMP</span>
                  <span className="text-amber-400 font-bold">{tooltip.node.metrics.temp}°C</span>
                </div>
              </div>
            ) : (
              <div className="text-[10px] text-slate-600 uppercase tracking-widest font-mono">
                Telemetry Inactive
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected Node Detailed Modal / Drawer */}
      {selectedNode && selectedNodeBundle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030611]/85 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="glass w-full max-w-3xl flex flex-col border border-slate-700/80 shadow-2xl rounded-xl overflow-hidden max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-slate-900/60">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg border ${
                  selectedNode.status === 'ONLINE' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 
                  selectedNode.status === 'WARNING' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 
                  'bg-slate-800/40 border-slate-700 text-slate-400'
                }`}>
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-widest text-slate-100 uppercase font-mono flex items-center gap-2">
                    {selectedNode.id}
                    <span className={`text-[9px] px-1.5 py-0.5 rounded border font-sans ${
                      selectedNode.status === 'ONLINE' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : 
                      selectedNode.status === 'WARNING' ? 'border-amber-500/30 text-amber-400 bg-amber-500/10' : 
                      'border-slate-700 text-slate-400 bg-slate-800/40'
                    }`}>
                      {selectedNode.status}
                    </span>
                  </h3>
                  <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>{selectedNode.name}</span>
                    <span>•</span>
                    <span className="text-slate-400 font-mono text-[11px]">{selectedNode.country} ({selectedNode.region})</span>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => setSelectedNode(null)} 
                className="text-slate-400 hover:text-white transition-colors p-1.5 hover:bg-white/5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex items-center border-b border-slate-800 bg-slate-950/50 px-4">
              <button
                onClick={() => setActiveModalTab('SPECS')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
                  activeModalTab === 'SPECS'
                    ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" /> Hardware Specs
              </button>
              
              <button
                onClick={() => setActiveModalTab('AGRONOMY')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
                  activeModalTab === 'AGRONOMY'
                    ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sprout className="w-3.5 h-3.5 text-emerald-400" /> Agronomy Soil Profile
              </button>

              <button
                onClick={() => setActiveModalTab('LOGS')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
                  activeModalTab === 'LOGS'
                    ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" /> Execution Logs
              </button>
            </div>

            {/* Modal Tab Contents */}
            <div className="p-5 overflow-y-auto custom-scrollbar bg-[#080d1a]/60 space-y-4">
              
              {/* TAB 1: SPECS */}
              {activeModalTab === 'SPECS' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3 bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                    <h4 className="text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-800 pb-2">
                      Core Hardware Telemetry
                    </h4>
                    <div className="space-y-2.5 text-xs">
                      <div className="flex items-start gap-3">
                        <Cpu className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-[10px] text-slate-500 uppercase tracking-widest">Compute Architecture</div>
                          <div className="text-slate-200 font-medium">{selectedNode.specs?.mcu || 'ARM Cortex-M7 (480MHz)'}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Terminal className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-[10px] text-slate-500 uppercase tracking-widest">Firmware Package</div>
                          <div className="text-slate-200 font-mono text-[11px]">{selectedNode.specs?.firmware || selectedNode.firmwareVer}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Wifi className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-[10px] text-slate-500 uppercase tracking-widest">Network Uplink</div>
                          <div className="text-slate-200">{selectedNode.specs?.network || 'Cellular / Satellite Mesh'}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-[10px] text-slate-500 uppercase tracking-widest">Power Subsystem</div>
                          <div className="text-slate-200">{selectedNode.specs?.power || 'Solar 400W + LiFePO4'}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                    <h4 className="text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-800 pb-2">
                      Geographic & Crop Metadata
                    </h4>
                    <div className="space-y-2.5 text-xs">
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest">Crop Focus</div>
                        <div className="text-emerald-400 font-medium flex items-center gap-1.5 mt-0.5">
                          <Sprout className="w-3.5 h-3.5" />
                          {selectedNode.cropFocus || 'Diversified Crops'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest">Coordinates & Elevation</div>
                        <div className="text-slate-200 font-mono text-[11px] mt-0.5">
                          {selectedNode.coordinates ? `Lon: ${selectedNode.coordinates[0]}, Lat: ${selectedNode.coordinates[1]}` : 'N/A'}
                          {selectedNode.elevationMeters !== undefined && ` • ${selectedNode.elevationMeters}m MSL`}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest">Associated Operator / Coop</div>
                        <div className="text-slate-200 font-medium mt-0.5">{selectedNodeBundle.user.name}</div>
                        <div className="text-[11px] text-slate-400">{selectedNodeBundle.user.location}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: AGRONOMY PROFILE */}
              {activeModalTab === 'AGRONOMY' && selectedNodeBundle.agronomyProfile && (
                <div className="space-y-4">
                  {/* Summary Banner */}
                  <div className="bg-emerald-950/30 border border-emerald-500/30 p-3.5 rounded-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">
                        FAO World Reference Soil Base
                      </div>
                      <div className="text-sm font-bold text-slate-100 mt-0.5">
                        {selectedNodeBundle.agronomyProfile.faoClassification}
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono bg-slate-900/80 px-2.5 py-1 rounded border border-slate-800">
                      Source: {selectedNodeBundle.agronomyProfile.source}
                    </div>
                  </div>

                  {/* Physicochemical Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest block">pH Baseline</span>
                      <span className="text-lg font-bold text-emerald-400 font-mono">
                        {selectedNodeBundle.agronomyProfile.phBaseline.toFixed(1)}
                      </span>
                      <span className="text-[9px] text-slate-500 block">Optimal: 6.0 - 7.5</span>
                    </div>

                    <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest block">CEC Capacity</span>
                      <span className="text-lg font-bold text-purple-400 font-mono">
                        {selectedNodeBundle.agronomyProfile.cecRatio.toFixed(1)}
                      </span>
                      <span className="text-[9px] text-slate-500 block">cmol(+)/kg</span>
                    </div>

                    <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest block">Soil Moisture</span>
                      <span className="text-lg font-bold text-blue-400 font-mono">
                        {selectedNodeBundle.agronomyProfile.soilMoistureIndex.toFixed(1)}%
                      </span>
                      <span className="text-[9px] text-slate-500 block">In-situ volumetric</span>
                    </div>

                    <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest block">Conductivity (EC)</span>
                      <span className="text-lg font-bold text-amber-400 font-mono">
                        {selectedNodeBundle.agronomyProfile.electricalConductivity.toFixed(2)}
                      </span>
                      <span className="text-[9px] text-slate-500 block">dS/m (Salinity)</span>
                    </div>
                  </div>

                  {/* Soil Composition & Nutrients Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Texture Composition */}
                    <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800 space-y-3">
                      <h5 className="text-[10px] uppercase tracking-widest text-slate-400 font-bold flex items-center justify-between border-b border-slate-800 pb-2">
                        <span>Soil Texture Composition</span>
                        <span className="font-mono text-slate-500">BD: {selectedNodeBundle.agronomyProfile.bulkDensity} g/cm³</span>
                      </h5>
                      <div className="space-y-2 text-xs">
                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-slate-400">Sand</span>
                            <span className="font-mono text-slate-200">{selectedNodeBundle.agronomyProfile.soilComposition.sand}%</span>
                          </div>
                          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500" style={{ width: `${selectedNodeBundle.agronomyProfile.soilComposition.sand}%` }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-slate-400">Silt</span>
                            <span className="font-mono text-slate-200">{selectedNodeBundle.agronomyProfile.soilComposition.silt}%</span>
                          </div>
                          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-400" style={{ width: `${selectedNodeBundle.agronomyProfile.soilComposition.silt}%` }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-slate-400">Clay</span>
                            <span className="font-mono text-slate-200">{selectedNodeBundle.agronomyProfile.soilComposition.clay}%</span>
                          </div>
                          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-400" style={{ width: `${selectedNodeBundle.agronomyProfile.soilComposition.clay}%` }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-slate-400">Soil Organic Carbon (SOC)</span>
                            <span className="font-mono text-emerald-400 font-bold">{selectedNodeBundle.agronomyProfile.soilComposition.organicCarbon}%</span>
                          </div>
                          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, selectedNodeBundle.agronomyProfile.soilComposition.organicCarbon * 10)}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Primary Macronutrients (NPK) */}
                    <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800 space-y-3">
                      <h5 className="text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-800 pb-2">
                        Macronutrient Dynamics (NPK)
                      </h5>
                      <div className="grid grid-cols-3 gap-2 text-center pt-2">
                        <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800">
                          <span className="text-[10px] font-bold text-blue-400 uppercase">Nitrogen (N)</span>
                          <div className="text-base font-bold text-slate-100 font-mono mt-1">
                            {selectedNodeBundle.agronomyProfile.nutrients.nitrogen}
                          </div>
                          <span className="text-[8px] text-slate-500">mg / kg</span>
                        </div>

                        <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800">
                          <span className="text-[10px] font-bold text-amber-400 uppercase">Phosphorus (P)</span>
                          <div className="text-base font-bold text-slate-100 font-mono mt-1">
                            {selectedNodeBundle.agronomyProfile.nutrients.phosphorus}
                          </div>
                          <span className="text-[8px] text-slate-500">mg / kg</span>
                        </div>

                        <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800">
                          <span className="text-[10px] font-bold text-purple-400 uppercase">Potassium (K)</span>
                          <div className="text-base font-bold text-slate-100 font-mono mt-1">
                            {selectedNodeBundle.agronomyProfile.nutrients.potassium}
                          </div>
                          <span className="text-[8px] text-slate-500">mg / kg</span>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-400 bg-slate-950/40 p-2.5 rounded border border-slate-800/80 leading-relaxed">
                        Telemetry overlay is computing dynamic bio-char dosing based on NPK baseline and localized precipitation forecasts.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: LOGS */}
              {activeModalTab === 'LOGS' && (
                <div className="space-y-3 bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                  <h4 className="text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-800 pb-2">
                    Recent Edge Events & Sync Telemetry
                  </h4>
                  <div className="space-y-2 relative before:content-[''] before:absolute before:left-[9px] before:top-1 before:bottom-1 before:w-px before:bg-slate-800">
                    <div className="flex gap-3 relative">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0 ml-[6px] z-10" />
                      <div className="flex-1 text-xs">
                        <span className="text-[10px] text-slate-500 font-mono">14:32:05 • VCM</span>
                        <p className="text-slate-300">VCM Ingestion Hash verified. Block appended on decentralized ledger.</p>
                      </div>
                    </div>
                    <div className="flex gap-3 relative">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-1 shrink-0 ml-[6px] z-10" />
                      <div className="flex-1 text-xs">
                        <span className="text-[10px] text-slate-500 font-mono">14:30:12 • SYNC</span>
                        <p className="text-slate-300">Telemetry packet synced (42 samples). Soil baseline cache validated.</p>
                      </div>
                    </div>
                    <div className="flex gap-3 relative">
                      <div className="w-2 h-2 rounded-full bg-purple-500 mt-1 shrink-0 ml-[6px] z-10" />
                      <div className="flex-1 text-xs">
                        <span className="text-[10px] text-slate-500 font-mono">14:15:00 • DIAG</span>
                        <p className="text-slate-300">Continuous in-situ pH & CEC probe recalibration cycle passed.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Real-time Status Footer & MQTT Remote Control */}
            <div className="p-4 border-t border-slate-800 bg-[#050814] flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest block">Uptime</span>
                    <span className="text-xs font-bold text-slate-300 font-mono">{selectedNode.uptime}%</span>
                  </div>
                  <div className="h-5 w-px bg-slate-800" />
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest block">Network Status</span>
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Nominal
                    </span>
                  </div>
                </div>

                {commandStatus && (
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1.5 font-mono">
                    {isSending && <Loader2 className="w-3 h-3 animate-spin" />}
                    {commandStatus}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={() => sendCommand('SHUTDOWN')}
                  disabled={isSending}
                  className="flex-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-widest py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Power className="w-3.5 h-3.5" />
                  Shutdown Sequence
                </button>
                <button 
                  onClick={() => sendCommand('OVERRIDE')}
                  disabled={isSending}
                  className="flex-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-widest py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
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
