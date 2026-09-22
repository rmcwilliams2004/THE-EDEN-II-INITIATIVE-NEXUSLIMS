import React from 'react';

export interface SoilPhGaugeProps {
  value?: number;
  min?: number;
  max?: number;
  label?: string;
  statusText?: string;
  id?: string;
}

export const SoilPhGauge: React.FC<SoilPhGaugeProps> = ({
  value = 6.8,
  min = 4.0,
  max = 10.0,
  label = 'Live Soil pH monitor',
  statusText = '(Neutralized)',
  id = 'soil-ph-gauge',
}) => {
  // Clamping value between min and max
  const clampedValue = Math.min(Math.max(value, min), max);
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

  return (
    <div id={id} className="flex flex-col items-center justify-center w-full py-1">
      {/* Title */}
      <div className="text-center mb-1">
        <h4 className="text-xs font-semibold text-slate-300 tracking-wide uppercase">
          {label}
        </h4>
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
              <stop offset="0%" stopColor="#f97316" />    {/* Orange - Acidic */}
              <stop offset="25%" stopColor="#eab308" />   {/* Yellow - Slightly Acidic */}
              <stop offset="50%" stopColor="#10b981" />   {/* Emerald Green - Neutral / Optimal */}
              <stop offset="75%" stopColor="#06b6d4" />   {/* Cyan/Blue - Slightly Alkaline */}
              <stop offset="100%" stopColor="#8b5cf6" />  {/* Purple - Alkaline */}
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
          <circle cx={centerX} cy={centerY} r="8" fill="#0f172a" stroke="#10b981" strokeWidth="2" />
          <circle cx={centerX} cy={centerY} r="3" fill="#10b981" />

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

        {/* Center Digital Readout: "pH" above, large "6.8", "(Neutralized)" below */}
        <div className="absolute bottom-[-2px] flex flex-col items-center justify-center">
          <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">
            pH
          </span>
          <span className="text-3xl font-mono font-black text-white tracking-tight drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]">
            {value.toFixed(1)}
          </span>
          <span className="text-[11px] font-medium text-emerald-400 tracking-wide mt-[-2px]">
            {statusText}
          </span>
        </div>
      </div>

      {/* Acidic vs Alkaline scale indicators */}
      <div className="w-full max-w-[210px] flex justify-between text-[9px] font-mono text-slate-400 mt-1 px-2">
        <span className="text-orange-400 font-bold">4.0 Acidic</span>
        <span className="text-emerald-400 font-bold">6.5-7.2 Opt</span>
        <span className="text-purple-400 font-bold">10.0 Alk</span>
      </div>
    </div>
  );
};

export default SoilPhGauge;
