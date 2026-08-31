import React from 'react';
import { Cpu, DollarSign, Globe, ShieldCheck, Sprout, ArrowRight } from 'lucide-react';

export default function WebPortalDashboard() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center space-y-3 py-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          EDEN II INITIATIVE / NEXUSLIMS Operating Platform
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl mx-auto">
          Autonomous, carbon-negative nitrogen synthesis with SIL-3 industrial failsafes, 
          sister-link humanitarian pairings, and Hedera Hashgraph dMRV on-chain micro-carbon credits.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <a 
          href="/fleet"
          className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/50 transition-all flex flex-col justify-between group"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4">
              <Globe className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">Global Fleet & Telemetry</h2>
            <p className="text-xs text-slate-400">
              Real-time Ru-catalyst bed thermal management (380°C–400°C), 2oo3 hydraulic intensifier pressure voting, and live SIL-3 logs.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 mt-6 group-hover:translate-x-1 transition-transform">
            View Fleet Dashboard <ArrowRight className="w-4 h-4" />
          </div>
        </a>

        <a 
          href="/onboarding"
          className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-blue-500/50 transition-all flex flex-col justify-between group"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-4">
              <DollarSign className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">Section 179 & REAP Grants</h2>
            <p className="text-xs text-slate-400">
              Calculate the $2.56M first-year Section 179 tax write-off and 50% USDA REAP grant matching for commercial deployment.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400 mt-6 group-hover:translate-x-1 transition-transform">
            Launch Financial Engine <ArrowRight className="w-4 h-4" />
          </div>
        </a>

        <a 
          href="/ecocreditx"
          className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-purple-500/50 transition-all flex flex-col justify-between group"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-4">
              <Sprout className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">EcoCreditX dMRV Engine</h2>
            <p className="text-xs text-slate-400">
              Hedera Consensus Service (HCS) immutable sensor telemetry logging & 50/30/20 sister-link revenue settlement.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-purple-400 mt-6 group-hover:translate-x-1 transition-transform">
            Open Carbon Ledger <ArrowRight className="w-4 h-4" />
          </div>
        </a>
      </div>
    </div>
  );
}
