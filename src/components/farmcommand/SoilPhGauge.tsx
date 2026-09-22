import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Droplets,
  Zap,
  Activity,
  Radio,
  Sliders,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import {
  AlkalineDosingPumpDriver,
  AgronomyFailsafeSnapshot,
  LoRaWANSoilPhTelemetry,
} from '../../../apps/edge-controller/src/drivers/alkalineDosingPump';

export interface SoilPhGaugeProps {
  value?: number;
  min?: number;
  max?: number;
  label?: string;
  statusText?: string;
  id?: string;
  flowRateLpm?: number;
  nitrogenPpm?: number;
  showAutonomousWidget?: boolean;
  onDosingStateChange?: (snapshot: AgronomyFailsafeSnapshot) => void;
}

export const SoilPhGauge: React.FC<SoilPhGaugeProps> = ({
  value = 6.8,
  min = 4.0,
  max = 10.0,
  label = 'Live Soil pH monitor',
  statusText,
  id = 'soil-ph-gauge',
  flowRateLpm = 45.0,
  nitrogenPpm = 120.0,
  showAutonomousWidget = true,
  onDosingStateChange,
}) => {
  // Edge controller driver instance
  const driver = useMemo(() => new AlkalineDosingPumpDriver(), []);

  // Internal interactive simulation state (allows dynamic audit testing)
  const [currentPh, setCurrentPh] = useState<number>(value);
  const [isSimulatingNitrification, setIsSimulatingNitrification] = useState<boolean>(false);
  const [snapshot, setSnapshot] = useState<AgronomyFailsafeSnapshot>(() => driver.getSnapshot());

  // Synchronize when external prop value updates
  useEffect(() => {
    if (!isSimulatingNitrification) {
      setCurrentPh(value);
      const tele: LoRaWANSoilPhTelemetry = {
        sensorNodeId: 'LORA-SOIL-NODE-78B',
        fieldZone: 'Zone-A1 (Rhizosphere)',
        soilDepthCm: 15,
        measuredPh: value,
        soilTempCelsius: 21.4,
        volumetricWaterContentPercent: 28.5,
        electricalConductivityDsm: 1.4,
        batteryMillivolts: 3580,
        rssiDbm: -72,
        timestamp: new Date().toISOString(),
      };
      const snap = driver.ingestLoRaWANTelemetry(tele, {
        irrigationFlowRateLpm: flowRateLpm,
        activeNitrogenPpm: nitrogenPpm,
      });
      setSnapshot(snap);
      onDosingStateChange?.(snap);
    }
  }, [value, flowRateLpm, nitrogenPpm, driver, isSimulatingNitrification, onDosingStateChange]);

  // Handle manual pH adjustment or simulated nitrification acid dip
  const handlePhChange = useCallback(
    (newPh: number) => {
      setCurrentPh(newPh);
      const snap = driver.simulatePhStep(newPh);
      setSnapshot(snap);
      onDosingStateChange?.(snap);
    },
    [driver, onDosingStateChange]
  );

  // Trigger simulated nitrification acid drift
  const triggerNitrificationAcidSpike = () => {
    setIsSimulatingNitrification(true);
    // Acidify soil down to 5.6 pH due to active nitrification H+ flux
    handlePhChange(5.6);
  };

  // Reset to nominal 6.8 pH
  const resetToNominal = () => {
    setIsSimulatingNitrification(false);
    handlePhChange(6.8);
  };

  // Clamping value between min and max
  const clampedValue = Math.min(Math.max(currentPh, min), max);
  const percentage = (clampedValue - min) / (max - min);

  // SVG Geometry for semi-circle (180 degree sweep)
  const radius = 75;
  const strokeWidth = 14;
  const centerX = 100;
  const centerY = 92;

  // Calculate needle rotation angle (-90deg at min to +90deg at max)
  const needleAngle = -90 + percentage * 180;

  // Arc path generator from left to right
  const arcPath = `M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`;

  // Derive dynamic status badge
  const derivedStatusText = useMemo(() => {
    if (statusText) return statusText;
    if (snapshot.actuator.pumpMotorRunning) {
      return `(CaCO3 Buffer Active)`;
    }
    if (currentPh < 6.0) return '(Acidic - Dosing)';
    if (currentPh <= 6.4) return '(Early Acid Drift)';
    if (currentPh >= 7.5) return '(Alkaline Lockout)';
    return '(Optimal / Neutralized)';
  }, [statusText, snapshot.actuator.pumpMotorRunning, currentPh]);

  const isDosingActive = snapshot.actuator.pumpMotorRunning;

  return (
    <div id={id} className="flex flex-col items-center justify-center w-full py-1 space-y-3 font-sans">
      {/* Title & LoRaWAN Ingestion Badge */}
      <div className="w-full flex items-center justify-between text-center px-1">
        <h4 className="text-xs font-semibold text-slate-300 tracking-wide uppercase flex items-center gap-1.5">
          <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>{label}</span>
        </h4>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
          LoRaWAN 15cm Rhizo
        </span>
      </div>

      {/* SVG Semi-Circle Gauge */}
      <div className="relative w-full max-w-[210px] aspect-[200/115] flex items-center justify-center">
        <svg
          viewBox="0 0 200 115"
          className="w-full h-full overflow-visible drop-shadow-[0_0_10px_rgba(16,185,129,0.15)]"
        >
          <defs>
            {/* Gradient from Orange (Acidic) on left to Green (Optimal) in middle to Blue/Purple (Alkaline) on right */}
            <linearGradient id="phGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f97316" /> {/* Orange - Acidic */}
              <stop offset="25%" stopColor="#eab308" /> {/* Yellow - Slightly Acidic */}
              <stop offset="50%" stopColor="#10b981" /> {/* Emerald Green - Neutral / Optimal */}
              <stop offset="75%" stopColor="#06b6d4" /> {/* Cyan/Blue - Slightly Alkaline */}
              <stop offset="100%" stopColor="#8b5cf6" /> {/* Purple - Alkaline */}
            </linearGradient>

            <filter id="phGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Track */}
          <path
            d={arcPath}
            fill="none"
            stroke="#1e293b"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* pH Color Gradient Arc */}
          <path
            d={arcPath}
            fill="none"
            stroke="url(#phGradient)"
            strokeWidth={strokeWidth - 2}
            strokeLinecap="round"
            filter="url(#phGlow)"
            className="opacity-95"
          />

          {/* Scale Tick Markers */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((t, idx) => {
            const angleDeg = 180 + t * 180;
            const rad = (angleDeg * Math.PI) / 180;
            const innerR = radius - strokeWidth / 2 - 3;
            const outerR = radius + strokeWidth / 2 + 3;
            const x1 = centerX + innerR * Math.cos(rad);
            const y1 = centerY + innerR * Math.sin(rad);
            const x2 = centerX + outerR * Math.cos(rad);
            const y2 = centerY + outerR * Math.sin(rad);
            return (
              <line
                key={idx}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#64748b"
                strokeWidth="1.5"
              />
            );
          })}

          {/* Needle Base Hub */}
          <circle cx={centerX} cy={centerY} r="8" fill="#0f172a" stroke={isDosingActive ? '#f97316' : '#10b981'} strokeWidth="2" />
          <circle cx={centerX} cy={centerY} r="3" fill={isDosingActive ? '#f97316' : '#10b981'} />

          {/* Indicator Needle */}
          <g
            style={{
              transform: `rotate(${needleAngle}deg)`,
              transformOrigin: `${centerX}px ${centerY}px`,
              transition: 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            <line
              x1={centerX}
              y1={centerY}
              x2={centerX}
              y2={centerY - radius + 5}
              stroke="#e2e8f0"
              strokeWidth="2.5"
              strokeLinecap="round"
              className="drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]"
            />
            <polygon
              points={`${centerX - 2.5},${centerY - radius + 9} ${centerX + 2.5},${centerY - radius + 9} ${centerX},${centerY - radius + 2}`}
              fill="#ffffff"
            />
          </g>
        </svg>

        {/* Center Digital Readout: "pH" above, large "6.8", status text below */}
        <div className="absolute bottom-[-2px] flex flex-col items-center justify-center">
          <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">
            pH
          </span>
          <span
            className={`text-3xl font-mono font-black tracking-tight drop-shadow-[0_0_8px_rgba(16,185,129,0.4)] ${
              currentPh < 6.0
                ? 'text-orange-400'
                : currentPh > 7.4
                ? 'text-purple-400'
                : 'text-white'
            }`}
          >
            {currentPh.toFixed(1)}
          </span>
          <span
            className={`text-[11px] font-medium tracking-wide mt-[-2px] ${
              isDosingActive ? 'text-amber-400 font-bold animate-pulse' : 'text-emerald-400'
            }`}
          >
            {derivedStatusText}
          </span>
        </div>
      </div>

      {/* Acidic vs Alkaline scale indicators */}
      <div className="w-full max-w-[210px] flex justify-between text-[9px] font-mono text-slate-400 px-2">
        <span className="text-orange-400 font-bold">4.0 Acidic</span>
        <span className="text-emerald-400 font-bold">6.5-7.2 Opt</span>
        <span className="text-purple-400 font-bold">10.0 Alk</span>
      </div>

      {/* Autonomous Alkaline CaCO3 Dosing Pump Actuation Panel */}
      {showAutonomousWidget && (
        <div className="w-full bg-slate-950/90 rounded-xl border border-slate-800 p-3 space-y-2.5 font-mono text-xs">
          {/* Header & Status Indicator */}
          <div className="flex items-center justify-between pb-1 border-b border-slate-800">
            <div className="flex items-center gap-1.5 text-slate-200 font-bold text-[11px]">
              <Droplets className="w-3.5 h-3.5 text-cyan-400" />
              <span>CaCO3 Buffer Dosing Pump</span>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isDosingActive
                  ? 'bg-amber-950 text-amber-300 border border-amber-500/80 animate-pulse'
                  : 'bg-slate-900 text-slate-400 border border-slate-800'
              }`}
            >
              {isDosingActive ? 'INJECTION ACTIVE' : 'MONITORING'}
            </span>
          </div>

          {/* Dosing Calculations & Telemetry Grid */}
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-850">
              <span className="text-[10px] text-slate-400 block">Dosing Rate</span>
              <span className="font-bold text-white text-xs">
                {snapshot.actuator.actualDoseFlowRateMlMin.toFixed(1)}{' '}
                <span className="text-[10px] text-slate-400">mL/min</span>
              </span>
            </div>

            <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-850">
              <span className="text-[10px] text-slate-400 block">CaCO3 Slurry Tank</span>
              <span className="font-bold text-cyan-400 text-xs">
                {snapshot.actuator.bufferTankLevelPercent.toFixed(0)}%{' '}
                <span className="text-[10px] text-slate-400">({snapshot.actuator.bufferTankVolumeRemainingLiters}L)</span>
              </span>
            </div>
          </div>

          {/* Chemical Reaction Pill */}
          <div className="p-1.5 bg-slate-900/60 rounded-lg border border-slate-850 text-[10px] text-slate-300 flex items-center justify-between">
            <span className="text-slate-400">Nitrification Buffer:</span>
            <span className="text-emerald-300 font-bold">CaCO3 + 2H+ → Ca2+ + H2O + CO2</span>
          </div>

          {/* Interactive Simulation Audit Controls */}
          <div className="pt-1 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={triggerNitrificationAcidSpike}
              className="px-2.5 py-1 rounded bg-amber-950/70 hover:bg-amber-900/80 text-amber-200 border border-amber-700/60 text-[10px] font-bold transition-all flex items-center gap-1 active:scale-95"
            >
              <Zap className="w-3 h-3 text-amber-400" />
              Simulate Acid Dip (pH 5.6)
            </button>

            <button
              type="button"
              onClick={resetToNominal}
              className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-750 text-[10px] transition-all flex items-center gap-1 active:scale-95"
            >
              <RotateCcw className="w-3 h-3" />
              Reset (6.8)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SoilPhGauge;
