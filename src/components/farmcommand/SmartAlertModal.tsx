import React, { useState } from 'react';
import { 
  Bell, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  Play, 
  Pause, 
  RotateCcw, 
  Sliders, 
  X, 
  Plus, 
  Droplets, 
  Zap, 
  Sparkles, 
  Check, 
  ChevronRight,
  ShieldCheck,
  Send,
  Timer,
  RefreshCw,
  Info
} from 'lucide-react';

export interface SmartAlertItem {
  id: string;
  title: string;
  category: 'FERTIGATION' | 'MOISTURE_DEFICIT' | 'NUTRIENT_OPTIMIZATION' | 'WEATHER_DEFENSE' | 'SYSTEM_DIAGNOSTIC';
  severity: 'CRITICAL' | 'WARNING' | 'OPTIMIZATION' | 'INFO';
  status: 'SCHEDULED' | 'ACTION_REQUIRED' | 'RECOMMENDED' | 'EXECUTING' | 'COMPLETED' | 'SNOOZED' | 'DISMISSED';
  scheduledTime: string;
  timeRemaining?: string;
  targetZones: number[];
  volumeLiters: number;
  flowRateLpm: number;
  targetPh: number;
  npkRatio: string;
  summary: string;
  triggerReason: string;
  approvedBy?: string;
  executionProgress?: number; // 0 to 100
}

export const DEFAULT_ALERTS: SmartAlertItem[] = [
  {
    id: 'ALERT-001',
    title: 'Autonomous Dawn Micro-Dosing Cycle',
    category: 'FERTIGATION',
    severity: 'OPTIMIZATION',
    status: 'SCHEDULED',
    scheduledTime: '05:00 AM (Tomorrow)',
    timeRemaining: '6 hrs 28 min',
    targetZones: [4, 7, 8],
    volumeLiters: 450,
    flowRateLpm: 125,
    targetPh: 6.8,
    npkRatio: '12-4-8 Bio-Aqueous',
    summary: 'Optimal Dawn Micro-Dosing Window. Injecting 450 Liters aqueous nutrient solution based on overnight soil moisture & transpiration sensors.',
    triggerReason: 'Overnight moisture model predicts optimal root uptake efficiency between 04:45 AM and 05:45 AM with minimal solar evaporation.',
    approvedBy: 'Auto-Pilot (Dr. Vance)'
  },
  {
    id: 'ALERT-002',
    title: 'Zone 7 Sub-Layer Moisture Deficit Warning',
    category: 'MOISTURE_DEFICIT',
    severity: 'WARNING',
    status: 'ACTION_REQUIRED',
    scheduledTime: 'Immediate Action Needed',
    timeRemaining: 'Deficit active 42 min',
    targetZones: [7],
    volumeLiters: 180,
    flowRateLpm: 90,
    targetPh: 6.7,
    npkRatio: '0-0-0 Pure Filtered Hydration',
    summary: 'LoRaWAN Sensor S118 registered volumetric water content at 28.5% (below calibrated 30.0% threshold).',
    triggerReason: 'Elevated canopy transpiration during afternoon peak caused rapid depletion in sandy loam subsoil tier.',
  },
  {
    id: 'ALERT-003',
    title: 'Zone 4 Vegetative Nitrogen Uptake Booster',
    category: 'NUTRIENT_OPTIMIZATION',
    severity: 'OPTIMIZATION',
    status: 'RECOMMENDED',
    scheduledTime: '08:30 AM',
    timeRemaining: '9 hrs 58 min',
    targetZones: [4],
    volumeLiters: 220,
    flowRateLpm: 110,
    targetPh: 6.9,
    npkRatio: '16-2-4 High-N Bio-Soluble',
    summary: 'Rapid biomass expansion detected via Sentinel-2 NDVI imagery. Recommended supplemental Nitrogen injection.',
    triggerReason: 'NDVI index rose from 0.71 to 0.84 over 72h; nitrate telemetry indicates root uptake accelerating at +18% above baseline.',
  },
  {
    id: 'ALERT-004',
    title: 'Pre-Heatwave Hydration Pre-Conditioning',
    category: 'WEATHER_DEFENSE',
    severity: 'INFO',
    status: 'SCHEDULED',
    scheduledTime: '11:30 AM',
    timeRemaining: '12 hrs 58 min',
    targetZones: [1, 2, 4, 7, 8],
    volumeLiters: 650,
    flowRateLpm: 150,
    targetPh: 6.8,
    npkRatio: '2-2-6 Potassium Anti-Stress',
    summary: 'High ambient temperature forecast (82°F / 28°C) expected at 14:00. Pre-conditioning canopy root pressure.',
    triggerReason: 'Local micro-climate forecast model predicts 82°F peak with wind gusts up to 14 mph.',
  }
];

interface SmartAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: SmartAlertItem[];
  onExecuteNow: (alertId: string) => void;
  onSnoozeAlert: (alertId: string, durationMinutes: number) => void;
  onDismissAlert: (alertId: string) => void;
  onApproveAlert: (alertId: string) => void;
  onUpdateAlert: (updatedAlert: SmartAlertItem) => void;
  onAddAlert: (newAlert: SmartAlertItem) => void;
}

export const SmartAlertModal: React.FC<SmartAlertModalProps> = ({
  isOpen,
  onClose,
  alerts,
  onExecuteNow,
  onSnoozeAlert,
  onDismissAlert,
  onApproveAlert,
  onUpdateAlert,
  onAddAlert
}) => {
  const [selectedAlertId, setSelectedAlertId] = useState<string>(alerts[0]?.id || 'ALERT-001');
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<'ALL' | 'SCHEDULED' | 'ACTION_REQUIRED' | 'HISTORY'>('ALL');
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Edit State
  const [editForm, setEditForm] = useState<Partial<SmartAlertItem>>({});

  // New Alert State
  const [newForm, setNewForm] = useState<{
    title: string;
    category: SmartAlertItem['category'];
    severity: SmartAlertItem['severity'];
    scheduledTime: string;
    targetZones: string;
    volumeLiters: number;
    flowRateLpm: number;
    targetPh: number;
    npkRatio: string;
    summary: string;
    triggerReason: string;
  }>({
    title: 'Custom Soil Nutrient Injection',
    category: 'FERTIGATION',
    severity: 'OPTIMIZATION',
    scheduledTime: '06:00 AM (Custom)',
    targetZones: '4, 7, 8',
    volumeLiters: 350,
    flowRateLpm: 120,
    targetPh: 6.8,
    npkRatio: '10-5-5 Custom Blend',
    summary: 'Manual schedule configured by operator for targeted precision nutrition.',
    triggerReason: 'Operator scheduled precision bio-dosing via Farm Command tablet interface.'
  });

  if (!isOpen) return null;

  const currentAlert = alerts.find(a => a.id === selectedAlertId) || alerts[0];

  const triggerToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => {
      setFeedbackToast(null);
    }, 4000);
  };

  const handleStartEdit = (alert: SmartAlertItem) => {
    setEditForm({ ...alert });
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (editForm.id) {
      onUpdateAlert(editForm as SmartAlertItem);
      setIsEditing(false);
      triggerToast(`Alert ${editForm.id} schedule and parameters updated successfully.`);
    }
  };

  const handleCreateNew = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedZones = newForm.targetZones
      .split(',')
      .map(z => parseInt(z.trim()))
      .filter(z => !isNaN(z));

    const createdAlert: SmartAlertItem = {
      id: `ALERT-${String(Date.now()).slice(-4)}`,
      title: newForm.title,
      category: newForm.category,
      severity: newForm.severity,
      status: 'SCHEDULED',
      scheduledTime: newForm.scheduledTime,
      timeRemaining: 'Queued',
      targetZones: parsedZones.length > 0 ? parsedZones : [4, 7],
      volumeLiters: Number(newForm.volumeLiters),
      flowRateLpm: Number(newForm.flowRateLpm),
      targetPh: Number(newForm.targetPh),
      npkRatio: newForm.npkRatio,
      summary: newForm.summary,
      triggerReason: newForm.triggerReason,
      approvedBy: 'Dr. Sarah Vance (Manual Entry)'
    };

    onAddAlert(createdAlert);
    setIsCreating(false);
    setSelectedAlertId(createdAlert.id);
    triggerToast(`New Smart Alert [${createdAlert.id}] scheduled successfully.`);
  };

  const filteredAlerts = alerts.filter(a => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'SCHEDULED') return a.status === 'SCHEDULED' || a.status === 'RECOMMENDED';
    if (activeTab === 'ACTION_REQUIRED') return a.status === 'ACTION_REQUIRED';
    if (activeTab === 'HISTORY') return a.status === 'COMPLETED' || a.status === 'DISMISSED';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        
        {/* Modal Header */}
        <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Smart Alert & Dosing Schedule Command
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                  {alerts.filter(a => a.status === 'SCHEDULED' || a.status === 'ACTION_REQUIRED').length} Active
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Review automated fertigation timings, telemetry triggers, and execute or calibrate schedules.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-modal-new-alert"
              onClick={() => { setIsCreating(true); setIsEditing(false); }}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Schedule</span>
            </button>
            <button
              id="btn-modal-close"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dynamic Toast feedback */}
        {feedbackToast && (
          <div className="bg-emerald-500/20 border-b border-emerald-500/40 text-emerald-200 px-5 py-2 text-xs flex items-center gap-2 animate-in slide-in-from-top duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedbackToast}</span>
          </div>
        )}

        {/* Modal Body: Left Alerts List + Right Details / Edit Panel */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden min-h-[460px]">
          
          {/* LEFT LIST COLUMN (5 cols) */}
          <div className="lg:col-span-5 border-r border-slate-800 flex flex-col bg-slate-950/40 overflow-hidden">
            {/* Filter Tabs */}
            <div className="p-3 border-b border-slate-800 flex items-center gap-1 overflow-x-auto text-xs">
              <button
                onClick={() => setActiveTab('ALL')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  activeTab === 'ALL' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All ({alerts.length})
              </button>
              <button
                onClick={() => setActiveTab('SCHEDULED')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  activeTab === 'SCHEDULED' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Scheduled
              </button>
              <button
                onClick={() => setActiveTab('ACTION_REQUIRED')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  activeTab === 'ACTION_REQUIRED' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Warnings
              </button>
              <button
                onClick={() => setActiveTab('HISTORY')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  activeTab === 'HISTORY' ? 'bg-slate-700 text-slate-200 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                History
              </button>
            </div>

            {/* List Items */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
              {filteredAlerts.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs">
                  No alerts found matching this filter.
                </div>
              ) : (
                filteredAlerts.map(alert => {
                  const isSelected = alert.id === selectedAlertId && !isCreating;
                  let statusBadge = 'bg-slate-800 text-slate-300 border-slate-700';
                  if (alert.status === 'SCHEDULED') statusBadge = 'bg-emerald-950/80 text-emerald-300 border-emerald-800';
                  if (alert.status === 'ACTION_REQUIRED') statusBadge = 'bg-amber-950/80 text-amber-300 border-amber-800';
                  if (alert.status === 'RECOMMENDED') statusBadge = 'bg-cyan-950/80 text-cyan-300 border-cyan-800';
                  if (alert.status === 'EXECUTING') statusBadge = 'bg-purple-950/80 text-purple-300 border-purple-800 animate-pulse';
                  if (alert.status === 'COMPLETED') statusBadge = 'bg-emerald-900/40 text-emerald-400 border-emerald-700';

                  return (
                    <button
                      key={alert.id}
                      id={`alert-card-${alert.id}`}
                      onClick={() => { setSelectedAlertId(alert.id); setIsCreating(false); setIsEditing(false); }}
                      className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 ${
                        isSelected 
                          ? 'bg-slate-800/90 border-emerald-500/60 shadow-lg shadow-emerald-950/20' 
                          : 'bg-slate-900/70 border-slate-800 hover:bg-slate-800/50 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          {alert.severity === 'CRITICAL' || alert.severity === 'WARNING' ? (
                            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                          ) : (
                            <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                          )}
                          <span className="font-bold text-xs text-slate-200 line-clamp-1">
                            {alert.title}
                          </span>
                        </div>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase shrink-0 ${statusBadge}`}>
                          {alert.status.replace('_', ' ')}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {alert.summary}
                      </p>

                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800/60">
                        <span className="text-emerald-400 font-semibold">{alert.scheduledTime}</span>
                        <span>Zones: {alert.targetZones.join(', ')} • {alert.volumeLiters}L</span>
                      </div>

                      {alert.status === 'EXECUTING' && alert.executionProgress !== undefined && (
                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden mt-1">
                          <div 
                            className="bg-purple-500 h-full transition-all duration-300"
                            style={{ width: `${alert.executionProgress}%` }}
                          />
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT DETAIL / EDIT / CREATE COLUMN (7 cols) */}
          <div className="lg:col-span-7 flex flex-col bg-slate-900/50 p-4 sm:p-5 overflow-y-auto custom-scrollbar">
            
            {/* 1. CREATING NEW ALERT VIEW */}
            {isCreating ? (
              <form onSubmit={handleCreateNew} className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-sm font-bold text-slate-100">Schedule Custom Fertigation Event</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="text-xs text-slate-400 hover:text-slate-200"
                  >
                    Cancel
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">Title / Event Name</label>
                    <input
                      type="text"
                      value={newForm.title}
                      onChange={(e) => setNewForm({ ...newForm, title: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 mb-1 font-semibold">Scheduled Time</label>
                      <input
                        type="text"
                        value={newForm.scheduledTime}
                        onChange={(e) => setNewForm({ ...newForm, scheduledTime: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono text-xs focus:ring-1 focus:ring-emerald-500"
                        placeholder="e.g. 05:30 AM (Tomorrow)"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 mb-1 font-semibold">Target Zones (comma separated)</label>
                      <input
                        type="text"
                        value={newForm.targetZones}
                        onChange={(e) => setNewForm({ ...newForm, targetZones: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono text-xs focus:ring-1 focus:ring-emerald-500"
                        placeholder="e.g. 4, 7, 8"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-300 mb-1 font-semibold">Volume (Liters)</label>
                      <input
                        type="number"
                        value={newForm.volumeLiters}
                        onChange={(e) => setNewForm({ ...newForm, volumeLiters: Number(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono text-xs focus:ring-1 focus:ring-emerald-500"
                        min={10}
                        max={5000}
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 mb-1 font-semibold">Flow Rate (L/min)</label>
                      <input
                        type="number"
                        value={newForm.flowRateLpm}
                        onChange={(e) => setNewForm({ ...newForm, flowRateLpm: Number(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono text-xs focus:ring-1 focus:ring-emerald-500"
                        min={10}
                        max={300}
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 mb-1 font-semibold">Target pH</label>
                      <input
                        type="number"
                        step="0.1"
                        value={newForm.targetPh}
                        onChange={(e) => setNewForm({ ...newForm, targetPh: Number(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono text-xs focus:ring-1 focus:ring-emerald-500"
                        min={5.0}
                        max={8.5}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">Formulation / NPK Ratio</label>
                    <input
                      type="text"
                      value={newForm.npkRatio}
                      onChange={(e) => setNewForm({ ...newForm, npkRatio: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-xs focus:ring-1 focus:ring-emerald-500"
                      placeholder="e.g. 12-4-8 Bio-Aqueous"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">Summary & Instructions</label>
                    <textarea
                      rows={2}
                      value={newForm.summary}
                      onChange={(e) => setNewForm({ ...newForm, summary: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-xs focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">Telemetry Trigger Reason</label>
                    <input
                      type="text"
                      value={newForm.triggerReason}
                      onChange={(e) => setNewForm({ ...newForm, triggerReason: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-xs focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Confirm & Schedule</span>
                  </button>
                </div>
              </form>
            ) : isEditing ? (
              /* 2. EDITING EXISTING ALERT VIEW */
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-emerald-400" />
                    Calibrate Schedule #{editForm.id}
                  </h3>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="text-xs text-slate-400 hover:text-slate-200"
                  >
                    Cancel
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">Title</label>
                    <input
                      type="text"
                      value={editForm.title || ''}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 mb-1 font-semibold">Execution Time</label>
                      <input
                        type="text"
                        value={editForm.scheduledTime || ''}
                        onChange={(e) => setEditForm({ ...editForm, scheduledTime: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 mb-1 font-semibold">Target Zones</label>
                      <input
                        type="text"
                        value={editForm.targetZones ? editForm.targetZones.join(', ') : ''}
                        onChange={(e) => {
                          const zones = e.target.value.split(',').map(z => parseInt(z.trim())).filter(z => !isNaN(z));
                          setEditForm({ ...editForm, targetZones: zones });
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-300 mb-1 font-semibold">Volume (Liters)</label>
                      <input
                        type="number"
                        value={editForm.volumeLiters || 0}
                        onChange={(e) => setEditForm({ ...editForm, volumeLiters: Number(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 mb-1 font-semibold">Flow Rate (L/min)</label>
                      <input
                        type="number"
                        value={editForm.flowRateLpm || 0}
                        onChange={(e) => setEditForm({ ...editForm, flowRateLpm: Number(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 mb-1 font-semibold">Target pH</label>
                      <input
                        type="number"
                        step="0.1"
                        value={editForm.targetPh || 6.8}
                        onChange={(e) => setEditForm({ ...editForm, targetPh: Number(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">NPK Formulation</label>
                    <input
                      type="text"
                      value={editForm.npkRatio || ''}
                      onChange={(e) => setEditForm({ ...editForm, npkRatio: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">Summary</label>
                    <textarea
                      rows={2}
                      value={editForm.summary || ''}
                      onChange={(e) => setEditForm({ ...editForm, summary: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            ) : currentAlert ? (
              /* 3. ALERT DETAIL & REACT / RESPOND VIEW */
              <div className="space-y-4 flex flex-col justify-between h-full">
                <div className="space-y-4">
                  {/* Title & Status Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest mb-1">
                        SMART ALERT #{currentAlert.id} // {currentAlert.category}
                      </div>
                      <h3 className="text-base font-bold text-slate-100">
                        {currentAlert.title}
                      </h3>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-emerald-950 text-emerald-300 border border-emerald-700 shrink-0">
                      {currentAlert.status}
                    </span>
                  </div>

                  {/* Summary Box */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs leading-relaxed text-slate-200">
                    <strong className="text-emerald-400 mr-1.5">Summary:</strong>
                    {currentAlert.summary}
                  </div>

                  {/* Telemetry Trigger Context */}
                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <div className="text-slate-300">
                      <strong className="text-cyan-300">Telemetry Trigger Cause: </strong>
                      {currentAlert.triggerReason}
                    </div>
                  </div>

                  {/* Key Parameters 4-Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                      <div className="text-[10px] text-slate-400 uppercase">Target Time</div>
                      <div className="text-xs font-mono font-bold text-emerald-400 mt-0.5">{currentAlert.scheduledTime}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                      <div className="text-[10px] text-slate-400 uppercase">Zones</div>
                      <div className="text-xs font-mono font-bold text-slate-100 mt-0.5">Zones {currentAlert.targetZones.join(', ')}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                      <div className="text-[10px] text-slate-400 uppercase">Fluid Volume</div>
                      <div className="text-xs font-mono font-bold text-cyan-300 mt-0.5">{currentAlert.volumeLiters} Liters</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                      <div className="text-[10px] text-slate-400 uppercase">Target pH & NPK</div>
                      <div className="text-xs font-mono font-bold text-amber-300 mt-0.5">{currentAlert.targetPh} pH • {currentAlert.npkRatio}</div>
                    </div>
                  </div>

                  {/* Progress bar if executing */}
                  {currentAlert.status === 'EXECUTING' && (
                    <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-800/60">
                      <div className="flex justify-between text-xs text-purple-300 mb-1.5 font-mono">
                        <span className="flex items-center gap-1.5">
                          <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                          Dispensing In-Progress ({currentAlert.flowRateLpm} L/min)
                        </span>
                        <span>{currentAlert.executionProgress || 0}%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-purple-500 h-full transition-all duration-300 shadow-sm shadow-purple-500"
                          style={{ width: `${currentAlert.executionProgress || 0}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* RESPOND / REACT ACTIONS BAR (Bottom) */}
                <div className="pt-4 border-t border-slate-800 flex flex-col gap-2.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                    <span>Operator Response Actions</span>
                    {currentAlert.approvedBy && (
                      <span className="text-emerald-400 font-mono text-[9px] flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Approved: {currentAlert.approvedBy}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Execute Now / Run Immediately */}
                    <button
                      id="btn-alert-execute-now"
                      onClick={() => {
                        onExecuteNow(currentAlert.id);
                        triggerToast(`Dispatched pump sequence: Executing ${currentAlert.title} now.`);
                      }}
                      disabled={currentAlert.status === 'EXECUTING' || currentAlert.status === 'COMPLETED'}
                      className="flex-1 min-w-[130px] px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-950/40 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{currentAlert.status === 'EXECUTING' ? 'Executing...' : 'Execute Now'}</span>
                    </button>

                    {/* Snooze 30 Min */}
                    <button
                      id="btn-alert-snooze-30"
                      onClick={() => {
                        onSnoozeAlert(currentAlert.id, 30);
                        triggerToast(`Alert #${currentAlert.id} snoozed for 30 minutes.`);
                      }}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Snooze +30m</span>
                    </button>

                    {/* Snooze 2 Hours */}
                    <button
                      id="btn-alert-snooze-120"
                      onClick={() => {
                        onSnoozeAlert(currentAlert.id, 120);
                        triggerToast(`Alert #${currentAlert.id} postponed by 2 hours.`);
                      }}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Timer className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Delay 2 hrs</span>
                    </button>

                    {/* Modify / Calibrate */}
                    <button
                      id="btn-alert-modify"
                      onClick={() => handleStartEdit(currentAlert)}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Sliders className="w-3.5 h-3.5 text-slate-400" />
                      <span>Calibrate</span>
                    </button>

                    {/* Approve / Acknowledge */}
                    <button
                      id="btn-alert-approve"
                      onClick={() => {
                        onApproveAlert(currentAlert.id);
                        triggerToast(`Alert #${currentAlert.id} verified and locked into schedule.`);
                      }}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Approve</span>
                    </button>

                    {/* Dismiss / Cancel */}
                    <button
                      id="btn-alert-dismiss"
                      onClick={() => {
                        onDismissAlert(currentAlert.id);
                        triggerToast(`Alert #${currentAlert.id} dismissed.`);
                      }}
                      className="px-3 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-900/50 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Dismiss</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-slate-500 text-xs">
                Select an alert from the left column to review details.
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
