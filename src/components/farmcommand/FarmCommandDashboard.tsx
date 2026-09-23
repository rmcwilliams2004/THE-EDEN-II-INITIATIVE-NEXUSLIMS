import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  User as UserIcon, 
  Thermometer, 
  Wind, 
  Droplets, 
  Layers, 
  Crosshair, 
  Plus, 
  Minus, 
  Target, 
  Activity, 
  Home, 
  Map as MapIcon, 
  BarChart3, 
  Settings as SettingsIcon,
  ChevronDown,
  Info,
  CheckCircle2,
  Check,
  Sparkles,
  SlidersHorizontal,
  Wifi,
  Sun,
  TrendingUp,
  AlertTriangle,
  Radio,
  Clock,
  Download,
  Filter,
  RefreshCw,
  Zap,
  ShieldCheck,
  Cpu,
  Save,
  Volume2,
  Play,
  RotateCcw,
  FileText
} from 'lucide-react';
import { SoilPhGauge } from './SoilPhGauge';
import { SmartAlertModal, SmartAlertItem, DEFAULT_ALERTS } from './SmartAlertModal';
import { AgriNewsTicker } from './AgriNewsTicker';
import { GlobalFarmHeatmap } from './GlobalFarmHeatmap';
import { useNavigation } from '../../context/NavigationContext';
import { useLanguage } from '../../context/LanguageContext';

interface SoilSensorNode {
  id: string;
  code: string;
  x: number; // percentage from left
  y: number; // percentage from top
  moisture: number; // %
  temp: number; // °F
  ph: number;
  nitrogenPpm: number;
  status: 'OPTIMAL' | 'DRY' | 'DOSING';
}

const INITIAL_SENSORS: SoilSensorNode[] = [
  { id: '1', code: 'S124', x: 28, y: 32, moisture: 44.2, temp: 68.4, ph: 6.8, nitrogenPpm: 48, status: 'OPTIMAL' },
  { id: '2', code: 'S118', x: 62, y: 24, moisture: 28.5, temp: 71.2, ph: 6.5, nitrogenPpm: 32, status: 'DRY' },
  { id: '3', code: 'S105', x: 45, y: 58, moisture: 48.0, temp: 67.9, ph: 6.9, nitrogenPpm: 56, status: 'DOSING' },
  { id: '4', code: 'S132', x: 78, y: 64, moisture: 42.1, temp: 69.0, ph: 6.7, nitrogenPpm: 45, status: 'OPTIMAL' },
  { id: '5', code: 'S109', x: 22, y: 74, moisture: 49.5, temp: 66.8, ph: 7.0, nitrogenPpm: 52, status: 'OPTIMAL' },
  { id: '6', code: 'S147', x: 55, y: 82, moisture: 29.8, temp: 72.0, ph: 6.4, nitrogenPpm: 30, status: 'DRY' },
];

interface FarmCommandDashboardProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export const FarmCommandDashboard: React.FC<FarmCommandDashboardProps> = ({ 
  activeTab: propActiveTab, 
  onTabChange: propOnTabChange 
}) => {
  // Central Navigation Context
  let contextNav: ReturnType<typeof useNavigation> | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    contextNav = useNavigation();
  } catch {
    contextNav = null;
  }

  const effectiveActiveTab = propActiveTab || contextNav?.activeTab || 'FARM_COMMAND';
  const effectiveOnTabChange = propOnTabChange || ((tab: string) => {
    if (contextNav) {
      contextNav.setActiveTab(tab as any);
    }
  });

  // Navigation & Control States
  const [selectedField, setSelectedField] = useState('North 40 Corn & Soy Plot');
  const [internalTab, setInternalTab] = useState<'HOME' | 'MAP' | 'ANALYTICS' | 'SETTINGS'>('HOME');

  // Synchronize internal state if effectiveActiveTab changes externally
  React.useEffect(() => {
    if (effectiveActiveTab === 'MAP' || effectiveActiveTab === 'ASSET_MAP') {
      setInternalTab('MAP');
    } else if (effectiveActiveTab === 'ANALYTICS') {
      setInternalTab('ANALYTICS');
    } else if (effectiveActiveTab === 'SETTINGS') {
      setInternalTab('SETTINGS');
    } else if (effectiveActiveTab === 'FARM_COMMAND' || effectiveActiveTab === 'HOME') {
      setInternalTab('HOME');
    }
  }, [effectiveActiveTab]);

  const activeBottomTab = internalTab;
  const { t, locale, localeProfile } = useLanguage();

  const handleTabClick = (tab: 'HOME' | 'MAP' | 'ANALYTICS' | 'SETTINGS') => {
    setInternalTab(tab);
    if (effectiveOnTabChange) {
      if (tab === 'HOME') effectiveOnTabChange('FARM_COMMAND');
      else if (tab === 'MAP') effectiveOnTabChange('MAP');
      else if (tab === 'ANALYTICS') effectiveOnTabChange('ANALYTICS');
      else if (tab === 'SETTINGS') effectiveOnTabChange('SETTINGS');
    }
  };

  const [activeLayer, setActiveLayer] = useState<'GIS_GOOGLE_MAPS' | 'HEATMAP' | 'TOPOGRAPHY' | 'SATELLITE'>('GIS_GOOGLE_MAPS');
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [showNodesLayer, setShowNodesLayer] = useState(true);
  const [showIrrigationLayer, setShowIrrigationLayer] = useState(true);
  const [showContoursLayer, setShowContoursLayer] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedSensor, setSelectedSensor] = useState<SoilSensorNode | null>(INITIAL_SENSORS[0]);
  const [activeZones, setActiveZones] = useState<number[]>([4, 7, 8]);
  const [flowRate, setFlowRate] = useState(125); // L/min

  // Interactive Settings States (initialized from localStorage if present)
  const [targetPh, setTargetPh] = useState(6.8);
  const [dosingIntervalMinutes, setDosingIntervalMinutes] = useState(45);
  const [autoDosingEnabled, setAutoDosingEnabled] = useState(true);
  const [loraTransmissionInterval, setLoraTransmissionInterval] = useState('30s');
  const [lowMoistureThreshold, setLowMoistureThreshold] = useState(30);

  // Load saved settings on mount
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem('nexus_farm_command_config');
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        if (parsed.targetPh !== undefined) setTargetPh(Number(parsed.targetPh));
        if (parsed.lowMoistureThreshold !== undefined) setLowMoistureThreshold(Number(parsed.lowMoistureThreshold));
        if (parsed.flowRate !== undefined) setFlowRate(Number(parsed.flowRate));
        if (parsed.autoDosingEnabled !== undefined) setAutoDosingEnabled(Boolean(parsed.autoDosingEnabled));
        if (parsed.loraTransmissionInterval !== undefined) setLoraTransmissionInterval(String(parsed.loraTransmissionInterval));
        if (parsed.dosingIntervalMinutes !== undefined) setDosingIntervalMinutes(Number(parsed.dosingIntervalMinutes));
      }
    } catch (e) {
      console.warn('Could not parse saved config', e);
    }
  }, []);

  // Smart Alert State
  const [alerts, setAlerts] = useState<SmartAlertItem[]>(() => {
    try {
      const savedAlerts = localStorage.getItem('nexus_farm_command_alerts');
      if (savedAlerts) {
        const parsed = JSON.parse(savedAlerts);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Could not parse saved alerts', e);
    }
    return DEFAULT_ALERTS;
  });

  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [alertDismissed, setAlertDismissed] = useState(false);

  // Dynamic Toast feedback system
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Sync alerts to localStorage
  const saveAlertsState = (newAlerts: SmartAlertItem[]) => {
    setAlerts(newAlerts);
    try {
      localStorage.setItem('nexus_farm_command_alerts', JSON.stringify(newAlerts));
    } catch (e) {
      console.warn('Could not save alerts', e);
    }
  };

  // Primary active alert for footer display
  const primaryAlert = alerts.find(a => a.status === 'SCHEDULED' || a.status === 'ACTION_REQUIRED') || alerts[0];
  const pendingAlertsCount = alerts.filter(a => a.status === 'SCHEDULED' || a.status === 'ACTION_REQUIRED').length;

  // 1. SAVE CONFIGURATION HANDLER
  const handleSaveConfiguration = () => {
    const configData = {
      targetPh,
      lowMoistureThreshold,
      flowRate,
      autoDosingEnabled,
      loraTransmissionInterval,
      dosingIntervalMinutes,
      field: selectedField,
      updatedAt: new Date().toISOString(),
      savedBy: 'Dr. Sarah Vance'
    };

    try {
      localStorage.setItem('nexus_farm_command_config', JSON.stringify(configData));
      showToast(`Configuration Saved: Target pH ${targetPh.toFixed(1)}, Low Moisture <${lowMoistureThreshold}%, Flow Rate ${flowRate} L/min synced to LoRaWAN gateway.`, 'success');
    } catch (e) {
      showToast('Error saving configuration to local state.', 'warning');
    }
  };

  // 2. RESET CONFIGURATION HANDLER
  const handleResetConfiguration = () => {
    setTargetPh(6.8);
    setLowMoistureThreshold(30);
    setFlowRate(125);
    setAutoDosingEnabled(true);
    setLoraTransmissionInterval('30s');
    setDosingIntervalMinutes(45);

    try {
      localStorage.removeItem('nexus_farm_command_config');
      showToast('Configuration restored to factory agronomic defaults (6.8 pH, 30% moisture trigger, 125 L/min).', 'info');
    } catch (e) {
      // ignore
    }
  };

  // 3. EXPORT CONFIGURATION JSON
  const handleExportConfigJson = () => {
    const configData = {
      product: 'NexusLIMS Farm Command',
      field: selectedField,
      calibration: {
        targetPh,
        lowMoistureThreshold,
        flowRate,
        autoDosingEnabled,
        loraTransmissionInterval,
        dosingIntervalMinutes
      },
      zones: activeZones,
      sensors: INITIAL_SENSORS,
      exportedAt: new Date().toISOString()
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(configData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `farm-command-config-${selectedField.toLowerCase().replace(/[^a-z0-9]/g, '-')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showToast('Exported Farm Command calibration profile (JSON).', 'success');
  };

  // 4. EXPORT TELEMETRY CSV
  const handleExportTelemetryCsv = () => {
    const headers = "Timestamp,Sensor_Code,Zone,Moisture_Pct,Temperature_F,pH,Nitrogen_PPM,Status\n";
    const now = new Date();
    const rows = INITIAL_SENSORS.map((s, idx) => {
      const timeStr = new Date(now.getTime() - idx * 15 * 60000).toISOString();
      const zoneNum = s.id === '1' ? 4 : s.id === '2' ? 7 : s.id === '3' ? 4 : s.id === '4' ? 8 : 7;
      return `${timeStr},${s.code},Zone ${zoneNum},${s.moisture},${s.temp},${s.ph},${s.nitrogenPpm},${s.status}`;
    }).join("\n");

    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(headers + rows);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", csvContent);
    downloadAnchor.setAttribute("download", `farm-command-telemetry-30d-${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showToast('Exported 30-day LoRaWAN sensor & fertigation telemetry (CSV).', 'success');
  };

  // 5. ALERT RESPONSE HANDLERS
  const handleExecuteNow = (alertId: string) => {
    const updated = alerts.map(a => {
      if (a.id === alertId) {
        return { ...a, status: 'EXECUTING' as const, executionProgress: 15 };
      }
      return a;
    });
    saveAlertsState(updated);
    showToast(`Dispatched fertigation pump sequence for #${alertId}.`, 'success');

    // Simulate progress
    let progress = 15;
    const interval = setInterval(() => {
      progress += 25;
      if (progress >= 100) {
        clearInterval(interval);
        setAlerts(prev => {
          const finished = prev.map(a => {
            if (a.id === alertId) {
              return { 
                ...a, 
                status: 'COMPLETED' as const, 
                executionProgress: 100,
                scheduledTime: `Completed at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
                timeRemaining: 'Executed'
              };
            }
            return a;
          });
          try {
            localStorage.setItem('nexus_farm_command_alerts', JSON.stringify(finished));
          } catch (e) {}
          return finished;
        });
        showToast(`Dosing cycle #${alertId} completed successfully. Injected solution across target zones.`, 'success');
      } else {
        setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, executionProgress: progress } : a));
      }
    }, 600);
  };

  const handleSnoozeAlert = (alertId: string, durationMinutes: number) => {
    const updated = alerts.map(a => {
      if (a.id === alertId) {
        return { 
          ...a, 
          status: 'SNOOZED' as const, 
          timeRemaining: `Snoozed +${durationMinutes}m`,
          scheduledTime: `Postponed (+${durationMinutes}m)`
        };
      }
      return a;
    });
    saveAlertsState(updated);
    showToast(`Alert #${alertId} snoozed by ${durationMinutes} minutes.`, 'info');
  };

  const handleDismissAlert = (alertId: string) => {
    const updated = alerts.map(a => {
      if (a.id === alertId) {
        return { ...a, status: 'DISMISSED' as const, timeRemaining: 'Dismissed' };
      }
      return a;
    });
    saveAlertsState(updated);
    showToast(`Alert #${alertId} dismissed.`, 'info');
  };

  const handleApproveAlert = (alertId: string) => {
    const updated = alerts.map(a => {
      if (a.id === alertId) {
        return { ...a, approvedBy: 'Dr. Sarah Vance (Verified)' };
      }
      return a;
    });
    saveAlertsState(updated);
    showToast(`Alert #${alertId} approved and locked into autonomous queue.`, 'success');
  };

  const handleUpdateAlert = (updatedAlert: SmartAlertItem) => {
    const updated = alerts.map(a => a.id === updatedAlert.id ? updatedAlert : a);
    saveAlertsState(updated);
  };

  const handleAddAlert = (newAlert: SmartAlertItem) => {
    const updated = [newAlert, ...alerts];
    saveAlertsState(updated);
  };

  // Interactive zoom handlers
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.2, 1.8));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.2, 0.8));
  const handleResetLocation = () => setZoomLevel(1);

  return (
    <div className="w-full bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col font-sans">
      
      {/* 1. Top Navigation & Sub-Header */}
      <header className="w-full bg-slate-900 border-b border-slate-800 px-5 py-3.5 flex flex-col gap-3">
        {/* Main Header Row */}
        <div className="flex items-center justify-between">
          {/* Left: Text "NexusLIMS Farm Command" */}
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              <span className="text-emerald-400 font-extrabold">NexusLIMS</span>{' '}
              <span className="text-slate-100 font-medium">Farm Command</span>
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
              <Wifi className="w-2.5 h-2.5" /> LoRaWAN Mesh Online
            </span>
          </div>

          {/* Right: Notification bell icon with red dot + User Profile icon */}
          <div className="flex items-center gap-3">
            {/* Bell Icon with Red Notification Dot */}
            <button 
              id="btn-farm-command-notifications"
              onClick={() => setIsAlertModalOpen(true)}
              className="relative p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors border border-slate-700/60 cursor-pointer"
              title="Smart Alert Management"
            >
              <Bell className="w-5 h-5 text-slate-200" />
              {pendingAlertsCount > 0 && (
                <>
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-slate-900 animate-pulse" />
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-emerald-500 text-[9px] font-bold text-slate-950 flex items-center justify-center">
                    {pendingAlertsCount}
                  </span>
                </>
              )}
            </button>

            {/* User Profile Icon with Green Circle Background */}
            <div className="flex items-center gap-2.5 pl-1 border-l border-slate-800">
              <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-emerald-950/50">
                <UserIcon className="w-5 h-5 text-slate-950" />
              </div>
              <div className="hidden md:block text-left text-xs">
                <div className="font-semibold text-slate-200">Dr. Sarah Vance</div>
                <div className="text-[10px] text-slate-400">Chief Agronomist</div>
              </div>
            </div>
          </div>
        </div>

        {/* Sub-Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2 border-t border-slate-800/60 text-xs">
          {/* Left: Field Selection Dropdown */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Field selection
            </span>
            <div className="relative inline-block w-full sm:w-72">
              <select
                id="field-selection-dropdown"
                value={selectedField}
                onChange={(e) => setSelectedField(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 py-1.5 px-3 pr-8 rounded-lg font-medium text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 appearance-none cursor-pointer"
              >
                <option value="North 40 Corn & Soy Plot">North 40 Corn & Soy Plot (160 Acres)</option>
                <option value="South Pivot - Winter Wheat">South Pivot - Winter Wheat (240 Acres)</option>
                <option value="East Orchard - Organic Almonds">East Orchard - Organic Almonds (80 Acres)</option>
                <option value="West Bio-DGA Test Quad">West Bio-DGA Test Quad (45 Acres)</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Right: Weather Telemetry Inline Row with Icons */}
          <div className="flex flex-col gap-1 md:items-end">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Weather telemetry
            </span>
            <div className="flex items-center gap-3 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-200 font-medium text-xs">
              <span className="flex items-center gap-1 text-amber-300">
                <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                74°F
              </span>
              <span className="text-slate-600">|</span>
              <span className="flex items-center gap-1 text-cyan-300">
                <Wind className="w-3.5 h-3.5 text-cyan-400" />
                12 mph Wind NW
              </span>
              <span className="text-slate-600">|</span>
              <span className="flex items-center gap-1 text-emerald-300">
                <Droplets className="w-3.5 h-3.5 text-emerald-400" />
                Soil Temp 68°F
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Main Content Grid - Changes dynamically based on Active Bottom Tab */}

      {/* VIEW 1: HOME (Dual Column: Map + Fertigation Controller) */}
      {activeBottomTab === 'HOME' && (
        <main className="p-4 sm:p-5 flex flex-col gap-5">
          {/* Real-time Regional Agronomic & Weather Advisory Ticker */}
          <AgriNewsTicker />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Left Column: Interactive Map Area (60% width -> 7 cols on lg screen) */}
            <section className="lg:col-span-7 flex flex-col rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden relative min-h-[400px] shadow-lg">
            
            {/* Top Floating Layer Selector Bar */}
            <div className="absolute top-3 left-3 z-30 flex items-center gap-1.5 bg-slate-950/90 backdrop-blur-md p-1 rounded-xl border border-slate-700/80 shadow-xl text-xs">
              <button
                id="btn-layer-gis-maps"
                onClick={() => setActiveLayer('GIS_GOOGLE_MAPS')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  activeLayer === 'GIS_GOOGLE_MAPS'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <MapIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span>GIS Satellite (Google Maps)</span>
              </button>
              <button
                id="btn-layer-heatmap"
                onClick={() => setActiveLayer('HEATMAP')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  activeLayer === 'HEATMAP'
                    ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Droplets className="w-3.5 h-3.5 text-emerald-400" />
                <span>2D Vector</span>
              </button>
              <button
                id="btn-layer-topography"
                onClick={() => setActiveLayer('TOPOGRAPHY')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  activeLayer === 'TOPOGRAPHY'
                    ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/50 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>Topography</span>
              </button>
              <button
                id="btn-layer-satellite"
                onClick={() => setActiveLayer('SATELLITE')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  activeLayer === 'SATELLITE'
                    ? 'bg-amber-500/25 text-amber-300 border border-amber-500/50 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>NDVI Optical</span>
              </button>
            </div>

            {/* Dynamic Map Canvas */}
            {activeLayer === 'GIS_GOOGLE_MAPS' ? (
              <div className="w-full h-full min-h-[420px] relative">
                <GlobalFarmHeatmap
                  height="100%"
                  onNodeSelect={(node) => {
                    const match = INITIAL_SENSORS.find(s => s.code.includes(node.code.replace('NX-', '')) || s.id === node.id.replace('node-0', ''));
                    if (match) setSelectedSensor(match);
                  }}
                />
              </div>
            ) : (
            <div 
              className={`relative w-full h-full min-h-[380px] overflow-hidden transition-all duration-500 ${
                activeLayer === 'HEATMAP' ? 'bg-[#081712]' :
                activeLayer === 'TOPOGRAPHY' ? 'bg-[#07131e]' :
                'bg-[#0d170f]'
              }`}
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
            >
              {/* Topographic / Satellite / Heatmap Grid Texture */}
              <div className={`absolute inset-0 transition-opacity duration-500 ${
                activeLayer === 'HEATMAP' ? 'opacity-20 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]' :
                activeLayer === 'TOPOGRAPHY' ? 'opacity-25 bg-[linear-gradient(to_right,#0284c7_1px,transparent_1px),linear-gradient(to_bottom,#0284c7_1px,transparent_1px)] [background-size:24px_24px]' :
                'opacity-30 bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:20px_20px]'
              }`} />

              {/* ---------------- LAYER 1: HEATMAP (Moisture & Thermal Nutrients) ---------------- */}
              {activeLayer === 'HEATMAP' && (
                <>
                  {/* Satellite Terrain Contours */}
                  <svg className="absolute inset-0 w-full h-full opacity-35" preserveAspectRatio="none" viewBox="0 0 500 350">
                    <path d="M0,80 Q150,40 300,90 T500,60 L500,350 L0,350 Z" fill="#064e3b" />
                    <path d="M0,160 Q200,120 350,180 T500,150 L500,350 L0,350 Z" fill="#047857" />
                    <path d="M50,220 Q220,180 400,240 T500,210 L500,350 L50,350 Z" fill="#059669" />
                  </svg>

                  {/* Thermal Heat Map Zone Overlays */}
                  <div className="absolute top-[18%] left-[15%] w-[42%] h-[48%] rounded-full bg-emerald-500/30 blur-2xl filter pointer-events-none animate-pulse" style={{ animationDuration: '4s' }} />
                  <div className="absolute top-[12%] right-[10%] w-[35%] h-[38%] rounded-full bg-amber-500/35 blur-2xl filter pointer-events-none" />
                  <div className="absolute bottom-[20%] left-[32%] w-[38%] h-[44%] rounded-full bg-purple-600/35 blur-2xl filter pointer-events-none" />
                  <div className="absolute bottom-[8%] right-[18%] w-[28%] h-[30%] rounded-full bg-yellow-500/30 blur-xl filter pointer-events-none" />
                </>
              )}

              {/* ---------------- LAYER 2: TOPOGRAPHY (Elevation & Slope Contours) ---------------- */}
              {activeLayer === 'TOPOGRAPHY' && (
                <>
                  {/* Topographic Contour Lines SVG */}
                  <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 500 350">
                    <defs>
                      <linearGradient id="topoSlope" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#0284c7" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#0369a1" stopOpacity="0.05" />
                      </linearGradient>
                    </defs>
                    
                    {/* Slope gradient shading */}
                    <rect width="500" height="350" fill="url(#topoSlope)" />

                    {/* Major Elevation Contours */}
                    <path d="M0,40 C120,20 280,70 500,30" stroke="#38bdf8" strokeWidth="2" fill="none" opacity="0.8" />
                    <text x="60" y="32" fill="#7dd3fc" fontSize="10" fontFamily="monospace">880 FT</text>
                    <text x="340" y="48" fill="#7dd3fc" fontSize="10" fontFamily="monospace">880 FT</text>

                    <path d="M0,100 C150,60 300,120 500,80" stroke="#0ea5e9" strokeWidth="1.5" fill="none" opacity="0.7" />
                    <text x="180" y="82" fill="#38bdf8" fontSize="9" fontFamily="monospace">860 FT</text>

                    <path d="M0,160 C180,120 330,190 500,140" stroke="#0284c7" strokeWidth="2" fill="none" opacity="0.85" />
                    <text x="80" y="148" fill="#7dd3fc" fontSize="10" fontFamily="monospace">840 FT (RIDGE)</text>
                    <text x="380" y="160" fill="#7dd3fc" fontSize="10" fontFamily="monospace">840 FT</text>

                    <path d="M0,220 C140,190 320,250 500,200" stroke="#0369a1" strokeWidth="1.5" fill="none" opacity="0.7" />
                    <text x="240" y="218" fill="#38bdf8" fontSize="9" fontFamily="monospace">820 FT</text>

                    <path d="M0,280 C160,260 340,310 500,270" stroke="#075985" strokeWidth="2" fill="none" opacity="0.8" />
                    <text x="120" y="272" fill="#7dd3fc" fontSize="10" fontFamily="monospace">800 FT (VALLEY BASIN)</text>

                    {/* Minor intermediate isolines */}
                    <path d="M0,70 C130,40 290,95 500,55" stroke="#0284c7" strokeWidth="0.75" strokeDasharray="3 3" fill="none" opacity="0.5" />
                    <path d="M0,130 C160,90 315,155 500,110" stroke="#0284c7" strokeWidth="0.75" strokeDasharray="3 3" fill="none" opacity="0.5" />
                    <path d="M0,190 C160,155 325,220 500,170" stroke="#0284c7" strokeWidth="0.75" strokeDasharray="3 3" fill="none" opacity="0.5" />
                    <path d="M0,250 C150,225 330,280 500,235" stroke="#0284c7" strokeWidth="0.75" strokeDasharray="3 3" fill="none" opacity="0.5" />

                    {/* Drainage vectors */}
                    <line x1="250" y1="130" x2="270" y2="180" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#arrow)" opacity="0.6" strokeDasharray="4 2" />
                    <line x1="390" y1="150" x2="410" y2="210" stroke="#38bdf8" strokeWidth="1.5" opacity="0.6" strokeDasharray="4 2" />
                  </svg>
                </>
              )}

              {/* ---------------- LAYER 3: SATELLITE (NDVI True-Color & Parcel Grid) ---------------- */}
              {activeLayer === 'SATELLITE' && (
                <>
                  {/* High-res Simulated Satellite Imagery */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#1b341f] via-[#102416] to-[#0d1e12]" />
                  
                  {/* Agricultural crop furrow bands */}
                  <div className="absolute inset-0 opacity-40 bg-[repeating-linear-gradient(45deg,#22c55e_0px,#22c55e_2px,transparent_2px,transparent_14px)]" />
                  
                  {/* Center-pivot irrigation circles */}
                  <div className="absolute top-[20%] left-[20%] w-[180px] h-[180px] rounded-full border border-emerald-400/40 bg-emerald-600/15 pointer-events-none" />
                  <div className="absolute top-[35%] right-[15%] w-[130px] h-[130px] rounded-full border border-lime-400/40 bg-lime-500/15 pointer-events-none" />

                  {/* Satellite NDVI False-Color Heat Zones */}
                  <div className="absolute top-[25%] left-[25%] w-[120px] h-[120px] rounded-full bg-emerald-400/30 blur-xl filter pointer-events-none" />
                  <div className="absolute bottom-[18%] left-[45%] w-[140px] h-[90px] rounded-full bg-yellow-400/25 blur-lg filter pointer-events-none" />

                  {/* Satellite HUD metadata */}
                  <div className="absolute bottom-16 right-4 font-mono text-[9px] text-amber-300/80 bg-slate-950/80 px-2 py-1 rounded border border-amber-500/30">
                    LANDSAT-9 OLI-2 / NDVI RESOLUTION: 0.5m
                  </div>
                </>
              )}

              {/* Crop Boundary & Irrigation Vector Overlay (Common across layers if enabled) */}
              {showIrrigationLayer && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  {/* Field plot outlines */}
                  <polygon points="40,40 440,30 460,310 30,300" fill="none" stroke={activeLayer === 'TOPOGRAPHY' ? '#38bdf8' : activeLayer === 'SATELLITE' ? '#f59e0b' : '#10b981'} strokeWidth="1.5" strokeDasharray="4 4" className="opacity-60" />
                  {/* Zone 4, 7, 8 drip irrigation lateral line vectors */}
                  <path d="M 120,80 L 380,80 M 120,150 L 400,150 M 120,220 L 390,220" stroke="#06b6d4" strokeWidth="1.2" className="opacity-70" />
                </svg>
              )}

              {/* Soil Sensor Pin Icons */}
              {showNodesLayer && INITIAL_SENSORS.map((s) => {
                const isSelected = selectedSensor?.id === s.id;
                let pinBg = 'bg-emerald-500 text-slate-950 ring-emerald-400';
                if (s.status === 'DRY') pinBg = 'bg-amber-500 text-slate-950 ring-amber-400';
                if (s.status === 'DOSING') pinBg = 'bg-purple-500 text-white ring-purple-400';

                return (
                  <button
                    key={s.id}
                    id={`btn-sensor-pin-${s.id}`}
                    onClick={() => setSelectedSensor(s)}
                    style={{ left: `${s.x}%`, top: `${s.y}%` }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center transition-all duration-200 group cursor-pointer ${
                      isSelected ? 'scale-125 z-30' : 'hover:scale-115'
                    }`}
                    title={`${s.code} - ${s.status} (Moisture: ${s.moisture}%, pH: ${s.ph})`}
                  >
                    <div className={`w-7 h-7 rounded-full ${pinBg} font-mono font-extrabold text-[9px] flex items-center justify-center shadow-lg ring-2 ring-offset-2 ring-offset-slate-950 ${
                      s.status === 'DOSING' ? 'animate-pulse' : ''
                    }`}>
                      {s.code}
                    </div>
                    {/* Subtle pulsing radar ring on active dosing pin */}
                    {s.status === 'DOSING' && (
                      <span className="absolute w-10 h-10 rounded-full bg-purple-500/40 animate-ping pointer-events-none" />
                    )}
                  </button>
                );
              })}
            </div>
            )}

            {/* Map Controls (Right side of map, floating vertical button stack) */}
            {activeLayer !== 'GIS_GOOGLE_MAPS' && (
            <div className="absolute top-4 right-4 z-30 flex flex-col gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/80 shadow-2xl">
              <div className="relative">
                <button
                  id="btn-toggle-layers-popover"
                  onClick={() => setShowLayerMenu(!showLayerMenu)}
                  className={`p-2 rounded-lg transition-colors cursor-pointer ${
                    showLayerMenu 
                      ? 'bg-emerald-500 text-slate-950 font-bold' 
                      : 'hover:bg-slate-800 text-slate-300 hover:text-emerald-400'
                  }`}
                  title={`Toggle Layers Menu (Active: ${activeLayer})`}
                >
                  <Layers className="w-4 h-4" />
                </button>

                {/* Layer Menu Popover */}
                {showLayerMenu && (
                  <div className="absolute right-0 top-11 w-56 bg-slate-950/95 backdrop-blur-xl border border-slate-700 rounded-xl p-3 shadow-2xl z-40 text-xs flex flex-col gap-2.5">
                    <div className="font-bold text-slate-200 uppercase tracking-wider text-[10px] pb-1 border-b border-slate-800 flex items-center justify-between">
                      <span>Base GIS Layer</span>
                      <span className="text-emerald-400">{activeLayer}</span>
                    </div>

                    <div className="space-y-1">
                      <button
                        onClick={() => { setActiveLayer('GIS_GOOGLE_MAPS'); setShowLayerMenu(false); }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                          (activeLayer as string) === 'GIS_GOOGLE_MAPS' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <MapIcon className="w-3.5 h-3.5 text-emerald-400" />
                          GIS Google Maps Satellite
                        </span>
                        {(activeLayer as string) === 'GIS_GOOGLE_MAPS' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      </button>

                      <button
                        onClick={() => { setActiveLayer('HEATMAP'); setShowLayerMenu(false); }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                          activeLayer === 'HEATMAP' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Droplets className="w-3.5 h-3.5 text-emerald-400" />
                          Soil Moisture Heatmap (2D)
                        </span>
                        {activeLayer === 'HEATMAP' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      </button>

                      <button
                        onClick={() => { setActiveLayer('TOPOGRAPHY'); setShowLayerMenu(false); }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                          activeLayer === 'TOPOGRAPHY' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Activity className="w-3.5 h-3.5 text-cyan-400" />
                          Elevation Topography
                        </span>
                        {activeLayer === 'TOPOGRAPHY' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                      </button>

                      <button
                        onClick={() => { setActiveLayer('SATELLITE'); setShowLayerMenu(false); }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                          activeLayer === 'SATELLITE' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Layers className="w-3.5 h-3.5 text-amber-400" />
                          Satellite Optical (NDVI)
                        </span>
                        {activeLayer === 'SATELLITE' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                      </button>
                    </div>

                    <div className="pt-2 border-t border-slate-800 space-y-1.5">
                      <div className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Layer Overlays</div>
                      <label className="flex items-center gap-2 text-slate-300 text-[11px] cursor-pointer hover:text-white">
                        <input
                          type="checkbox"
                          checked={showNodesLayer}
                          onChange={(e) => setShowNodesLayer(e.target.checked)}
                          className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
                        />
                        <span>LoRaWAN Soil Nodes</span>
                      </label>
                      <label className="flex items-center gap-2 text-slate-300 text-[11px] cursor-pointer hover:text-white">
                        <input
                          type="checkbox"
                          checked={showIrrigationLayer}
                          onChange={(e) => setShowIrrigationLayer(e.target.checked)}
                          className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
                        />
                        <span>Irrigation Lateral Lines</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <button
                id="btn-center-map-location"
                onClick={handleResetLocation}
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-emerald-400 transition-colors cursor-pointer"
                title="Center Location"
              >
                <Crosshair className="w-4 h-4" />
              </button>
              <div className="w-full h-px bg-slate-800 my-0.5" />
              <button
                id="btn-zoom-in"
                onClick={handleZoomIn}
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-emerald-400 transition-colors cursor-pointer"
                title="Zoom In"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                id="btn-zoom-out"
                onClick={handleZoomOut}
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-emerald-400 transition-colors cursor-pointer"
                title="Zoom Out"
              >
                <Minus className="w-4 h-4" />
              </button>
            </div>
            )}

            {/* Dynamic Map Legend based on activeLayer */}
            {activeLayer !== 'GIS_GOOGLE_MAPS' && (
            <div className="absolute bottom-4 left-4 z-30 bg-slate-950/90 backdrop-blur-md p-3 rounded-xl border border-slate-800 shadow-2xl text-xs max-w-[280px]">
              {activeLayer === 'HEATMAP' && (
                <>
                  <div className="font-semibold text-slate-200 text-[11px] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Moisture & Nutrient Heatmap
                  </div>
                  <div className="space-y-1.5 text-[11px] text-slate-300">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block shrink-0 shadow-sm" />
                      <span>Optimal Soil Moisture (&gt;35%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-sm bg-amber-500 inline-block shrink-0 shadow-sm" />
                      <span>Deficit / Dry Alert (&lt;30%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-sm bg-purple-600 inline-block shrink-0 shadow-sm" />
                      <span>Active Fertigation Micro-dosing</span>
                    </div>
                  </div>
                </>
              )}

              {activeLayer === 'TOPOGRAPHY' && (
                <>
                  <div className="font-semibold text-cyan-300 text-[11px] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-cyan-400" />
                    Topographic Elevation & Slope
                  </div>
                  <div className="space-y-1.5 text-[11px] text-slate-300">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Lowland (800')</span>
                      <span>Ridge (880')</span>
                    </div>
                    <div className="h-2 w-full rounded bg-gradient-to-r from-sky-900 via-sky-600 to-sky-300" />
                    <div className="text-[10px] text-slate-400 pt-0.5">
                      Sub-meter LIDAR / 1.2% slope drainage NW
                    </div>
                  </div>
                </>
              )}

              {activeLayer === 'SATELLITE' && (
                <>
                  <div className="font-semibold text-amber-300 text-[11px] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    Landsat-9 Optical NDVI Index
                  </div>
                  <div className="space-y-1.5 text-[11px] text-slate-300">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Bare Soil (0.2)</span>
                      <span>Dense Crop (0.9)</span>
                    </div>
                    <div className="h-2 w-full rounded bg-gradient-to-r from-amber-700 via-yellow-500 to-emerald-500" />
                    <div className="text-[10px] text-slate-400 pt-0.5">
                      Vegetation canopy reflectance & biomass
                    </div>
                  </div>
                </>
              )}
            </div>
            )}
          </section>

          {/* Right Column: Fertigation Controller (40% width -> 5 cols on lg screen) */}
          <section className="lg:col-span-5 rounded-2xl bg-emerald-950/20 border border-emerald-800/50 p-4 sm:p-5 flex flex-col justify-between shadow-xl gap-4">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-emerald-800/40">
              <h2 className="text-sm sm:text-base font-bold text-emerald-400 tracking-wide flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-400" />
                Active Fertigation Controller
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-900/60 text-emerald-300 border border-emerald-700/60 font-bold">
                AUTO-LOOP ACTIVE
              </span>
            </div>

            {/* Current Feed Box: Nested Dark Box */}
            <div className="bg-slate-950/90 rounded-xl border border-slate-800 p-3.5 shadow-inner">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Dosing Prescription
              </div>
              <div className="text-xs sm:text-sm font-semibold text-slate-100">
                Current Feed: <span className="text-emerald-400 font-bold">Balanced NPK 12-4-8 + Calcium Buffer</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1 font-mono">
                Injected via Bio-DGA Micro-Intensifier #042
              </div>
            </div>

            {/* Live Soil pH Monitor with Semi-Circular Gauge */}
            <div className="bg-slate-950/70 rounded-xl border border-slate-800/80 p-3 flex flex-col items-center justify-center shadow-md">
              <SoilPhGauge
                value={targetPh}
                min={4.0}
                max={10.0}
                label="Live Soil pH monitor"
                statusText="(Neutralized)"
                id="live-soil-ph-gauge"
              />
            </div>

            {/* Footer Metrics (Two rows with small icons) */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              {/* Flow Rate */}
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 shrink-0">
                  <Activity className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="truncate">
                  <div className="text-[10px] uppercase font-semibold text-slate-400 truncate">Flow Rate</div>
                  <div className="text-xs sm:text-sm font-bold font-mono text-slate-100 truncate">
                    {flowRate} L/min
                  </div>
                </div>
              </div>

              {/* Active Zones */}
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 shrink-0">
                  <Target className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="truncate">
                  <div className="text-[10px] uppercase font-semibold text-slate-400 truncate">Active Zones</div>
                  <div className="text-xs sm:text-sm font-bold font-mono text-cyan-300 truncate">
                    Zones: {activeZones.join(', ')}
                  </div>
                </div>
              </div>
            </div>

          </section>

          </div>
        </main>
      )}

      {/* VIEW 2: MAP (Expanded Full-Screen Field Topography & Sensor Array) */}
      {activeBottomTab === 'MAP' && (
        <main className="p-4 sm:p-5 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div>
              <h2 className="text-base font-bold text-emerald-400 flex items-center gap-2">
                <MapIcon className="w-5 h-5" />
                Expanded Field GIS & Topographic Mesh — {selectedField}
              </h2>
              <p className="text-xs text-slate-400">
                Live 915 MHz LoRaWAN telemetry with sub-meter topographic soil conductivity layer.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="px-2.5 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                6 of 6 Nodes Online
              </span>
              <button 
                onClick={() => setSelectedSensor(INITIAL_SENSORS[0])}
                className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              >
                Reset Selection
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Map Canvas */}
            <div className="lg:col-span-2 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden relative h-[480px]">
              
              {/* Top Floating Layer Selector Bar */}
              <div className="absolute top-3 left-3 z-30 flex items-center gap-1.5 bg-slate-950/90 backdrop-blur-md p-1 rounded-xl border border-slate-700/80 shadow-xl text-xs">
                <button
                  id="btn-gis-layer-google-maps"
                  onClick={() => setActiveLayer('GIS_GOOGLE_MAPS')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    activeLayer === 'GIS_GOOGLE_MAPS'
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <MapIcon className="w-3.5 h-3.5 text-emerald-400" />
                  <span>GIS Satellite (Google Maps)</span>
                </button>
                <button
                  id="btn-gis-layer-heatmap"
                  onClick={() => setActiveLayer('HEATMAP')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    activeLayer === 'HEATMAP'
                      ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Droplets className="w-3.5 h-3.5 text-emerald-400" />
                  <span>2D Vector</span>
                </button>
                <button
                  id="btn-gis-layer-topography"
                  onClick={() => setActiveLayer('TOPOGRAPHY')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    activeLayer === 'TOPOGRAPHY'
                      ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/50 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Topography</span>
                </button>
                <button
                  id="btn-gis-layer-satellite"
                  onClick={() => setActiveLayer('SATELLITE')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    activeLayer === 'SATELLITE'
                      ? 'bg-amber-500/25 text-amber-300 border border-amber-500/50 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span>NDVI Optical</span>
                </button>
              </div>

              {activeLayer === 'GIS_GOOGLE_MAPS' ? (
                <div className="w-full h-full relative">
                  <GlobalFarmHeatmap
                    height="100%"
                    onNodeSelect={(node) => {
                      const match = INITIAL_SENSORS.find(s => s.code.includes(node.code.replace('NX-', '')) || s.id === node.id.replace('node-0', ''));
                      if (match) setSelectedSensor(match);
                    }}
                  />
                </div>
              ) : (
                <div 
                  className={`relative w-full h-full overflow-hidden transition-all duration-500 ${
                    activeLayer === 'HEATMAP' ? 'bg-[#081712]' :
                    activeLayer === 'TOPOGRAPHY' ? 'bg-[#07131e]' :
                    'bg-[#0d170f]'
                  }`}
                  style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
                >
                <div className={`absolute inset-0 transition-opacity duration-500 ${
                  activeLayer === 'HEATMAP' ? 'opacity-20 bg-[radial-gradient(#10b981_1.5px,transparent_1.5px)] [background-size:20px_20px]' :
                  activeLayer === 'TOPOGRAPHY' ? 'opacity-25 bg-[linear-gradient(to_right,#0284c7_1px,transparent_1px),linear-gradient(to_bottom,#0284c7_1px,transparent_1px)] [background-size:24px_24px]' :
                  'opacity-30 bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:20px_20px]'
                }`} />
                
                {/* ---------------- LAYER 1: HEATMAP ---------------- */}
                {activeLayer === 'HEATMAP' && (
                  <>
                    <svg className="absolute inset-0 w-full h-full opacity-35" preserveAspectRatio="none" viewBox="0 0 500 350">
                      <path d="M0,80 Q150,40 300,90 T500,60 L500,350 L0,350 Z" fill="#064e3b" />
                      <path d="M0,160 Q200,120 350,180 T500,150 L500,350 L0,350 Z" fill="#047857" />
                      <path d="M50,220 Q220,180 400,240 T500,210 L500,350 L50,350 Z" fill="#059669" />
                    </svg>

                    <div className="absolute top-[18%] left-[15%] w-[45%] h-[50%] rounded-full bg-emerald-500/30 blur-3xl filter animate-pulse" style={{ animationDuration: '4s' }} />
                    <div className="absolute top-[12%] right-[10%] w-[38%] h-[40%] rounded-full bg-amber-500/35 blur-3xl filter" />
                    <div className="absolute bottom-[20%] left-[32%] w-[40%] h-[45%] rounded-full bg-purple-600/35 blur-3xl filter" />
                    <div className="absolute bottom-[8%] right-[18%] w-[28%] h-[30%] rounded-full bg-yellow-500/30 blur-xl filter" />
                  </>
                )}

                {/* ---------------- LAYER 2: TOPOGRAPHY ---------------- */}
                {activeLayer === 'TOPOGRAPHY' && (
                  <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 500 350">
                    <defs>
                      <linearGradient id="gisTopoSlope" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#0284c7" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#0369a1" stopOpacity="0.05" />
                      </linearGradient>
                    </defs>
                    <rect width="500" height="350" fill="url(#gisTopoSlope)" />

                    <path d="M0,40 C120,20 280,70 500,30" stroke="#38bdf8" strokeWidth="2" fill="none" opacity="0.8" />
                    <text x="60" y="32" fill="#7dd3fc" fontSize="10" fontFamily="monospace">880 FT</text>
                    <text x="340" y="48" fill="#7dd3fc" fontSize="10" fontFamily="monospace">880 FT</text>

                    <path d="M0,100 C150,60 300,120 500,80" stroke="#0ea5e9" strokeWidth="1.5" fill="none" opacity="0.7" />
                    <text x="180" y="82" fill="#38bdf8" fontSize="9" fontFamily="monospace">860 FT</text>

                    <path d="M0,160 C180,120 330,190 500,140" stroke="#0284c7" strokeWidth="2" fill="none" opacity="0.85" />
                    <text x="80" y="148" fill="#7dd3fc" fontSize="10" fontFamily="monospace">840 FT (RIDGE)</text>
                    <text x="380" y="160" fill="#7dd3fc" fontSize="10" fontFamily="monospace">840 FT</text>

                    <path d="M0,220 C140,190 320,250 500,200" stroke="#0369a1" strokeWidth="1.5" fill="none" opacity="0.7" />
                    <text x="240" y="218" fill="#38bdf8" fontSize="9" fontFamily="monospace">820 FT</text>

                    <path d="M0,280 C160,260 340,310 500,270" stroke="#075985" strokeWidth="2" fill="none" opacity="0.8" />
                    <text x="120" y="272" fill="#7dd3fc" fontSize="10" fontFamily="monospace">800 FT (VALLEY BASIN)</text>
                  </svg>
                )}

                {/* ---------------- LAYER 3: SATELLITE ---------------- */}
                {activeLayer === 'SATELLITE' && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-br from-[#1b341f] via-[#102416] to-[#0d1e12]" />
                    <div className="absolute inset-0 opacity-40 bg-[repeating-linear-gradient(45deg,#22c55e_0px,#22c55e_2px,transparent_2px,transparent_14px)]" />
                    <div className="absolute top-[20%] left-[20%] w-[200px] h-[200px] rounded-full border border-emerald-400/40 bg-emerald-600/15 pointer-events-none" />
                    <div className="absolute top-[35%] right-[15%] w-[150px] h-[150px] rounded-full border border-lime-400/40 bg-lime-500/15 pointer-events-none" />
                    <div className="absolute top-[25%] left-[25%] w-[130px] h-[130px] rounded-full bg-emerald-400/30 blur-xl filter pointer-events-none" />
                    <div className="absolute bottom-[18%] left-[45%] w-[160px] h-[100px] rounded-full bg-yellow-400/25 blur-lg filter pointer-events-none" />
                  </>
                )}

                {/* Common parcel outline and irrigation vectors */}
                {showIrrigationLayer && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    <polygon points="40,40 440,30 460,310 30,300" fill="none" stroke={activeLayer === 'TOPOGRAPHY' ? '#38bdf8' : activeLayer === 'SATELLITE' ? '#f59e0b' : '#10b981'} strokeWidth="1.5" strokeDasharray="4 4" className="opacity-60" />
                    <path d="M 120,80 L 380,80 M 120,150 L 400,150 M 120,220 L 390,220" stroke="#06b6d4" strokeWidth="1.2" className="opacity-70" />
                  </svg>
                )}

                {/* Sensor Pins */}
                {showNodesLayer && INITIAL_SENSORS.map((s) => {
                  const isSelected = selectedSensor?.id === s.id;
                  let pinBg = 'bg-emerald-500 text-slate-950 ring-emerald-400';
                  if (s.status === 'DRY') pinBg = 'bg-amber-500 text-slate-950 ring-amber-400';
                  if (s.status === 'DOSING') pinBg = 'bg-purple-500 text-white ring-purple-400';

                  return (
                    <button
                      key={s.id}
                      id={`btn-gis-sensor-${s.id}`}
                      onClick={() => setSelectedSensor(s)}
                      style={{ left: `${s.x}%`, top: `${s.y}%` }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center transition-all duration-200 cursor-pointer ${
                        isSelected ? 'scale-135 z-30' : 'hover:scale-115'
                      }`}
                      title={`${s.code} - ${s.status} (Moisture: ${s.moisture}%)`}
                    >
                      <div className={`w-8 h-8 rounded-full ${pinBg} font-mono font-extrabold text-[10px] flex items-center justify-center shadow-2xl ring-2 ring-offset-2 ring-offset-slate-950`}>
                        {s.code}
                      </div>
                    </button>
                  );
                })}
              </div>
              )}

              {/* Floating Controls */}
              {activeLayer !== 'GIS_GOOGLE_MAPS' && (
              <div className="absolute top-4 right-4 z-30 flex flex-col gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/80 shadow-2xl">
                <button
                  id="btn-gis-toggle-layer"
                  onClick={() => setActiveLayer(l => l === 'GIS_GOOGLE_MAPS' ? 'HEATMAP' : l === 'HEATMAP' ? 'TOPOGRAPHY' : l === 'TOPOGRAPHY' ? 'SATELLITE' : 'GIS_GOOGLE_MAPS')}
                  className="p-2 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 rounded transition-colors cursor-pointer"
                  title={`Toggle Base Layer (Current: ${activeLayer})`}
                >
                  <Layers className="w-4 h-4" />
                </button>
                <button 
                  id="btn-gis-center"
                  onClick={handleResetLocation} 
                  className="p-2 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 rounded transition-colors cursor-pointer"
                  title="Center View"
                >
                  <Crosshair className="w-4 h-4" />
                </button>
                <div className="w-full h-px bg-slate-800 my-0.5" />
                <button 
                  id="btn-gis-zoom-in"
                  onClick={handleZoomIn} 
                  className="p-2 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 rounded transition-colors cursor-pointer"
                  title="Zoom In"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button 
                  id="btn-gis-zoom-out"
                  onClick={handleZoomOut} 
                  className="p-2 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 rounded transition-colors cursor-pointer"
                  title="Zoom Out"
                >
                  <Minus className="w-4 h-4" />
                </button>
              </div>
              )}

              {/* Dynamic Map Legend for GIS View */}
              {activeLayer !== 'GIS_GOOGLE_MAPS' && (
              <div className="absolute bottom-4 left-4 z-30 bg-slate-950/90 backdrop-blur-md p-3 rounded-xl border border-slate-800 shadow-2xl text-xs max-w-[280px]">
                {activeLayer === 'HEATMAP' && (
                  <>
                    <div className="font-semibold text-slate-200 text-[11px] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      Moisture & Nutrient Heatmap
                    </div>
                    <div className="space-y-1.5 text-[11px] text-slate-300">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block shrink-0 shadow-sm" />
                        <span>Optimal Moisture (&gt;35%)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-sm bg-amber-500 inline-block shrink-0 shadow-sm" />
                        <span>Dry Deficit (&lt;30%)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-sm bg-purple-600 inline-block shrink-0 shadow-sm" />
                        <span>Active Fertigation Zone</span>
                      </div>
                    </div>
                  </>
                )}

                {activeLayer === 'TOPOGRAPHY' && (
                  <>
                    <div className="font-semibold text-cyan-300 text-[11px] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-cyan-400" />
                      Topographic Elevation & Slope
                    </div>
                    <div className="space-y-1.5 text-[11px] text-slate-300">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>800' Valley</span>
                        <span>880' Ridge</span>
                      </div>
                      <div className="h-2 w-full rounded bg-gradient-to-r from-sky-900 via-sky-600 to-sky-300" />
                    </div>
                  </>
                )}

                {activeLayer === 'SATELLITE' && (
                  <>
                    <div className="font-semibold text-amber-300 text-[11px] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-amber-400" />
                      Landsat-9 Optical NDVI Index
                    </div>
                    <div className="space-y-1.5 text-[11px] text-slate-300">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>Bare (0.2)</span>
                        <span>Dense (0.9)</span>
                      </div>
                      <div className="h-2 w-full rounded bg-gradient-to-r from-amber-700 via-yellow-500 to-emerald-500" />
                    </div>
                  </>
                )}
              </div>
              )}
            </div>

            {/* Sensor Array Details List */}
            <div className="flex flex-col gap-3 h-[440px] overflow-y-auto custom-scrollbar">
              <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
                Soil Node Telemetry Stream
              </h3>
              {INITIAL_SENSORS.map((s) => {
                const isSelected = selectedSensor?.id === s.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedSensor(s)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-slate-800/90 border-emerald-500 shadow-md ring-1 ring-emerald-500/50' 
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm text-emerald-400">{s.code}</span>
                        <span className="text-[10px] font-mono text-slate-400">Zone {s.id}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono ${
                        s.status === 'OPTIMAL' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                        s.status === 'DRY' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                        'bg-purple-950 text-purple-300 border border-purple-800'
                      }`}>
                        {s.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                      <div>
                        <div className="text-[9px] text-slate-500">Moisture</div>
                        <div className="font-bold text-slate-200">{s.moisture}%</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-slate-500">Soil pH</div>
                        <div className="font-bold text-cyan-300">{s.ph}</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-slate-500">Nitrogen</div>
                        <div className="font-bold text-orange-300">{s.nitrogenPpm} PPM</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      )}

      {/* VIEW 3: ANALYTICS (Charts, Historical Dosing Trends, Agronomy Diagnostics) */}
      {activeBottomTab === 'ANALYTICS' && (
        <main className="p-4 sm:p-5 flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div>
              <h2 className="text-base font-bold text-emerald-400 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Agronomic Analytics & Fertigation Yield Diagnostics
              </h2>
              <p className="text-xs text-slate-400">
                Micro-dosing historical trendlines vs soil moisture replenishment coefficients.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleExportTelemetryCsv}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700 hover:border-slate-600"
                title="Download 30-day sensor telemetry as CSV"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" /> Export Data (.CSV)
              </button>
            </div>
          </div>

          {/* 3 Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="text-xs text-slate-400 mb-1">Avg 24h Soil pH</div>
              <div className="text-2xl font-mono font-black text-emerald-400">6.82 pH</div>
              <div className="text-[10px] text-emerald-500 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Target ±0.05 Buffer
              </div>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="text-xs text-slate-400 mb-1">Daily Nitrogen Micro-Injected</div>
              <div className="text-2xl font-mono font-black text-cyan-400">18.4 kg N</div>
              <div className="text-[10px] text-cyan-500 mt-1">
                100% bio-synthesized on-site
              </div>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="text-xs text-slate-400 mb-1">Water Runoff Reduction</div>
              <div className="text-2xl font-mono font-black text-purple-400">-42.8%</div>
              <div className="text-[10px] text-purple-400 mt-1">
                Pulse precision drip active
              </div>
            </div>
          </div>

          {/* Detailed Performance Table */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wider mb-3">
              Zone Performance Summary (Last 7 Days)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500">
                    <th className="pb-2">Zone</th>
                    <th className="pb-2">Crop Variety</th>
                    <th className="pb-2">Avg Moisture</th>
                    <th className="pb-2">Mean pH</th>
                    <th className="pb-2">Nutrient Delivery</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  <tr>
                    <td className="py-2.5 font-bold text-emerald-400">Zone 4 (North)</td>
                    <td>Pioneer 1197 YHR Corn</td>
                    <td>44.2%</td>
                    <td>6.8</td>
                    <td>142L (NPK 12-4-8)</td>
                    <td><span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px]">OPTIMAL</span></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-bold text-amber-400">Zone 7 (East)</td>
                    <td>Asgrow AG27XF1 Soy</td>
                    <td>28.5%</td>
                    <td>6.5</td>
                    <td>210L (Scheduled 05:00)</td>
                    <td><span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 text-[10px]">NEEDS DOSING</span></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-bold text-purple-400">Zone 8 (Center)</td>
                    <td>Pioneer 1197 YHR Corn</td>
                    <td>48.0%</td>
                    <td>6.9</td>
                    <td>98L (Active Injecting)</td>
                    <td><span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 text-[10px]">DOSING ACTIVE</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </main>
      )}

      {/* VIEW 4: SETTINGS (Fertigation Calibration, Thresholds, LoRaWAN Interval) */}
      {activeBottomTab === 'SETTINGS' && (
        <main className="p-4 sm:p-5 flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div>
              <h2 className="text-base font-bold text-emerald-400 flex items-center gap-2">
                <SettingsIcon className="w-5 h-5" />
                Farm Command Configuration & Calibration
              </h2>
              <p className="text-xs text-slate-400">
                Autonomous closed-loop fertigation thresholds and LoRaWAN mesh transceiver rules.
              </p>
            </div>
            
            {/* Save, Reset and Export Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleResetConfiguration}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
                title="Reset to agronomic defaults"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" /> Reset Defaults
              </button>
              <button
                onClick={handleExportConfigJson}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
                title="Export configuration JSON"
              >
                <FileText className="w-3.5 h-3.5 text-cyan-400" /> Export JSON
              </button>
              <button
                id="btn-save-configuration"
                onClick={handleSaveConfiguration}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-emerald-950/60 cursor-pointer active:scale-95"
              >
                <Save className="w-4 h-4" /> Save Configuration
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Dosing Controls */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-4">
              <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
                Fertigation Target Parameters
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-300">Target Soil pH Setpoint:</span>
                    <span className="font-mono font-bold text-emerald-400">{targetPh.toFixed(1)} pH</span>
                  </div>
                  <input
                    type="range"
                    min="5.5"
                    max="7.8"
                    step="0.1"
                    value={targetPh}
                    onChange={(e) => setTargetPh(parseFloat(e.target.value))}
                    className="w-full accent-emerald-500 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                    <span>5.5 Acidic</span>
                    <span>6.8 Neutral (Ideal)</span>
                    <span>7.8 Alkaline</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-300">Low Moisture Injection Trigger:</span>
                    <span className="font-mono font-bold text-amber-400">&lt; {lowMoistureThreshold}%</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="45"
                    step="1"
                    value={lowMoistureThreshold}
                    onChange={(e) => setLowMoistureThreshold(parseInt(e.target.value))}
                    className="w-full accent-amber-500 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                    <span>20% Wilting Point</span>
                    <span>30% Standard Trigger</span>
                    <span>45% Field Capacity</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-300">Dosing Injection Flow Rate:</span>
                    <span className="font-mono font-bold text-cyan-400">{flowRate} L/min</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="250"
                    step="5"
                    value={flowRate}
                    onChange={(e) => setFlowRate(parseInt(e.target.value))}
                    className="w-full accent-cyan-500 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                    <span>50 L/min (Micro-Pulse)</span>
                    <span>125 L/min (Standard)</span>
                    <span>250 L/min (High Capacity)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mesh & Autonomous Interlocks */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-4">
              <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Mesh Telemetry & SIL-3 Interlocks
              </h3>

              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div>
                    <div className="font-semibold text-slate-200">Autonomous Dosing Loop</div>
                    <div className="text-[10px] text-slate-500">Inject based on overnight telemetry</div>
                  </div>
                  <button
                    onClick={() => setAutoDosingEnabled(!autoDosingEnabled)}
                    className={`w-12 h-6 rounded-full transition-colors p-1 cursor-pointer flex items-center ${
                      autoDosingEnabled ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-slate-950 shadow-sm" />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div>
                    <div className="font-semibold text-slate-200">LoRaWAN Beacon Rate</div>
                    <div className="text-[10px] text-slate-500">Sensor packet transmit interval</div>
                  </div>
                  <select
                    value={loraTransmissionInterval}
                    onChange={(e) => setLoraTransmissionInterval(e.target.value)}
                    className="bg-slate-800 text-slate-200 border border-slate-700 rounded px-2 py-1 text-xs"
                  >
                    <option value="15s">15 Seconds (High Res)</option>
                    <option value="30s">30 Seconds (Default)</option>
                    <option value="60s">60 Seconds (Eco Mesh)</option>
                  </select>
                </div>

                <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-800/40 text-slate-300">
                  <div className="flex items-center gap-1.5 font-semibold text-emerald-300 mb-1 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Hardware Calibration Active
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Changes to target setpoints are saved to local persistent memory and transmitted automatically over encrypted 915 MHz LoRa mesh protocol.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* 3. Smart Alert Footer (Bottom): Wide, rounded rectangular banner spanning width */}
      {!alertDismissed && primaryAlert && (
        <div className="px-4 sm:px-5 pb-3">
          <div className={`w-full bg-white text-slate-900 rounded-xl p-3.5 sm:p-4 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-3 border ${
            primaryAlert.severity === 'WARNING' || primaryAlert.severity === 'CRITICAL'
              ? 'border-amber-400 bg-amber-50/90'
              : 'border-slate-200 bg-white'
          }`}>
            <div className="flex items-start sm:items-center gap-3">
              {/* Bell Icon with Red Dot */}
              <div className="relative shrink-0 p-2.5 rounded-xl bg-slate-100 text-slate-800 mt-0.5 sm:mt-0">
                <Bell className="w-5 h-5 text-slate-900" />
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white animate-ping" />
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white" />
              </div>

              {/* Text Content */}
              <div className="text-xs sm:text-sm leading-snug">
                <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                  <strong className="text-slate-950 font-black tracking-tight">
                    Smart Alert #{primaryAlert.id}:
                  </strong>
                  <span className="font-bold text-slate-900">{primaryAlert.title}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-200 text-slate-800">
                    {primaryAlert.scheduledTime}
                  </span>
                  {primaryAlert.timeRemaining && (
                    <span className="text-[11px] font-semibold text-emerald-700">
                      ({primaryAlert.timeRemaining})
                    </span>
                  )}
                </div>
                <div className="text-slate-700 text-xs">
                  {primaryAlert.summary}
                </div>
                {primaryAlert.executionProgress !== undefined && primaryAlert.status === 'EXECUTING' && (
                  <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-1.5 transition-all duration-300"
                      style={{ width: `${primaryAlert.executionProgress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons: Review & React, Execute Now, Dismiss */}
            <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
              {primaryAlert.status !== 'COMPLETED' && primaryAlert.status !== 'EXECUTING' && (
                <button
                  id="btn-alert-execute-now"
                  onClick={() => handleExecuteNow(primaryAlert.id)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs tracking-wide transition-all shadow-sm cursor-pointer flex items-center gap-1"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Execute Now
                </button>
              )}

              <button 
                id="btn-alert-review"
                onClick={() => setIsAlertModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs tracking-wide transition-colors shadow-sm cursor-pointer flex items-center gap-1"
              >
                <Clock className="w-3.5 h-3.5 text-emerald-400" /> Review & React ({pendingAlertsCount})
              </button>

              <button
                onClick={() => setAlertDismissed(true)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded transition-colors text-xs font-bold"
                title="Dismiss Banner"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Banner dismissed subtle restore indicator */}
      {alertDismissed && (
        <div className="px-5 pb-2 flex justify-end">
          <button 
            onClick={() => setAlertDismissed(false)}
            className="text-[11px] text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1 bg-slate-950/80 px-2.5 py-1 rounded-md border border-slate-800"
          >
            <Bell className="w-3 h-3" /> Show Smart Alert Banner ({pendingAlertsCount})
          </button>
        </div>
      )}

      {/* 4. Bottom Navigation Bar (Fixed bottom bar with four interactive tabs) */}
      <nav className="w-full bg-slate-950 border-t border-slate-800 px-6 py-2.5 flex items-center justify-around text-xs font-medium">
        {/* Item 1: Home */}
        <button
          id="btn-bottom-tab-home"
          onClick={() => handleTabClick('HOME')}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all cursor-pointer ${
            activeBottomTab === 'HOME'
              ? 'text-emerald-400 font-bold scale-105 bg-emerald-950/40 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Home className={`w-5 h-5 ${activeBottomTab === 'HOME' ? 'text-emerald-400' : 'text-slate-400'}`} />
          <span className="text-[11px]">Home</span>
        </button>

        {/* Item 2: Map */}
        <button
          id="btn-bottom-tab-map"
          onClick={() => handleTabClick('MAP')}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all cursor-pointer ${
            activeBottomTab === 'MAP'
              ? 'text-emerald-400 font-bold scale-105 bg-emerald-950/40 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <MapIcon className={`w-5 h-5 ${activeBottomTab === 'MAP' ? 'text-emerald-400' : 'text-slate-400'}`} />
          <span className="text-[11px]">Map</span>
        </button>

        {/* Item 3: Analytics */}
        <button
          id="btn-bottom-tab-analytics"
          onClick={() => handleTabClick('ANALYTICS')}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all cursor-pointer ${
            activeBottomTab === 'ANALYTICS'
              ? 'text-emerald-400 font-bold scale-105 bg-emerald-950/40 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <BarChart3 className={`w-5 h-5 ${activeBottomTab === 'ANALYTICS' ? 'text-emerald-400' : 'text-slate-400'}`} />
          <span className="text-[11px]">Analytics</span>
        </button>

        {/* Item 4: Settings */}
        <button
          id="btn-bottom-tab-settings"
          onClick={() => handleTabClick('SETTINGS')}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all cursor-pointer ${
            activeBottomTab === 'SETTINGS'
              ? 'text-emerald-400 font-bold scale-105 bg-emerald-950/40 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <SettingsIcon className={`w-5 h-5 ${activeBottomTab === 'SETTINGS' ? 'text-emerald-400' : 'text-slate-400'}`} />
          <span className="text-[11px]">Settings</span>
        </button>
      </nav>

      {/* Smart Alert Schedule & Reaction Management Modal */}
      <SmartAlertModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        alerts={alerts}
        onExecuteNow={handleExecuteNow}
        onSnoozeAlert={handleSnoozeAlert}
        onDismissAlert={handleDismissAlert}
        onApproveAlert={handleApproveAlert}
        onUpdateAlert={handleUpdateAlert}
        onAddAlert={handleAddAlert}
      />

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-16 right-5 z-50 max-w-md animate-bounce-short">
          <div className={`p-4 rounded-xl shadow-2xl border flex items-start gap-3 text-xs ${
            toast.type === 'success'
              ? 'bg-slate-950 text-emerald-300 border-emerald-500/50 shadow-emerald-950/80'
              : toast.type === 'warning'
              ? 'bg-slate-950 text-amber-300 border-amber-500/50 shadow-amber-950/80'
              : 'bg-slate-950 text-cyan-300 border-cyan-500/50 shadow-cyan-950/80'
          }`}>
            <CheckCircle2 className={`w-5 h-5 shrink-0 ${
              toast.type === 'success' ? 'text-emerald-400' : toast.type === 'warning' ? 'text-amber-400' : 'text-cyan-400'
            }`} />
            <div className="flex-1">
              <div className="font-bold text-slate-100 mb-0.5">
                {toast.type === 'success' ? 'System Confirmed' : toast.type === 'warning' ? 'System Warning' : 'System Notice'}
              </div>
              <div className="leading-snug text-slate-300">
                {toast.message}
              </div>
            </div>
            <button 
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-white text-xs font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default FarmCommandDashboard;
