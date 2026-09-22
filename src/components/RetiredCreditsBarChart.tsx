import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { BarChart3, Calendar, Cpu, TrendingUp, ShieldCheck, Info } from 'lucide-react';

export interface RetirementDataPoint {
  id: string;
  label: string;
  secondaryLabel?: string;
  retiredKg: number;
  date: string;
  nodeId: string;
  location: string;
  htsTxId: string;
  cooperativeName: string;
}

const DEFAULT_NODE_DATA: RetirementDataPoint[] = [
  {
    id: 'ret-1',
    label: 'US-CAL-01',
    secondaryLabel: 'California, US',
    retiredKg: 42500,
    date: '2026-08-15',
    nodeId: 'US-CAL-01-EDEN',
    location: 'Central Valley, California',
    htsTxId: '0.0.489102@1723708800.001',
    cooperativeName: 'SunValley Ag Agro-Tech',
  },
  {
    id: 'ret-2',
    label: 'KE-RV-02',
    secondaryLabel: 'Nakuru, Kenya',
    retiredKg: 38200,
    date: '2026-08-20',
    nodeId: 'KE-RV-02-EDEN',
    location: 'Rift Valley, Kenya',
    htsTxId: '0.0.512904@1724140800.002',
    cooperativeName: 'Rift Valley Eco-Growers',
  },
  {
    id: 'ret-3',
    label: 'NL-WST-03',
    secondaryLabel: 'Westland, NL',
    retiredKg: 28400,
    date: '2026-08-28',
    nodeId: 'NL-WST-03-EDEN',
    location: 'Westland Greenhouse CEA',
    htsTxId: '0.0.489102@1724832000.003',
    cooperativeName: 'Westland Horti-Cluster',
  },
  {
    id: 'ret-4',
    label: 'IN-PUN-04',
    secondaryLabel: 'Punjab, India',
    retiredKg: 22100,
    date: '2026-09-02',
    nodeId: 'IN-PUN-04-EDEN',
    location: 'Ludhiana Bio-Hub',
    htsTxId: '0.0.512904@1725264000.004',
    cooperativeName: 'Punjab Agro-Alliance',
  },
  {
    id: 'ret-5',
    label: 'BR-MAT-05',
    secondaryLabel: 'Mato Grosso, BR',
    retiredKg: 19800,
    date: '2026-09-10',
    nodeId: 'BR-MAT-05-EDEN',
    location: 'Cerrado Regenerative Farm',
    htsTxId: '0.0.489102@1725955200.005',
    cooperativeName: 'Terra Verde Co-op',
  },
  {
    id: 'ret-6',
    label: 'AU-MDB-06',
    secondaryLabel: 'Murray-Darling, AU',
    retiredKg: 14600,
    date: '2026-09-18',
    nodeId: 'AU-MDB-06-EDEN',
    location: 'Riverina Precision Orchard',
    htsTxId: '0.0.100982@1726646400.006',
    cooperativeName: 'Murray Basin AgroTech',
  },
];

const DEFAULT_DATE_DATA: RetirementDataPoint[] = [
  {
    id: 'date-1',
    label: 'Apr 2026',
    secondaryLabel: 'Q2 Audit Tranche 1',
    retiredKg: 16500,
    date: '2026-04-30',
    nodeId: 'MULTI-NODE-POOL-A',
    location: 'Global Co-op Grid',
    htsTxId: '0.0.984210@1714464000.010',
    cooperativeName: 'Genesis Cohort Retirement',
  },
  {
    id: 'date-2',
    label: 'May 2026',
    secondaryLabel: 'Q2 Audit Tranche 2',
    retiredKg: 21800,
    date: '2026-05-31',
    nodeId: 'MULTI-NODE-POOL-A',
    location: 'Global Co-op Grid',
    htsTxId: '0.0.984210@1717142400.020',
    cooperativeName: 'Spring Solstice Burn Event',
  },
  {
    id: 'date-3',
    label: 'Jun 2026',
    secondaryLabel: 'Q2 Final Settlement',
    retiredKg: 28900,
    date: '2026-06-30',
    nodeId: 'MULTI-NODE-POOL-B',
    location: 'Global Co-op Grid',
    htsTxId: '0.0.984210@1719734400.030',
    cooperativeName: 'Mid-Year ESG Corporate Offset',
  },
  {
    id: 'date-4',
    label: 'Jul 2026',
    secondaryLabel: 'Q3 Audit Tranche 1',
    retiredKg: 34200,
    date: '2026-07-31',
    nodeId: 'MULTI-NODE-POOL-B',
    location: 'Global Co-op Grid',
    htsTxId: '0.0.984210@1722412800.040',
    cooperativeName: 'Summer Yield Acceleration',
  },
  {
    id: 'date-5',
    label: 'Aug 2026',
    secondaryLabel: 'Q3 Audit Tranche 2',
    retiredKg: 46100,
    date: '2026-08-31',
    nodeId: 'MULTI-NODE-POOL-C',
    location: 'Global Co-op Grid',
    htsTxId: '0.0.984210@1725091200.050',
    cooperativeName: 'High-Purity Bio-Ammonia Peak',
  },
  {
    id: 'date-6',
    label: 'Sep 2026 (MTD)',
    secondaryLabel: 'Q3 Active Settlement',
    retiredKg: 38100,
    date: '2026-09-22',
    nodeId: 'MULTI-NODE-POOL-C',
    location: 'Global Co-op Grid',
    htsTxId: '0.0.984210@1726992000.060',
    cooperativeName: 'Current Active ESG Batch',
  },
];

interface RetiredCreditsBarChartProps {
  additionalRetirementKg?: number;
  recentRetirementNode?: string;
}

export const RetiredCreditsBarChart: React.FC<RetiredCreditsBarChartProps> = ({
  additionalRetirementKg = 0,
  recentRetirementNode = 'US-CAL-01-EDEN',
}) => {
  const [viewMode, setViewMode] = useState<'NODE' | 'DATE'>('NODE');
  const [hoveredPoint, setHoveredPoint] = useState<RetirementDataPoint | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Compute dataset taking into account any dynamic newly retired certificate amount
  const data = React.useMemo(() => {
    if (viewMode === 'NODE') {
      return DEFAULT_NODE_DATA.map((item) => {
        if (item.nodeId === recentRetirementNode && additionalRetirementKg > 0) {
          return {
            ...item,
            retiredKg: item.retiredKg + additionalRetirementKg,
          };
        }
        return item;
      });
    } else {
      return DEFAULT_DATE_DATA.map((item, idx) => {
        if (idx === DEFAULT_DATE_DATA.length - 1 && additionalRetirementKg > 0) {
          return {
            ...item,
            retiredKg: item.retiredKg + additionalRetirementKg,
          };
        }
        return item;
      });
    }
  }, [viewMode, additionalRetirementKg, recentRetirementNode]);

  const totalRetiredInView = React.useMemo(() => {
    return data.reduce((acc, curr) => acc + curr.retiredKg, 0);
  }, [data]);

  const maxPoint = React.useMemo(() => {
    return data.reduce((max, curr) => (curr.retiredKg > max.retiredKg ? curr : max), data[0]);
  }, [data]);

  // Render D3 chart
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 680;
    const height = 300;
    const margin = { top: 24, right: 20, bottom: 44, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`);

    // Gradient definitions
    const defs = svg.append('defs');

    // Primary bar gradient (Emerald to Cyan)
    const emeraldGrad = defs
      .append('linearGradient')
      .attr('id', 'bar-gradient-emerald')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    emeraldGrad.append('stop').attr('offset', '0%').attr('stop-color', '#34d399').attr('stop-opacity', 0.95);
    emeraldGrad.append('stop').attr('offset', '100%').attr('stop-color', '#059669').attr('stop-opacity', 0.65);

    // Purple bar gradient for Date view
    const purpleGrad = defs
      .append('linearGradient')
      .attr('id', 'bar-gradient-purple')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    purpleGrad.append('stop').attr('offset', '0%').attr('stop-color', '#a855f7').attr('stop-opacity', 0.95);
    purpleGrad.append('stop').attr('offset', '100%').attr('stop-color', '#7e22ce').attr('stop-opacity', 0.65);

    // Glow filter for highlighted bars
    const filter = defs.append('filter').attr('id', 'bar-glow').attr('x', '-20%').attr('y', '-20%').attr('width', '140%').attr('height', '140%');
    filter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'blur');
    filter.append('feComposite').attr('in', 'SourceGraphic').attr('in2', 'blur').attr('operator', 'over');

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // X Scale
    const xScale = d3
      .scaleBand()
      .domain(data.map((d) => d.label))
      .range([0, innerWidth])
      .padding(0.35);

    // Y Scale (kg to metric tons scale)
    const maxVal: number = d3.max(data, (d: RetirementDataPoint) => d.retiredKg) ?? 50000;
    const yScale = d3
      .scaleLinear()
      .domain([0, maxVal * 1.15])
      .nice()
      .range([innerHeight, 0]);

    // Horizontal grid lines
    const yGrid = d3.axisLeft(yScale).ticks(5).tickSize(-innerWidth).tickFormat(() => '');
    g.append('g')
      .attr('class', 'grid-lines')
      .call(yGrid)
      .selectAll('line')
      .attr('stroke', '#334155')
      .attr('stroke-opacity', 0.4)
      .attr('stroke-dasharray', '3,3');
    g.select('.grid-lines .domain').remove();

    // X Axis
    const xAxis = d3.axisBottom(xScale);
    const xAxisGroup = g
      .append('g')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(xAxis);

    xAxisGroup.select('.domain').attr('stroke', '#475569');
    xAxisGroup
      .selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-family', 'ui-monospace, monospace')
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .attr('dy', '1.1em');
    xAxisGroup.selectAll('line').attr('stroke', '#475569');

    // Y Axis (in Metric Tons)
    const yAxis = d3
      .axisLeft(yScale)
      .ticks(5)
      .tickFormat((d) => `${(Number(d) / 1000).toFixed(0)}t`);
    const yAxisGroup = g.append('g').call(yAxis);

    yAxisGroup.select('.domain').attr('stroke', '#475569');
    yAxisGroup
      .selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-family', 'ui-monospace, monospace')
      .attr('font-size', '10px');
    yAxisGroup.selectAll('line').attr('stroke', '#334155');

    // Y-Axis title
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -45)
      .attr('x', -innerHeight / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', '#64748b')
      .attr('font-family', 'ui-monospace, monospace')
      .attr('font-size', '10px')
      .text('RETIRED CARBON (tCO2e)');

    const barGradientId = viewMode === 'NODE' ? 'url(#bar-gradient-emerald)' : 'url(#bar-gradient-purple)';
    const barBorderColor = viewMode === 'NODE' ? '#6ee7b7' : '#c084fc';

    // Bars
    const bars = g
      .selectAll<SVGGElement, RetirementDataPoint>('.bar-group')
      .data(data)
      .enter()
      .append('g')
      .attr('class', 'bar-group')
      .style('cursor', 'pointer');

    // Bar background track for depth
    bars
      .append('rect')
      .attr('x', (d: RetirementDataPoint) => xScale(d.label) || 0)
      .attr('y', 0)
      .attr('width', xScale.bandwidth())
      .attr('height', innerHeight)
      .attr('fill', '#1e293b')
      .attr('fill-opacity', 0.25)
      .attr('rx', 6);

    // Active animated bar
    bars
      .append('rect')
      .attr('class', 'bar')
      .attr('x', (d: RetirementDataPoint) => xScale(d.label) || 0)
      .attr('y', innerHeight)
      .attr('width', xScale.bandwidth())
      .attr('height', 0)
      .attr('fill', barGradientId)
      .attr('stroke', barBorderColor)
      .attr('stroke-width', 1)
      .attr('stroke-opacity', 0.6)
      .attr('rx', 6)
      .transition()
      .duration(750)
      .ease(d3.easeCubicOut)
      .attr('y', (d: RetirementDataPoint) => yScale(d.retiredKg))
      .attr('height', (d: RetirementDataPoint) => innerHeight - yScale(d.retiredKg));

    // Value labels above bars
    bars
      .append('text')
      .attr('class', 'bar-label')
      .attr('x', (d: RetirementDataPoint) => (xScale(d.label) || 0) + xScale.bandwidth() / 2)
      .attr('y', innerHeight)
      .attr('text-anchor', 'middle')
      .attr('fill', '#e2e8f0')
      .attr('font-family', 'ui-monospace, monospace')
      .attr('font-size', '10px')
      .attr('font-weight', '700')
      .attr('opacity', 0)
      .text((d: RetirementDataPoint) => `${(d.retiredKg / 1000).toFixed(1)}t`)
      .transition()
      .delay(400)
      .duration(450)
      .attr('y', (d: RetirementDataPoint) => yScale(d.retiredKg) - 8)
      .attr('opacity', 1);

    // Interactive mouse listeners
    bars
      .on('mouseenter', function (event: MouseEvent, d: RetirementDataPoint) {
        d3.select(this).select('.bar')
          .attr('stroke-width', 2)
          .attr('stroke-opacity', 1)
          .attr('filter', 'url(#bar-glow)');
        
        d3.select(this).select('.bar-label')
          .attr('fill', '#ffffff')
          .attr('font-size', '11px');

        setHoveredPoint(d);
      })
      .on('mouseleave', function () {
        d3.select(this).select('.bar')
          .attr('stroke-width', 1)
          .attr('stroke-opacity', 0.6)
          .attr('filter', null);

        d3.select(this).select('.bar-label')
          .attr('fill', '#e2e8f0')
          .attr('font-size', '10px');

        setHoveredPoint(null);
      });
  }, [data, viewMode]);

  return (
    <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-5">
      {/* Header & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <span>Hedera dMRV Carbon Retirement Distribution</span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            D3-powered telemetry audit of permanently retired and burned HTS eco-credits.
          </p>
        </div>

        {/* Toggle between By Node ID vs By Date */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0 self-start sm:self-auto font-mono text-xs">
          <button
            type="button"
            onClick={() => setViewMode('NODE')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
              viewMode === 'NODE'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>By Node ID</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('DATE')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
              viewMode === 'DATE'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>By Timeline / Date</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Filtered View Total</div>
            <div className="text-base font-bold text-emerald-400">
              {(totalRetiredInView / 1000).toFixed(2)} tCO2e
            </div>
          </div>
          <TrendingUp className="w-4 h-4 text-emerald-500 opacity-60" />
        </div>

        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">
              {viewMode === 'NODE' ? 'Top Contributing Node' : 'Peak Audit Period'}
            </div>
            <div className="text-base font-bold text-white">
              {maxPoint.label} <span className="text-xs text-slate-400 font-normal">({(maxPoint.retiredKg / 1000).toFixed(1)}t)</span>
            </div>
          </div>
          <ShieldCheck className="w-4 h-4 text-purple-400 opacity-60" />
        </div>

        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Scope 3 Offset Value</div>
            <div className="text-base font-bold text-blue-400">
              ${((totalRetiredInView / 1000) * 35).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <Info className="w-4 h-4 text-blue-400 opacity-60" />
        </div>
      </div>

      {/* D3 Bar Chart SVG Container */}
      <div ref={containerRef} className="w-full relative overflow-x-auto pt-2">
        <svg ref={svgRef} className="w-full select-none" />

        {/* Contextual Data Hover Overlay */}
        {hoveredPoint && (
          <div className="mt-3 p-3 bg-slate-950 border border-slate-700/80 rounded-xl font-mono text-xs text-slate-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-slide-up shadow-xl">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-sm">{hoveredPoint.label}</span>
                {hoveredPoint.secondaryLabel && (
                  <span className="text-[11px] text-slate-400">({hoveredPoint.secondaryLabel})</span>
                )}
                <span className="px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/60 text-[10px]">
                  {hoveredPoint.cooperativeName}
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                Hedera HTS Transaction: <span className="text-slate-200">{hoveredPoint.htsTxId}</span> • Date: <span className="text-slate-200">{hoveredPoint.date}</span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-right self-end sm:self-auto shrink-0">
              <div>
                <div className="text-[10px] text-slate-400">Retired CO2e</div>
                <div className="text-emerald-400 font-bold text-sm">
                  {hoveredPoint.retiredKg.toLocaleString()} kg ({ (hoveredPoint.retiredKg / 1000).toFixed(2) } t)
                </div>
              </div>
              <div className="border-l border-slate-800 pl-4">
                <div className="text-[10px] text-slate-400">Market Value ($35/t)</div>
                <div className="text-blue-400 font-bold text-sm">
                  ${((hoveredPoint.retiredKg / 1000) * 35).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
