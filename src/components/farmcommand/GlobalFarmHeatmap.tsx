import React, { useState, useMemo, useCallback, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import {
  GoogleMap,
  useJsApiLoader,
  Circle,
  Marker,
  InfoWindow,
} from '@react-google-maps/api';
import {
  Layers,
  Radio,
  Wifi,
  Droplets,
  Activity,
  AlertTriangle,
  Sparkles,
  Zap,
  Sliders,
  RotateCcw,
  Maximize2,
  Minimize2,
  Info,
  CheckCircle2,
  Flame,
  Filter,
  Eye,
  EyeOff,
  Navigation,
  Compass
} from 'lucide-react';

// Error Boundary specifically to catch external script / Maps SDK rendering glitches
interface ErrorBoundaryProps {
  fallback: (error: Error) => ReactNode;
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class MapsErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('[GlobalFarmHeatmap] Google Maps component caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return this.props.fallback(this.state.error);
    }
    return this.props.children;
  }
}

// Required constant array outside component to prevent infinite re-renders with useJsApiLoader
const MAP_LIBRARIES: ('places' | 'geometry')[] = [];

// Custom Dark High-Contrast Industrial Map Style
// Hides POIs, transit labels, and darkens landmass to let neon telemetry glow
export const DARK_FARM_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#020617' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#38bdf8' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#064e3b' }, { opacity: 0.4 }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#1e293b' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#0f172a' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#64748b' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#334155' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#0f172a' }],
  },
  {
    featureType: 'transit',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#082f49' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#0284c7' }],
  },
];

// Telemetry Node Data Model
export interface LoRaWanNode {
  id: string;
  code: string;
  fieldZone: string;
  lat: number;
  lng: number;
  moisturePercent: number; // 0 - 100%
  nitrogenPpm: number;      // 0 - 120 PPM
  ph: number;               // 5.5 - 8.5
  temperatureC: number;     // Celsius
  ecDsM: number;            // Electrical conductivity
  batteryPercent: number;
  rssiDbm: number;
  status: 'OPTIMAL' | 'DRY_ALERT' | 'DOSING' | 'NITROGEN_DEFICIT';
  lastPacketSecAgo: number;
}

// Global Center: North 40 Agro-Ecological Test Field (Iowa / Midwest Corn Belt)
export const DEFAULT_MAP_CENTER = {
  lat: 41.8781,
  lng: -93.0977,
};

// High-Density LoRaWAN Soil Telemetry Grid
export const MOCK_LORAWAN_TELEMETRY_NODES: LoRaWanNode[] = [
  {
    id: 'node-01',
    code: 'NX-S101',
    fieldZone: 'Zone 1 (North Pivot)',
    lat: 41.8792,
    lng: -93.0991,
    moisturePercent: 44.5,
    nitrogenPpm: 58.2,
    ph: 6.8,
    temperatureC: 21.4,
    ecDsM: 1.42,
    batteryPercent: 94,
    rssiDbm: -72,
    status: 'OPTIMAL',
    lastPacketSecAgo: 4,
  },
  {
    id: 'node-02',
    code: 'NX-S102',
    fieldZone: 'Zone 1 (North Pivot Edge)',
    lat: 41.8788,
    lng: -93.0965,
    moisturePercent: 24.1,
    nitrogenPpm: 31.0,
    ph: 6.4,
    temperatureC: 24.8,
    ecDsM: 0.95,
    batteryPercent: 88,
    rssiDbm: -78,
    status: 'DRY_ALERT',
    lastPacketSecAgo: 9,
  },
  {
    id: 'node-03',
    code: 'NX-S103',
    fieldZone: 'Zone 2 (Fertigation Lateral A)',
    lat: 41.8765,
    lng: -93.0984,
    moisturePercent: 48.9,
    nitrogenPpm: 72.4,
    ph: 7.1,
    temperatureC: 20.9,
    ecDsM: 1.85,
    batteryPercent: 91,
    rssiDbm: -68,
    status: 'DOSING',
    lastPacketSecAgo: 2,
  },
  {
    id: 'node-04',
    code: 'NX-S104',
    fieldZone: 'Zone 2 (South Ridge)',
    lat: 41.8774,
    lng: -93.0948,
    moisturePercent: 42.0,
    nitrogenPpm: 46.8,
    ph: 6.7,
    temperatureC: 22.1,
    ecDsM: 1.35,
    batteryPercent: 79,
    rssiDbm: -84,
    status: 'OPTIMAL',
    lastPacketSecAgo: 14,
  },
  {
    id: 'node-05',
    code: 'NX-S105',
    fieldZone: 'Zone 3 (Drainage Basin)',
    lat: 41.8752,
    lng: -93.0968,
    moisturePercent: 52.4,
    nitrogenPpm: 64.0,
    ph: 6.9,
    temperatureC: 19.8,
    ecDsM: 1.62,
    batteryPercent: 96,
    rssiDbm: -65,
    status: 'OPTIMAL',
    lastPacketSecAgo: 6,
  },
  {
    id: 'node-06',
    code: 'NX-S106',
    fieldZone: 'Zone 3 (High Slope Basin)',
    lat: 41.8798,
    lng: -93.0942,
    moisturePercent: 26.3,
    nitrogenPpm: 28.5,
    ph: 6.2,
    temperatureC: 25.2,
    ecDsM: 0.88,
    batteryPercent: 82,
    rssiDbm: -89,
    status: 'DRY_ALERT',
    lastPacketSecAgo: 18,
  },
  {
    id: 'node-07',
    code: 'NX-S107',
    fieldZone: 'Zone 4 (East Trellis Plot)',
    lat: 41.8812,
    lng: -93.0975,
    moisturePercent: 39.8,
    nitrogenPpm: 22.1,
    ph: 6.3,
    temperatureC: 23.0,
    ecDsM: 0.74,
    batteryPercent: 85,
    rssiDbm: -76,
    status: 'NITROGEN_DEFICIT',
    lastPacketSecAgo: 11,
  },
  {
    id: 'node-08',
    code: 'NX-S108',
    fieldZone: 'Zone 4 (Bio-Digestate Dosing Bed)',
    lat: 41.8745,
    lng: -93.1002,
    moisturePercent: 49.1,
    nitrogenPpm: 68.9,
    ph: 7.0,
    temperatureC: 21.0,
    ecDsM: 1.78,
    batteryPercent: 90,
    rssiDbm: -70,
    status: 'DOSING',
    lastPacketSecAgo: 3,
  },
];

// Custom NexusLIMS Heatmap Gradients
// Transitions smoothly between Emerald Green (Optimal), Amber Warning, and Crimson Red (Critical Alert)
const NEXUS_HEATMAP_GRADIENT = [
  'rgba(0, 0, 0, 0)',
  'rgba(6, 182, 212, 0.2)',    // Cyan low intensity
  'rgba(16, 185, 129, 0.5)',   // Emerald green optimal
  'rgba(16, 185, 129, 0.85)',  // Deep emerald
  'rgba(234, 179, 8, 0.9)',    // Yellow transition
  'rgba(245, 158, 11, 0.95)',  // Amber Alert
  'rgba(239, 68, 68, 1)',      // Crimson High Alert
];

export type TelemetryMetric = 'MOISTURE' | 'NITROGEN' | 'PH' | 'TEMPERATURE';

export interface GlobalFarmHeatmapProps {
  apiKey?: string;
  height?: string;
  onNodeSelect?: (node: LoRaWanNode) => void;
  className?: string;
}

export const GlobalFarmHeatmap: React.FC<GlobalFarmHeatmapProps> = ({
  apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyB4jn38fJmOhWWxt2bGsjwf_rydKxsrf1w',
  height = '520px',
  onNodeSelect,
  className = '',
}) => {
  // 1. Google Maps JS API Loader with 'visualization' library
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-nexus-script',
    googleMapsApiKey: apiKey,
    libraries: MAP_LIBRARIES,
  });

  // 2. Component State
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<TelemetryMetric>('MOISTURE');
  const [mapType, setMapType] = useState<google.maps.MapTypeId | 'hybrid' | 'roadmap' | 'satellite' | 'terrain'>('hybrid');
  const [heatmapRadius, setHeatmapRadius] = useState<number>(45);
  const [heatmapOpacity, setHeatmapOpacity] = useState<number>(0.85);
  const [isHeatmapVisible, setIsHeatmapVisible] = useState<boolean>(true);
  const [isNodesVisible, setIsNodesVisible] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ALERT' | 'DOSING' | 'OPTIMAL'>('ALL');
  const [selectedNode, setSelectedNode] = useState<LoRaWanNode | null>(null);
  const [nodes, setNodes] = useState<LoRaWanNode[]>(MOCK_LORAWAN_TELEMETRY_NODES);
  const [isLiveTelemetryActive, setIsLiveTelemetryActive] = useState<boolean>(true);
  const [lastBurstTime, setLastBurstTime] = useState<string>('Just now');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [hasAuthError, setHasAuthError] = useState<boolean>(false);

  // Catch gm_authFailure from Google Maps script gracefully
  useEffect(() => {
    const originalGmAuthFailure = (window as any).gm_authFailure;
    (window as any).gm_authFailure = () => {
      setHasAuthError(true);
      if (typeof originalGmAuthFailure === 'function') {
        originalGmAuthFailure();
      }
    };
    return () => {
      (window as any).gm_authFailure = originalGmAuthFailure;
    };
  }, []);

  // Filtered nodes based on status
  const filteredNodes = useMemo(() => {
    if (statusFilter === 'ALL') return nodes;
    if (statusFilter === 'ALERT') return nodes.filter(n => n.status === 'DRY_ALERT' || n.status === 'NITROGEN_DEFICIT');
    if (statusFilter === 'DOSING') return nodes.filter(n => n.status === 'DOSING');
    if (statusFilter === 'OPTIMAL') return nodes.filter(n => n.status === 'OPTIMAL');
    return nodes;
  }, [nodes, statusFilter]);

  // Transform LoRaWAN node telemetry into Google Maps WeightedLocations
  const heatmapData = useMemo(() => {
    if (
      !isLoaded ||
      typeof window === 'undefined' ||
      !window.google ||
      !window.google.maps ||
      typeof window.google.maps.LatLng !== 'function'
    ) {
      return [];
    }

    return filteredNodes.map((node) => {
      let weight = 1;
      if (selectedMetric === 'MOISTURE') {
        // Invert moisture so dry/deficit areas have higher heat intensity (Alert zone)
        weight = Math.max(1, 100 - node.moisturePercent);
      } else if (selectedMetric === 'NITROGEN') {
        weight = Math.max(1, node.nitrogenPpm);
      } else if (selectedMetric === 'PH') {
        // Deviation from neutral pH 7.0
        weight = Math.abs(node.ph - 7.0) * 40;
      } else if (selectedMetric === 'TEMPERATURE') {
        weight = Math.max(1, node.temperatureC * 3);
      }

      return {
        location: new window.google.maps.LatLng(node.lat, node.lng),
        weight: weight,
      };
    });
  }, [filteredNodes, selectedMetric, isLoaded]);

  // Simulate real-time LoRaWAN uplink pulse
  const triggerTelemetryBurst = useCallback(() => {
    setNodes((prev) =>
      prev.map((node) => {
        const deltaM = (Math.random() - 0.48) * 1.5;
        const deltaN = (Math.random() - 0.5) * 1.8;
        const newM = Math.max(18, Math.min(65, +(node.moisturePercent + deltaM).toFixed(1)));
        const newN = Math.max(15, Math.min(95, +(node.nitrogenPpm + deltaN).toFixed(1)));
        
        let newStatus = node.status;
        if (newM < 30) newStatus = 'DRY_ALERT';
        else if (newN < 25) newStatus = 'NITROGEN_DEFICIT';
        else if (node.status === 'DOSING') newStatus = 'DOSING';
        else newStatus = 'OPTIMAL';

        return {
          ...node,
          moisturePercent: newM,
          nitrogenPpm: newN,
          status: newStatus,
          lastPacketSecAgo: Math.floor(Math.random() * 4) + 1,
        };
      })
    );
    setLastBurstTime(new Date().toLocaleTimeString());
  }, []);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMapInstance(map);
  }, []);

  const handleCenterField = () => {
    if (mapInstance) {
      mapInstance.panTo(DEFAULT_MAP_CENTER);
      mapInstance.setZoom(16);
    }
  };

  const handleNodeClick = (node: LoRaWanNode) => {
    setSelectedNode(node);
    onNodeSelect?.(node);
  };

  // Dynamic Telemetry Color mapping for Heatmap rings
  const getNodeTelemetryColor = useCallback((node: LoRaWanNode, metric: TelemetryMetric) => {
    if (metric === 'MOISTURE') {
      if (node.moisturePercent < 30) return { fill: '#ef4444', stroke: '#f87171' }; // Dry Alert (Red)
      if (node.moisturePercent < 42) return { fill: '#f59e0b', stroke: '#fbbf24' }; // Moderate Deficit (Amber)
      return { fill: '#10b981', stroke: '#34d399' }; // Optimal (Emerald)
    }
    if (metric === 'NITROGEN') {
      if (node.nitrogenPpm < 25) return { fill: '#ef4444', stroke: '#f87171' };
      if (node.nitrogenPpm < 45) return { fill: '#f59e0b', stroke: '#fbbf24' };
      return { fill: '#06b6d4', stroke: '#38bdf8' }; // High Nitrogen (Cyan)
    }
    if (metric === 'PH') {
      const diff = Math.abs(node.ph - 6.8);
      if (diff > 0.8) return { fill: '#ec4899', stroke: '#f472b6' };
      if (diff > 0.4) return { fill: '#a855f7', stroke: '#c084fc' };
      return { fill: '#10b981', stroke: '#34d399' };
    }
    // Temperature
    if (node.temperatureC > 27) return { fill: '#f97316', stroke: '#fb923c' };
    return { fill: '#10b981', stroke: '#34d399' };
  }, []);

  // Custom SVG Marker Generator based on Status
  const getMarkerIcon = (node: LoRaWanNode): google.maps.Symbol | undefined => {
    if (
      !isLoaded ||
      typeof window === 'undefined' ||
      !window.google ||
      !window.google.maps ||
      !window.google.maps.SymbolPath
    ) {
      return undefined;
    }

    let fillColor = '#10b981'; // Optimal Emerald
    let strokeColor = '#34d399';
    let scale = 9;

    if (node.status === 'DRY_ALERT') {
      fillColor = '#f59e0b'; // Amber Alert
      strokeColor = '#fbbf24';
      scale = 10;
    } else if (node.status === 'NITROGEN_DEFICIT') {
      fillColor = '#ef4444'; // Red Deficit
      strokeColor = '#f87171';
      scale = 10;
    } else if (node.status === 'DOSING') {
      fillColor = '#a855f7'; // Purple Dosing
      strokeColor = '#c084fc';
      scale = 11;
    }

    return {
      path: window.google.maps.SymbolPath.CIRCLE,
      fillColor: fillColor,
      fillOpacity: 0.95,
      strokeColor: strokeColor,
      strokeWeight: 2.5,
      scale: scale,
    };
  };

  // Interactive Fallback GIS Canvas when Google Maps encounters external script / network / auth restrictions
  const renderFallbackGIS = (errorMessage?: string) => {
    return (
      <div className="relative w-full h-full bg-[#07131b] overflow-hidden flex flex-col items-center justify-center select-none">
        {/* Synthetic Satellite Topo Imagery Layer */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-luminosity scale-105"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, #064e3b 0%, #0f172a 70%, #020617 100%)`,
          }}
        />

        {/* Agricultural Grid & Contour Lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-60">
          <defs>
            <pattern id="gis-grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="2,2" />
            </pattern>
            {/* Heatmap blur filter */}
            <filter id="gis-heat-blur" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation={heatmapRadius / 3} />
            </filter>
            <radialGradient id="grad-optimal" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#10b981" stopOpacity={heatmapOpacity} />
              <stop offset="70%" stopColor="#059669" stopOpacity={heatmapOpacity * 0.4} />
              <stop offset="100%" stopColor="#064e3b" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="grad-alert" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity={heatmapOpacity} />
              <stop offset="60%" stopColor="#f59e0b" stopOpacity={heatmapOpacity * 0.5} />
              <stop offset="100%" stopColor="#7f1d1d" stopOpacity="0" />
            </radialGradient>
          </defs>

          <rect width="100%" height="100%" fill="url(#gis-grid-pattern)" />

          {/* Pivot Irrigation Crop Circles */}
          <circle cx="50%" cy="46%" r="160" fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="8,4" opacity="0.35" />
          <circle cx="50%" cy="46%" r="100" fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="4,4" opacity="0.25" />
          <circle cx="50%" cy="46%" r="40" fill="none" stroke="#10b981" strokeWidth="1" opacity="0.4" />

          {/* Dynamic Heatmap Blobs Overlay */}
          {isHeatmapVisible && (
            <g filter="url(#gis-heat-blur)">
              {filteredNodes.map((node, i) => {
                const x = 50 + (node.lng - DEFAULT_MAP_CENTER.lng) * 45000;
                const y = 46 - (node.lat - DEFAULT_MAP_CENTER.lat) * 45000;
                const isAlert = node.status === 'DRY_ALERT' || node.status === 'NITROGEN_DEFICIT';
                return (
                  <circle
                    key={`blob-${node.id}`}
                    cx={`${x}%`}
                    cy={`${y}%`}
                    r={heatmapRadius * 1.5}
                    fill={isAlert ? 'url(#grad-alert)' : 'url(#grad-optimal)'}
                  />
                );
              })}
            </g>
          )}
        </svg>

        {/* LoRaWAN Interactive Node Markers */}
        {isNodesVisible && (
          <div className="absolute inset-0 pointer-events-auto">
            {filteredNodes.map((node) => {
              const leftPercent = 50 + (node.lng - DEFAULT_MAP_CENTER.lng) * 45000;
              const topPercent = 46 - (node.lat - DEFAULT_MAP_CENTER.lat) * 45000;
              const isSelected = selectedNode?.id === node.id;

              return (
                <div
                  key={node.id}
                  onClick={() => handleNodeClick(node)}
                  style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20"
                >
                  <div className="relative flex items-center justify-center">
                    {/* Active pulse ring */}
                    <span
                      className={`absolute w-8 h-8 rounded-full animate-ping opacity-60 ${
                        node.status === 'DRY_ALERT'
                          ? 'bg-amber-500'
                          : node.status === 'NITROGEN_DEFICIT'
                          ? 'bg-rose-500'
                          : 'bg-emerald-500'
                      }`}
                    />

                    {/* Sensor Pin */}
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center border-2 shadow-2xl transition-transform transform group-hover:scale-125 ${
                        isSelected
                          ? 'scale-125 ring-4 ring-white/50'
                          : ''
                      } ${
                        node.status === 'DRY_ALERT'
                          ? 'bg-amber-950 border-amber-400 text-amber-300'
                          : node.status === 'NITROGEN_DEFICIT'
                          ? 'bg-rose-950 border-rose-400 text-rose-300'
                          : node.status === 'DOSING'
                          ? 'bg-purple-950 border-purple-400 text-purple-300'
                          : 'bg-emerald-950 border-emerald-400 text-emerald-300'
                      }`}
                    >
                      <Radio className="w-3.5 h-3.5 animate-pulse" />
                    </div>

                    {/* Floating Node Label */}
                    <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-slate-950/90 border border-slate-800 px-2 py-0.5 rounded text-[9px] font-mono font-bold text-slate-200 whitespace-nowrap shadow-lg group-hover:opacity-100 transition-opacity">
                      {node.code} · {selectedMetric === 'MOISTURE' ? `${node.moisturePercent}%` : `${node.nitrogenPpm} PPM`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Selected Node Inspector Window */}
        {selectedNode && (
          <div className="absolute top-6 right-6 z-30 bg-slate-950/95 text-slate-100 p-3.5 rounded-2xl border border-slate-700 shadow-2xl max-w-xs font-sans text-xs backdrop-blur-md animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  {selectedNode.code}
                </span>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-slate-400 hover:text-slate-200 p-0.5 rounded cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-[10px] text-slate-400 font-mono mb-2.5">
              {selectedNode.fieldZone}
            </p>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-slate-900/90 p-2.5 rounded-xl border border-slate-800/80">
              <div>
                <span className="text-slate-400 block text-[9px]">SOIL MOISTURE</span>
                <span
                  className={`font-extrabold text-sm ${
                    selectedNode.moisturePercent < 30 ? 'text-amber-400' : 'text-emerald-400'
                  }`}
                >
                  {selectedNode.moisturePercent}%
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[9px]">NITROGEN FLUX</span>
                <span className="font-extrabold text-sm text-cyan-300">
                  {selectedNode.nitrogenPpm} <span className="text-[9px]">PPM</span>
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[9px]">SOIL pH</span>
                <span className="font-extrabold text-slate-200">{selectedNode.ph.toFixed(1)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[9px]">SOIL TEMP</span>
                <span className="font-extrabold text-slate-200">{selectedNode.temperatureC}°C</span>
              </div>
            </div>

            <div className="mt-2.5 flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>Sync: {selectedNode.lastPacketSecAgo}s ago</span>
              <button
                onClick={() => onNodeSelect?.(selectedNode)}
                className="text-emerald-400 hover:text-emerald-300 font-bold underline cursor-pointer"
              >
                Dose Zone →
              </button>
            </div>
          </div>
        )}

        {/* Fallback Notice Badge */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono">
          <Compass className="w-3 h-3 text-emerald-400 animate-spin" />
          <span>GIS Vector Satellite Mesh (LoRaWAN Realtime)</span>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`relative w-full bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col font-sans transition-all duration-300 ${
        isFullscreen ? 'fixed inset-4 z-50 h-[calc(100vh-2rem)]' : ''
      } ${className}`}
      style={{ height: isFullscreen ? undefined : height }}
    >
      {/* 1. Header Toolbar & Real-Time Status HUD */}
      <div className="bg-slate-900/95 border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 z-10 backdrop-blur-md">
        {/* Left: Component Title & LoRaWAN Health */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-100 tracking-tight">
                Global Farm Telemetry Heatmap
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-950/80 border border-emerald-500/50 text-emerald-300">
                <Wifi className="w-2.5 h-2.5" /> 868/915 MHz LoRa Mesh
              </span>
            </div>
            <p className="text-[10px] font-mono text-slate-400">
              North 40 Iowa Test Plot · Live Soil Moisture & Nitrate Flux dMRV
            </p>
          </div>
        </div>

        {/* Center: Metric Selector & Heatmap Controls */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          {/* Metric Selector Tabs */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setSelectedMetric('MOISTURE')}
              className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedMetric === 'MOISTURE'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Droplets className="w-3 h-3" /> Moisture
            </button>
            <button
              onClick={() => setSelectedMetric('NITROGEN')}
              className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedMetric === 'NITROGEN'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3 h-3" /> Nitrate (NO3)
            </button>
            <button
              onClick={() => setSelectedMetric('PH')}
              className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedMetric === 'PH'
                  ? 'bg-purple-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3 h-3" /> Soil pH
            </button>
          </div>

          {/* Map Style Dropdown */}
          <select
            value={mapType}
            onChange={(e) => setMapType(e.target.value as any)}
            className="bg-slate-950 border border-slate-700 text-slate-200 text-xs py-1 px-2.5 rounded-xl font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="hybrid">🛰️ Satellite Hybrid</option>
            <option value="roadmap">🗺️ Dark Industrial Vector</option>
            <option value="terrain">⛰️ Topographic Terrain</option>
          </select>

          {/* Burst Uplink Button */}
          <button
            onClick={triggerTelemetryBurst}
            className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-mono text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
            title="Ingest simulated live LoRaWAN telemetry frame burst"
          >
            <Zap className="w-3 h-3 text-amber-400" /> Ping Nodes
          </button>

          {/* Reset Center */}
          <button
            onClick={handleCenterField}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 cursor-pointer transition-colors"
            title="Center Map on Farm Coordinates"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Toggle Fullscreen */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 cursor-pointer transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Expand Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 2. Google Map Canvas Container */}
      <div className="relative flex-1 w-full bg-slate-950">
        {hasAuthError || loadError ? (
          renderFallbackGIS(loadError?.message)
        ) : !isLoaded ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-slate-400 gap-3 p-6 text-center">
            <div className="w-10 h-10 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            <div className="font-mono text-xs font-semibold text-slate-300">
              Initializing Google Maps Satellite & LoRaWAN Visualization Layer...
            </div>
          </div>
        ) : (
          <MapsErrorBoundary fallback={(err) => renderFallbackGIS(err.message)}>
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={DEFAULT_MAP_CENTER}
              zoom={16}
              mapTypeId={mapType}
              onLoad={onMapLoad}
              options={{
                styles: mapType === 'roadmap' ? DARK_FARM_MAP_STYLES : undefined,
                disableDefaultUI: false,
                zoomControl: true,
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: false,
                tilt: 45,
              }}
            >
              {/* Dynamic LoRaWAN Soil Telemetry Heatmap Radial Zones */}
              {isHeatmapVisible &&
                filteredNodes.map((node) => {
                  const colors = getNodeTelemetryColor(node, selectedMetric);
                  const radiusMeters = heatmapRadius * 2.2;
                  return (
                    <React.Fragment key={`heatmap-zone-${node.id}`}>
                      {/* Outer ambient gradient halo */}
                      <Circle
                        center={{ lat: node.lat, lng: node.lng }}
                        radius={radiusMeters * 1.5}
                        options={{
                          fillColor: colors.fill,
                          fillOpacity: heatmapOpacity * 0.18,
                          strokeColor: colors.stroke,
                          strokeOpacity: heatmapOpacity * 0.35,
                          strokeWeight: 1,
                          clickable: false,
                        }}
                      />
                      {/* Core telemetry thermal zone */}
                      <Circle
                        center={{ lat: node.lat, lng: node.lng }}
                        radius={radiusMeters}
                        options={{
                          fillColor: colors.fill,
                          fillOpacity: heatmapOpacity * 0.45,
                          strokeColor: colors.stroke,
                          strokeOpacity: heatmapOpacity * 0.85,
                          strokeWeight: 2,
                          clickable: false,
                        }}
                      />
                    </React.Fragment>
                  );
                })}

              {/* Interactive LoRaWAN Sensor Node Markers */}
              {isNodesVisible &&
                filteredNodes.map((node) => (
                  <Marker
                    key={node.id}
                    position={{ lat: node.lat, lng: node.lng }}
                    icon={getMarkerIcon(node)}
                    title={`${node.code} (${node.fieldZone}) - Moisture: ${node.moisturePercent}%`}
                    onClick={() => handleNodeClick(node)}
                  />
                ))}

              {/* Custom Interactive InfoWindow for Active Node */}
              {selectedNode && (
                <InfoWindow
                  position={{ lat: selectedNode.lat, lng: selectedNode.lng }}
                  onCloseClick={() => setSelectedNode(null)}
                >
                  <div className="bg-slate-950 text-slate-100 p-3 rounded-xl border border-slate-800 shadow-2xl max-w-xs font-sans text-xs">
                    {/* Node Header */}
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                        <span className="font-mono font-bold text-emerald-400 text-sm">
                          {selectedNode.code}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${
                          selectedNode.status === 'OPTIMAL'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                            : selectedNode.status === 'DRY_ALERT'
                            ? 'bg-amber-950 text-amber-300 border border-amber-700'
                            : selectedNode.status === 'DOSING'
                            ? 'bg-purple-950 text-purple-300 border border-purple-700'
                            : 'bg-rose-950 text-rose-300 border border-rose-700'
                        }`}
                      >
                        {selectedNode.status.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-400 font-mono mb-2.5">
                      {selectedNode.fieldZone}
                    </p>

                    {/* Telemetry Metric Grid */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-slate-900/90 p-2.5 rounded-lg border border-slate-800/80">
                      <div>
                        <span className="text-slate-400 block text-[9px]">SOIL MOISTURE</span>
                        <span
                          className={`font-extrabold text-sm ${
                            selectedNode.moisturePercent < 30 ? 'text-amber-400' : 'text-emerald-400'
                          }`}
                        >
                          {selectedNode.moisturePercent}%
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px]">NITROGEN FLUX</span>
                        <span className="font-extrabold text-sm text-cyan-300">
                          {selectedNode.nitrogenPpm} <span className="text-[9px]">PPM</span>
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px]">SOIL pH</span>
                        <span className="font-extrabold text-slate-200">
                          {selectedNode.ph.toFixed(1)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px]">SOIL TEMP</span>
                        <span className="font-extrabold text-slate-200">
                          {selectedNode.temperatureC}°C
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px]">CONDUCTIVITY (EC)</span>
                        <span className="font-bold text-slate-300">
                          {selectedNode.ecDsM} dS/m
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px]">BATTERY / RSSI</span>
                        <span className="font-bold text-slate-300">
                          {selectedNode.batteryPercent}% · {selectedNode.rssiDbm}dBm
                        </span>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-2.5 flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>Sync: {selectedNode.lastPacketSecAgo}s ago</span>
                      <button
                        onClick={() => onNodeSelect?.(selectedNode)}
                        className="text-emerald-400 hover:text-emerald-300 font-bold underline cursor-pointer"
                      >
                        Dose Zone →
                      </button>
                    </div>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          </MapsErrorBoundary>
        )}

        {/* 3. Floating Bottom-Left HUD Control Layer */}
        <div className="absolute bottom-4 left-4 z-20 flex flex-col gap-2 bg-slate-950/90 backdrop-blur-md p-3 rounded-2xl border border-slate-800 shadow-2xl text-xs max-w-sm">
          {/* Layer Quick Toggles */}
          <div className="flex items-center justify-between gap-4 pb-2 border-b border-slate-800 text-[11px] font-mono">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                Heatmap Overlay:
              </span>
              <button
                onClick={() => setIsHeatmapVisible(!isHeatmapVisible)}
                className={`p-1 rounded-md text-xs transition-colors cursor-pointer ${
                  isHeatmapVisible ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500 hover:text-slate-300'
                }`}
                title="Toggle Heatmap Visibility"
              >
                {isHeatmapVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                Nodes:
              </span>
              <button
                onClick={() => setIsNodesVisible(!isNodesVisible)}
                className={`p-1 rounded-md text-xs transition-colors cursor-pointer ${
                  isNodesVisible ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500 hover:text-slate-300'
                }`}
                title="Toggle Sensor Nodes Pins"
              >
                {isNodesVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Sliders for Radius & Opacity */}
          {isHeatmapVisible && (
            <div className="space-y-2 pt-1 font-mono text-[10px]">
              <div className="flex items-center justify-between text-slate-400">
                <span>Kernel Radius ({heatmapRadius}px)</span>
                <input
                  type="range"
                  min="20"
                  max="90"
                  value={heatmapRadius}
                  onChange={(e) => setHeatmapRadius(Number(e.target.value))}
                  className="w-24 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Opacity ({Math.round(heatmapOpacity * 100)}%)</span>
                <input
                  type="range"
                  min="0.2"
                  max="1.0"
                  step="0.05"
                  value={heatmapOpacity}
                  onChange={(e) => setHeatmapOpacity(Number(e.target.value))}
                  className="w-24 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>
            </div>
          )}

          {/* Color Gradient Legend */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[9px] font-mono text-slate-400">
            <span className="text-emerald-400">Optimal ({selectedMetric === 'MOISTURE' ? '>40%' : '50+ PPM'})</span>
            <div className="w-20 h-2 rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500" />
            <span className="text-rose-400">Alert (Critical Deficit)</span>
          </div>
        </div>

        {/* 4. Floating Top-Right Mini Status Badge */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-[10px] font-mono shadow-xl text-slate-300 pointer-events-none">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>{filteredNodes.length} active nodes · Burst: {lastBurstTime}</span>
        </div>
      </div>
    </div>
  );
};

export default GlobalFarmHeatmap;
