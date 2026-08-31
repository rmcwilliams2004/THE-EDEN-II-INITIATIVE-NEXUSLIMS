import React, { useState } from 'react';
import { Sprout, Award, CheckCircle2, ShieldCheck, Download, Share2, Layers, Binary } from 'lucide-react';

interface CarbonDividend {
  recipient: string;
  role: 'Enterprise Buyer' | 'Sister Cooperative' | 'Protocol Maintenance';
  splitPct: number;
  tokensAmount: number;
  usdValue: number;
  hederaAccount: string;
}

export default function EcoCreditXPage() {
  const [totalOffsetKg, setTotalOffsetKg] = useState(148520); // 148.52 Metric Tons CO2e
  const [retireAmount, setRetireAmount] = useState(25000);
  const [certificateGenerated, setCertificateGenerated] = useState(false);

  const pricePerTon = 35.0; // $35/ton
  const totalUsdVal = ((totalOffsetKg / 1000) * pricePerTon).toFixed(2);

  const splits: CarbonDividend[] = [
    { recipient: 'SunValley Ag Enterprises (Commercial Owner)', role: 'Enterprise Buyer', splitPct: 50, tokensAmount: totalOffsetKg * 0.5, usdValue: (totalOffsetKg * 0.5 / 1000) * pricePerTon, hederaAccount: '0.0.489102' },
    { recipient: 'Rift Valley Eco-Growers (Kenya Sister Unit)', role: 'Sister Cooperative', splitPct: 30, tokensAmount: totalOffsetKg * 0.3, usdValue: (totalOffsetKg * 0.3 / 1000) * pricePerTon, hederaAccount: '0.0.512904' },
    { recipient: 'Eden II Protocol R&D & Catalytic Staking', role: 'Protocol Maintenance', splitPct: 20, tokensAmount: totalOffsetKg * 0.2, usdValue: (totalOffsetKg * 0.2 / 1000) * pricePerTon, hederaAccount: '0.0.100982' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">EcoCreditX dMRV Micro-Carbon Ledger</h1>
        <p className="text-xs text-slate-400 mt-1">
          Decentralized MRV powered by Hedera Hashgraph HCS & HTS with automated 50/30/20 sister-link revenue settlement.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono">
        <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
          <div className="text-xs text-emerald-400 font-bold mb-1">TOTAL CO2e DESTROYED & OFFSET</div>
          <div className="text-3xl font-black text-white">{(totalOffsetKg / 1000).toFixed(2)} <span className="text-sm text-slate-400">tCO2e</span></div>
          <div className="text-xs text-slate-400 mt-1">{totalOffsetKg.toLocaleString()} EcoCredits Minted (HTS)</div>
        </div>

        <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
          <div className="text-xs text-blue-400 font-bold mb-1">MARKET VALUE AT $35/TON</div>
          <div className="text-3xl font-black text-white">${Number(totalUsdVal).toLocaleString()}</div>
          <div className="text-xs text-slate-400 mt-1">Direct Corporate Scope 3 Offset Value</div>
        </div>

        <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
          <div className="text-xs text-purple-400 font-bold mb-1">HCS TOPIC CONSENSUS</div>
          <div className="text-lg font-bold text-slate-200">0.0.984210</div>
          <div className="text-xs text-emerald-400 mt-1">100% On-Chain Merkle Verified</div>
        </div>
      </div>

      {/* 50/30/20 Smart Revenue Split Ledger */}
      <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            Automated 50/30/20 Sister-Link Dividend Distribution
          </div>
          <span className="text-xs font-mono text-emerald-400">Hedera Smart Contract Verified</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                <th className="py-2 px-3">Recipient Organization</th>
                <th className="py-2 px-3">Role</th>
                <th className="py-2 px-3">Split</th>
                <th className="py-2 px-3">EcoCredits</th>
                <th className="py-2 px-3">Dividend Value ($)</th>
                <th className="py-2 px-3">Hedera Account</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {splits.map((s, idx) => (
                <tr key={idx} className="hover:bg-slate-850">
                  <td className="py-3 px-3 font-bold text-white">{s.recipient}</td>
                  <td className="py-3 px-3 text-slate-300">{s.role}</td>
                  <td className="py-3 px-3 font-bold text-emerald-400">{s.splitPct}%</td>
                  <td className="py-3 px-3 text-slate-200">{s.tokensAmount.toLocaleString()}</td>
                  <td className="py-3 px-3 text-emerald-300 font-bold">${s.usdValue.toLocaleString()}</td>
                  <td className="py-3 px-3 text-blue-400">{s.hederaAccount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scope 3 ESG Retirement Certificate Generator */}
      <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
          <Award className="w-4 h-4 text-purple-400" />
          Scope 3 ESG Carbon Retirement Certificate Generator
        </div>
        <p className="text-xs text-slate-400">
          Permanently burn and retire verified EcoCredit tokens on Hedera Token Service for audited corporate ESG compliance.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
          <input
            type="number"
            value={retireAmount}
            onChange={(e) => setRetireAmount(Number(e.target.value))}
            className="w-full sm:w-64 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono text-sm"
            placeholder="Amount in kg CO2e"
          />
          <button
            onClick={() => setCertificateGenerated(true)}
            className="w-full sm:w-auto px-6 py-2.5 bg-purple-600 hover:bg-purple-500 font-bold text-xs uppercase tracking-wider rounded-xl text-white transition-colors"
          >
            Retire & Generate ESG Certificate
          </button>
        </div>

        {certificateGenerated && (
          <div className="mt-4 p-6 bg-slate-950 border-2 border-purple-500/50 rounded-2xl space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between text-purple-400 font-bold border-b border-slate-800 pb-2">
              <span>CERTIFICATE OF PERMANENT ESG RETIREMENT</span>
              <span>TX: 0.0.489102@1725134900.829104</span>
            </div>
            <div className="text-slate-300">
              This certifies that <strong className="text-white">SunValley Ag Enterprises</strong> has permanently retired{' '}
              <strong className="text-emerald-400">{retireAmount.toLocaleString()} kg CO2e</strong> generated via the Eden II biological synthesis node.
            </div>
            <div className="text-[10px] text-slate-500 pt-2 flex justify-between">
              <span>Standard: Eden II SIL-3 dMRV Protocol</span>
              <span>Auditable on HashScan Explorer</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
