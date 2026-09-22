import React from 'react';

export interface SemiCircularGaugeProps {
  value: number;
  min?: number;
  max: number;
  label?: string;
  unit?: string;
  statusLabel?: string;
  statusColor?: string;
  id?: string;
}

export const SemiCircularGauge: React.FC<SemiCircularGaugeProps> = ({
  value,
  min = 0,
  max = 500,
  label = 'Catalyst Bed',
  unit = '°C',
  statusLabel = 'OPTIMAL',
  statusColor = 'text-green-400',
  id = 'semi-circle-gauge',
}) => {
  // Clamping value between min and max
  const clampedValue = Math.min(Math.max(value, min), max);
  const percentage = (clampedValue - min) / (max - min);

  // Angle from -180deg (left, value=min) to 0deg (right, value=max)
  // Or SVG semi-circle from 180 to 360 degrees (in polar terms, -180 to 0)
  const radius = 80;
  const strokeWidth = 16;
  const centerX = 110;
  const centerY = 105;

  // Calculate needle rotation angle (-90deg at min to +90deg at max, or 180deg sweep)
  const needleAngle = -90 + percentage * 180;

  // Arc path generator for background and active gradient
  // Center is (centerX, centerY), start is (centerX - radius, centerY), end is (centerX + radius, centerY)
  const arcPath = `M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`;

  return (
    <div id={id} className="flex flex-col items-center justify-center p-3 w-full">
      {/* Header Label & Status */}
      <div className="text-center mb-1">
        <h3 className="text-sm font-mono font-bold text-slate-100 tracking-wider">
          {label}: <span className="text-cyan-300 font-extrabold">{value}{unit}</span> -{' '}
          <span className={`${statusColor} font-black tracking-widest animate-pulse`}>
            {statusLabel}
          </span>
        </h3>
      </div>

      {/* SVG Semi-Circle Gauge */}
      <div className="relative w-full max-w-[240px] aspect-[220/125] flex items-center justify-center">
        <svg
          viewBox="0 0 220 125"
          className="w-full h-full overflow-visible drop-shadow-[0_0_12px_rgba(6,182,212,0.15)]"
        >
          <defs>
            {/* Linear Gradient from Blue (Cold) to Cyan to Yellow to Orange to Red (Hot) */}
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" />     {/* Cyan / Blue */}
              <stop offset="25%" stopColor="#3b82f6" />    {/* Royal Blue */}
              <stop offset="60%" stopColor="#10b981" />    {/* Status Green (Optimal zone ~400°C) */}
              <stop offset="80%" stopColor="#f59e0b" />    {/* Amber */}
              <stop offset="100%" stopColor="#ef4444" />   {/* Danger Red */}
            </linearGradient>

            {/* Glow Filter */}
            <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Track Arc */}
          <path
            d={arcPath}
            fill="none"
            stroke="#1e293b"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Color Gradient Arc */}
          <path
            d={arcPath}
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth={strokeWidth - 2}
            strokeLinecap="round"
            filter="url(#gaugeGlow)"
            className="opacity-90"
          />

          {/* Tick Marks */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((t, idx) => {
            const angleDeg = 180 + t * 180;
            const rad = (angleDeg * Math.PI) / 180;
            const innerR = radius - strokeWidth / 2 - 4;
            const outerR = radius + strokeWidth / 2 + 4;
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
                stroke="#475569"
                strokeWidth="1.5"
              />
            );
          })}

          {/* Needle Base Hub */}
          <circle cx={centerX} cy={centerY} r="9" fill="#0f172a" stroke="#f97316" strokeWidth="2.5" />
          <circle cx={centerX} cy={centerY} r="3.5" fill="#f97316" />

          {/* Indicator Needle */}
          <g
            style={{
              transform: `rotate(${needleAngle}deg)`,
              transformOrigin: `${centerX}px ${centerY}px`,
              transition: 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            {/* Needle Line with orange glow */}
            <line
              x1={centerX}
              y1={centerY}
              x2={centerX}
              y2={centerY - radius + 4}
              stroke="#f97316"
              strokeWidth="3.5"
              strokeLinecap="round"
              className="drop-shadow-[0_0_6px_rgba(249,115,22,0.8)]"
            />
            {/* Pointer tip cap */}
            <polygon
              points={`${centerX - 3},${centerY - radius + 10} ${centerX + 3},${centerY - radius + 10} ${centerX},${centerY - radius + 2}`}
              fill="#f97316"
            />
          </g>
        </svg>

        {/* Center Digital Readout */}
        <div className="absolute bottom-0 flex flex-col items-center justify-center transform translate-y-1">
          <span className="text-2xl sm:text-3xl font-mono font-black text-cyan-300 tracking-tight drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]">
            {value}
            <span className="text-sm sm:text-base font-normal text-cyan-400 ml-0.5">{unit}</span>
          </span>
          <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-slate-400 mt-[-2px]">
            Setpoint: 400{unit}
          </span>
        </div>
      </div>

      {/* Scale Min / Max Indicators */}
      <div className="w-full max-w-[240px] flex justify-between text-[10px] font-mono text-slate-500 mt-1 px-3">
        <span>{min}{unit}</span>
        <span className="text-green-400 font-bold">● 380-410{unit} OPT</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
};
