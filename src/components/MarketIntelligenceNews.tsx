import React, { useState, useEffect } from 'react';
import {
  Search,
  Globe,
  TrendingUp,
  Award,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  Sparkles,
  Layers,
  FileText,
  AlertCircle,
  Clock,
  ArrowUpRight,
  Bookmark,
  CheckCircle,
  Scale,
  Zap,
} from 'lucide-react';

export interface GroundedSource {
  title: string;
  url: string;
}

export interface MarketNewsResponse {
  summary: string;
  sources: GroundedSource[];
  searchQueries?: string[];
  timestamp: string;
  category: string;
  query: string;
  isFallback?: boolean;
}

export const MarketIntelligenceNews: React.FC = () => {
  const [category, setCategory] = useState<'ALL' | 'CARBON_CREDITS' | 'REGULATORY' | 'AGRICULTURE'>('ALL');
  const [customQuery, setCustomQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [data, setData] = useState<MarketNewsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const predefinedPrompts = [
    { label: '🌿 VCM Carbon Credit Prices', category: 'CARBON_CREDITS', query: 'Voluntary carbon credit market prices and Hedera dMRV token trends' },
    { label: '🏛️ USDA Section 179 & REAP Grants', category: 'REGULATORY', query: 'USDA Section 179 and REAP clean technology farm equipment grants' },
    { label: '⚡ Green Ammonia vs Gray Ammonia Delta', category: 'AGRICULTURE', query: 'Green ammonia price per ton vs traditional Haber-Bosch synthetic fertilizer' },
    { label: '🇪🇺 EU CBAM Fertilizer Regulations', category: 'REGULATORY', query: 'EU Carbon Border Adjustment Mechanism CBAM rules for agricultural fertilizer' },
    { label: '💧 Nitrogen Runoff & Soil Health Mandates', category: 'REGULATORY', query: 'Agricultural zero nitrogen runoff standards and groundwater compliance' },
  ];

  const fetchNews = async (searchQuery?: string, selectedCat?: string) => {
    setIsLoading(true);
    setError(null);
    const cat = selectedCat || category;
    const q = searchQuery !== undefined ? searchQuery : customQuery;

    try {
      const res = await fetch('/api/market/grounded-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, category: cat }),
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const result = await res.json();
      setData(result);
      setActiveQuery(q || result.query);
    } catch (err: any) {
      console.error('Failed to fetch grounded market news:', err);
      setError(err.message || 'Unable to connect to Google Search Grounding engine. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNews('', category);
  }, [category]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchNews(customQuery, category);
  };

  const handlePromptClick = (prompt: typeof predefinedPrompts[0]) => {
    setCategory(prompt.category as any);
    setCustomQuery(prompt.query);
    fetchNews(prompt.query, prompt.category);
  };

  return (
    <div className="flex-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar p-1">
      {/* Header Banner */}
      <div className="glass p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <Globe className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              Agri-Industry & Carbon Market Intelligence
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-blue-400" /> Google Search Grounding
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Real-time web verified commodity trends, voluntary carbon market (VCM) pricing, and regulatory shifts.
          </p>
        </div>

        <button
          onClick={() => fetchNews(activeQuery, category)}
          disabled={isLoading}
          className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono font-semibold flex items-center gap-2 border border-slate-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          <span>Refresh Live Grounding</span>
        </button>
      </div>

      {/* Live Market Indicators Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono uppercase">
            <span>VCM Carbon Index</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-base font-bold text-white font-mono mt-1">$35.40 <span className="text-xs text-emerald-400 font-normal">/ t CO2e</span></div>
          <div className="text-[10px] text-emerald-400 mt-0.5">+4.2% (30-Day Vol)</div>
        </div>

        <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono uppercase">
            <span>Sec. 179 Cap</span>
            <Scale className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-base font-bold text-white font-mono mt-1">$1,220,000</div>
          <div className="text-[10px] text-purple-400 mt-0.5">100% 1st-Year Expensing</div>
        </div>

        <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono uppercase">
            <span>Green NH3 Spot Delta</span>
            <Zap className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-base font-bold text-white font-mono mt-1">-$85 <span className="text-xs text-slate-400 font-normal">/ Ton vs Import</span></div>
          <div className="text-[10px] text-amber-400 mt-0.5">Zero Diesel Freight Margin</div>
        </div>

        <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono uppercase">
            <span>Hedera dMRV Consensus</span>
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-base font-bold text-white font-mono mt-1">&lt; $0.0001 <span className="text-xs text-slate-400 font-normal">/ Attestation</span></div>
          <div className="text-[10px] text-cyan-400 mt-0.5">Sub-second Finality</div>
        </div>
      </div>

      {/* Category Pills & Interactive Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
            <button
              onClick={() => setCategory('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                category === 'ALL'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Topics
            </button>
            <button
              onClick={() => setCategory('CARBON_CREDITS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                category === 'CARBON_CREDITS'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Carbon & VCM Markets
            </button>
            <button
              onClick={() => setCategory('REGULATORY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                category === 'REGULATORY'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Regulatory & Policy
            </button>
            <button
              onClick={() => setCategory('AGRICULTURE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                category === 'AGRICULTURE'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              AgTech & Fertilizers
            </button>
          </div>

          <span className="text-[11px] text-slate-500 font-mono">
            {data ? `Last Updated: ${new Date(data.timestamp).toLocaleTimeString()}` : ''}
          </span>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
            placeholder="Search any policy, crop market, tax incentive, or carbon standard (e.g. USDA fertilizer grant, EU CBAM, Verra dMRV)..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-24 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold text-xs font-mono transition-all disabled:opacity-50"
          >
            Search
          </button>
        </form>

        {/* Suggested Real-Time Queries */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] text-slate-500 font-mono">Quick Inquiries:</span>
          {predefinedPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handlePromptClick(p)}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-emerald-300 border border-slate-800 transition-all font-sans flex items-center gap-1"
            >
              <span>{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grounded Report Body */}
      <div className="glass p-5 rounded-2xl border border-slate-800 flex-1 flex flex-col gap-4">
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-center">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin" />
              <Sparkles className="w-5 h-5 text-emerald-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">Querying Google Search Grounding</h4>
              <p className="text-xs text-slate-400 max-w-sm">
                Retrieving real-time regulatory policies, agricultural commodity indexes, and carbon credit market changes...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-950/40 border border-red-500/40 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-red-300">Search Grounding Interruption</h4>
              <p className="text-xs text-red-200/80">{error}</p>
              <button
                onClick={() => fetchNews(activeQuery, category)}
                className="mt-2 px-3 py-1 rounded bg-red-900/60 hover:bg-red-800 text-white text-xs font-mono font-semibold"
              >
                Retry Request
              </button>
            </div>
          </div>
        ) : data ? (
          <div className="space-y-5">
            {/* Search metadata indicator */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                  Topic: {data.category}
                </span>
                <span className="text-xs text-slate-400 italic">"{data.query}"</span>
              </div>
              <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1.5">
                {data.isFallback ? (
                  <span className="text-[10px] text-amber-400 bg-amber-950/60 border border-amber-800 px-2 py-0.5 rounded flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-amber-400" />
                    Edge Industry Baseline (Quota Protected)
                  </span>
                ) : (
                  <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded flex items-center gap-1">
                    <Clock className="w-3 h-3 text-emerald-400" />
                    Live Web Grounded Telemetry
                  </span>
                )}
              </div>
            </div>

            {/* Structured Report Text */}
            <div className="prose prose-invert max-w-none text-slate-300 text-xs sm:text-sm leading-relaxed space-y-3 font-sans">
              {data.summary.split('\n\n').map((paragraph, pIdx) => {
                if (paragraph.startsWith('**') || paragraph.startsWith('###') || paragraph.startsWith('##')) {
                  const headingText = paragraph.replace(/^[#*]+\s*/, '').replace(/[*#]+$/, '');
                  return (
                    <h3 key={pIdx} className="text-base font-bold text-white text-emerald-400 mt-4 mb-2 flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{headingText}</span>
                    </h3>
                  );
                }
                return (
                  <p key={pIdx} className="text-slate-300 leading-relaxed">
                    {paragraph}
                  </p>
                );
              })}
            </div>

            {/* Grounding Web Sources Citation Box */}
            {data.sources && data.sources.length > 0 && (
              <div className="mt-6 pt-4 border-t border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                    <Globe className="w-3.5 h-3.5 text-emerald-400" />
                    Verified Web Grounding Sources ({data.sources.length})
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">Google Grounded Citations</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {data.sources.map((source, sIdx) => (
                    <a
                      key={sIdx}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-emerald-500/40 text-slate-300 hover:text-white transition-all flex items-start justify-between gap-2 group shadow-sm"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-slate-200 group-hover:text-emerald-300 line-clamp-1">
                          {source.title}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 truncate mt-0.5">
                          {new URL(source.url).hostname}
                        </div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 shrink-0 mt-0.5" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default MarketIntelligenceNews;
