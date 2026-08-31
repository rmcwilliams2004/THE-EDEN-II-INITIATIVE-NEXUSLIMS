import React, { useEffect, useState } from 'react';
import { Hexagon, CheckCircle2, Server, ArrowRight } from 'lucide-react';

export const VcmLedger = () => {
  const [ledger, setLedger] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/vcm/ledger')
      .then(res => res.json())
      .then(data => {
        setLedger(data);
        setLoading(false);
      });
  }, []);

  const totalCredits = ledger.reduce((sum, entry) => sum + (entry.creditMinted || 0), 0).toFixed(4);

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
        <div className="glass p-5 rounded-xl flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2 text-emerald-400">
            <Hexagon className="w-5 h-5" />
            <span className="text-xs uppercase tracking-widest font-bold">Total VCM Minted</span>
          </div>
          <div className="text-3xl telemetry-font font-bold">{totalCredits} <span className="text-sm text-slate-500">NXT</span></div>
        </div>
        <div className="glass p-5 rounded-xl flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2 text-slate-400">
            <Server className="w-5 h-5" />
            <span className="text-xs uppercase tracking-widest font-bold">Verified Blocks</span>
          </div>
          <div className="text-3xl telemetry-font font-bold text-slate-200">{ledger.length}</div>
        </div>
        <div className="glass p-5 rounded-xl flex flex-col justify-between bg-emerald-900/10 border-emerald-500/20">
          <div className="flex items-center gap-2 mb-2 text-emerald-500">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-xs uppercase tracking-widest font-bold">Ledger Status</span>
          </div>
          <div className="text-lg font-bold text-emerald-400 uppercase tracking-widest">Synchronized</div>
        </div>
      </div>

      <div className="glass flex-1 rounded-xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-800 bg-slate-900/50">
          <h3 className="text-sm uppercase tracking-widest text-slate-300 font-bold">Immutable Transaction Log</h3>
        </div>
        
        <div className="overflow-y-auto custom-scrollbar flex-1 p-4 space-y-3">
          {loading ? (
            <div className="text-center text-slate-500 py-8 telemetry-font text-xs animate-pulse">Syncing blockchain state...</div>
          ) : ledger.length === 0 ? (
            <div className="text-center text-slate-500 py-8 telemetry-font text-xs">No transactions in current block epoch.</div>
          ) : (
            ledger.map((entry) => (
              <div key={entry.id} className="p-4 rounded-lg bg-slate-900/40 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] rounded uppercase font-bold tracking-widest border border-emerald-500/20">
                      {entry.status}
                    </span>
                    <span className="text-xs text-slate-400 telemetry-font">{new Date(entry.timestamp).toISOString()}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                    <span>Node: <span className="text-slate-300 telemetry-font">{entry.nodeId}</span></span>
                    <ArrowRight className="w-3 h-3" />
                    <span>Hash: <span className="text-slate-300 telemetry-font text-[10px]">{entry.hash}</span></span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-right">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest">Minted</span>
                    <span className="text-emerald-400 font-bold telemetry-font">+{entry.creditMinted?.toFixed(4)} NXT</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
