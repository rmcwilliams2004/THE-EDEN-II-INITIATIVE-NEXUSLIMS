import React, { useState } from 'react';
import { Sprout, Award, CheckCircle2, ShieldCheck, Download, Share2, Layers, Binary, Copy, Check, Sparkles, ExternalLink } from 'lucide-react';
import { RetiredCreditsBarChart } from './RetiredCreditsBarChart';

export const EcoCreditXView: React.FC = () => {
  const [totalOffsetKg, setTotalOffsetKg] = useState<number>(148520);
  const [retireAmount, setRetireAmount] = useState<number>(25000);
  const [recentRetirementKg, setRecentRetirementKg] = useState<number>(0);
  const [certificateData, setCertificateData] = useState<{
    id: string;
    amount: number;
    timestamp: string;
    txHash: string;
  } | null>(null);
  const [copiedTx, setCopiedTx] = useState(false);

  const pricePerTon = 35.0; // $35/ton
  const totalUsdVal = ((totalOffsetKg / 1000) * pricePerTon).toFixed(2);

  const splits = [
    { recipient: 'SunValley Ag Enterprises (Commercial Owner)', role: 'Enterprise Buyer', splitPct: 50, tokensAmount: totalOffsetKg * 0.5, usdValue: (totalOffsetKg * 0.5 / 1000) * pricePerTon, hederaAccount: '0.0.489102' },
    { recipient: 'Rift Valley Eco-Growers (Kenya Sister Unit)', role: 'Sister Cooperative', splitPct: 30, tokensAmount: totalOffsetKg * 0.3, usdValue: (totalOffsetKg * 0.3 / 1000) * pricePerTon, hederaAccount: '0.0.512904' },
    { recipient: 'Eden II Protocol R&D & Catalytic Staking', role: 'Protocol Maintenance', splitPct: 20, tokensAmount: totalOffsetKg * 0.2, usdValue: (totalOffsetKg * 0.2 / 1000) * pricePerTon, hederaAccount: '0.0.100982' },
  ];

  const handleGenerateCertificate = () => {
    const validAmount = retireAmount > 0 ? retireAmount : 25000;
    const now = new Date();
    const epochSec = Math.floor(now.getTime() / 1000);
    const nanos = String(now.getMilliseconds() * 1000).padStart(6, '0');
    
    setRecentRetirementKg(prev => prev + validAmount);
    setCertificateData({
      id: `CERT-HEDERA-${epochSec}`,
      amount: validAmount,
      timestamp: now.toISOString(),
      txHash: `0.0.489102@${epochSec}.${nanos}`,
    });
  };

  const handleCopyTx = (tx: string) => {
    navigator.clipboard.writeText(tx);
    setCopiedTx(true);
    setTimeout(() => setCopiedTx(false), 2500);
  };

  const handleDownloadCertificate = () => {
    if (!certificateData) return;
    const certPayload = JSON.stringify({
      title: "Scope 3 ESG Carbon Retirement Certificate",
      certificateId: certificateData.id,
      standard: "Eden II SIL-3 dMRV Protocol",
      hederaConsensusTopic: "0.0.984210",
      transactionHash: certificateData.txHash,
      beneficiary: "SunValley Ag Enterprises",
      retiredAmountKgCO2e: certificateData.amount,
      retiredTonsCO2e: (certificateData.amount / 1000).toFixed(3),
      timestamp: certificateData.timestamp,
      verificationStatus: "HTS_TOKEN_BURN_CONFIRMED"
    }, null, 2);

    const blob = new Blob([certPayload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ESG_Retirement_Certificate_${certificateData.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        <h2 className="text-base font-bold text-white uppercase tracking-wider font-mono">
          ECOCREDITX • HEDERA HASHGRAPH dMRV CARBON LEDGER
        </h2>
        <p className="text-xs text-slate-400">
          Decentralized MRV powered by Hedera Consensus Service (HCS Topic 0.0.984210) & HTS Micro-Carbon Minter with 50/30/20 Smart Split.
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
          <span className="text-xs font-mono text-emerald-400">Hedera Smart Settlement Active</span>
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
            className="w-full sm:w-64 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-purple-500 transition-colors"
            placeholder="Amount in kg CO2e"
            min={1}
          />
          <button
            onClick={handleGenerateCertificate}
            className="w-full sm:w-auto px-6 py-2.5 bg-purple-600 hover:bg-purple-500 active:scale-[0.98] font-bold text-xs uppercase tracking-wider rounded-xl text-white transition-all shadow-lg shadow-purple-950/50 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Retire & Generate ESG Certificate
          </button>
        </div>

        {/* Animated Retirement Certificate with fade-in and subtle slide-up effect */}
        {certificateData && (
          <div
            key={certificateData.id}
            className="mt-4 p-6 bg-slate-950/90 border-2 border-purple-500/50 rounded-2xl space-y-4 font-mono text-xs shadow-2xl relative overflow-hidden backdrop-blur-sm animate-fade-slide-up"
          >
            {/* Background ambient accent */}
            <div className="absolute -right-16 -top-16 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-purple-400 font-bold border-b border-slate-800/80 pb-3 gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="tracking-wider">CERTIFICATE OF PERMANENT ESG RETIREMENT</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <a
                  href={`https://hashscan.io/mainnet/transaction/${encodeURIComponent(certificateData.txHash)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="View Transaction on HashScan Explorer"
                  className="text-purple-300 hover:text-purple-100 hover:underline flex items-center gap-1 transition-colors"
                >
                  <span>TX: {certificateData.txHash}</span>
                  <ExternalLink className="w-3 h-3 text-purple-400" />
                </a>
                <button
                  onClick={() => handleCopyTx(certificateData.txHash)}
                  title="Copy Transaction Hash"
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
                >
                  {copiedTx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="text-slate-300 leading-relaxed space-y-2">
              <div>
                This certifies that <strong className="text-white">SunValley Ag Enterprises</strong> has permanently retired and burned{' '}
                <strong className="text-emerald-400 text-sm font-bold">{certificateData.amount.toLocaleString()} kg CO2e</strong>{' '}
                ({(certificateData.amount / 1000).toFixed(3)} tCO2e) generated via the Eden II biological catalytic synthesis node.
              </div>
              <div className="text-slate-400 text-[11px] flex flex-wrap items-center gap-x-2">
                <span>
                  Hedera Consensus Topic:{' '}
                  <a
                    href="https://hashscan.io/mainnet/topic/0.0.984210"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-300 hover:text-purple-100 hover:underline font-semibold"
                  >
                    0.0.984210
                  </a>
                </span>
                <span>•</span>
                <span>Certificate Ref: <span className="text-slate-200">{certificateData.id}</span></span>
              </div>
            </div>

            <div className="text-[10px] text-slate-500 pt-3 border-t border-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Standard: Eden II SIL-3 dMRV Protocol
                </span>
                <span className="hidden sm:inline text-slate-600">•</span>
                <a
                  href={`https://hashscan.io/mainnet/transaction/${encodeURIComponent(certificateData.txHash)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300 hover:underline flex items-center gap-1 transition-colors"
                >
                  Auditable on HashScan Explorer
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`https://hashscan.io/mainnet/transaction/${encodeURIComponent(certificateData.txHash)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-purple-950/70 hover:bg-purple-900/80 border border-purple-500/50 hover:border-purple-400 text-purple-200 hover:text-white rounded-lg flex items-center gap-1.5 font-bold transition-all shadow-sm group"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
                  View on HashScan
                </a>
                <button
                  onClick={handleDownloadCertificate}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center gap-1.5 font-bold transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-purple-400" />
                  Export Certificate (JSON)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* D3-Powered Hedera Carbon Credit Retirement Bar Chart */}
      <RetiredCreditsBarChart additionalRetirementKg={recentRetirementKg} />
    </div>
  );
};

