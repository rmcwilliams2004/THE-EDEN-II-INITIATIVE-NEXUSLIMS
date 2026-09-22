import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  ExternalLink,
  ShieldCheck,
  Check,
  Copy,
  Maximize2,
  X,
  Printer,
  Sparkles,
  Search,
  CheckCircle2,
} from 'lucide-react';

export interface HederaQrCodeVerificationProps {
  txHash: string;
  certificateId: string;
  amountKg: number;
  topicId?: string;
  beneficiary?: string;
  timestamp?: string;
  className?: string;
}

export const HederaQrCodeVerification: React.FC<HederaQrCodeVerificationProps> = ({
  txHash,
  certificateId,
  amountKg,
  topicId = '0.0.984210',
  beneficiary = 'SunValley Ag Enterprises',
  timestamp = new Date().toISOString(),
  className = '',
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isFullModalOpen, setIsFullModalOpen] = useState<boolean>(false);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(true);

  const verificationUrl = `https://hashscan.io/mainnet/transaction/${encodeURIComponent(txHash)}`;

  useEffect(() => {
    let isMounted = true;
    setIsGenerating(true);

    QRCode.toDataURL(verificationUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: '#0f172a', // Deep slate for high-contrast crisp readability
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })
      .then((url) => {
        if (isMounted) {
          setQrDataUrl(url);
          setIsGenerating(false);
        }
      })
      .catch((err) => {
        console.error('[HederaQrCodeVerification] Failed to generate QR code:', err);
        setIsGenerating(false);
      });

    return () => {
      isMounted = false;
    };
  }, [verificationUrl]);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(verificationUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  const handlePrintPhysicalCertificate = () => {
    window.print();
  };

  return (
    <div
      className={`p-4 sm:p-5 bg-slate-900/90 rounded-2xl border border-purple-500/40 font-mono shadow-xl relative overflow-hidden backdrop-blur-md ${className}`}
    >
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/15 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col md:flex-row items-center justify-between gap-5">
        {/* Left Side: Physical Verification Metadata */}
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/40">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                Physical Auditor QR Verification
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  LIVE HASHSCAN LINK
                </span>
              </span>
              <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                Scan with any smartphone camera or ISO 14064 optical scanner for instant on-chain proof of token burn.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Audited Hedera TX:</span>
              <span className="text-purple-300 font-bold break-all">{txHash}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Consensus Topic:</span>
              <span className="text-emerald-400 font-bold">{topicId} (HCS)</span>
            </div>
          </div>

          {/* Action Links */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              onClick={() => setIsFullModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 hover:text-white border border-purple-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Full-Screen Inspection HUD</span>
            </button>

            <button
              onClick={handleCopyUrl}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedUrl ? 'URL Copied' : 'Copy Explorer URL'}</span>
            </button>

            <a
              href={verificationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-purple-400" />
              <span>Open HashScan</span>
            </a>
          </div>
        </div>

        {/* Right Side: QR Code Display Frame with Auditor Viewfinder HUD */}
        <div className="relative shrink-0 flex flex-col items-center gap-2">
          <div
            onClick={() => setIsFullModalOpen(true)}
            className="p-2.5 bg-white rounded-xl shadow-2xl border-2 border-purple-500/80 cursor-pointer group hover:scale-105 transition-all relative overflow-hidden"
            title="Click to expand Auditor Inspection Mode"
          >
            {/* Viewfinder corner lines */}
            <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-purple-600 pointer-events-none" />
            <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-purple-600 pointer-events-none" />
            <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-purple-600 pointer-events-none" />
            <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-purple-600 pointer-events-none" />

            {isGenerating ? (
              <div className="w-28 h-28 flex items-center justify-center text-slate-400 text-xs">
                Generating...
              </div>
            ) : qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`Hedera QR Verification for ${txHash}`}
                className="w-28 h-28 object-contain rounded-lg"
              />
            ) : (
              <div className="w-28 h-28 flex items-center justify-center text-red-500 text-xs">
                Error
              </div>
            )}
          </div>
          <span className="text-[10px] text-purple-300 font-bold flex items-center gap-1">
            <Search className="w-3 h-3" />
            Scan to Verify TX
          </span>
        </div>
      </div>

      {/* Full-Screen Auditor Inspection Modal */}
      {isFullModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn font-sans">
          <div className="bg-slate-950 border-2 border-purple-500/60 rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl relative text-slate-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-[10px] px-2 py-0.5 rounded uppercase font-bold bg-purple-950 text-purple-300 border border-purple-800">
                    AUDITOR VERIFICATION HUD
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded uppercase font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    HTS BURN IMMUTABLE
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white font-mono leading-tight">
                  Scope 3 Physical ESG Verification
                </h3>
              </div>
              <button
                onClick={() => setIsFullModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* High-Resolution QR Centerpiece */}
            <div className="flex flex-col items-center justify-center p-6 bg-slate-900/80 rounded-2xl border border-purple-500/40 gap-4">
              <div className="p-4 bg-white rounded-2xl shadow-2xl border-4 border-purple-500 relative">
                {/* Viewfinder crosshairs */}
                <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-purple-600 pointer-events-none" />
                <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-purple-600 pointer-events-none" />
                <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-purple-600 pointer-events-none" />
                <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-purple-600 pointer-events-none" />

                {qrDataUrl && (
                  <img
                    src={qrDataUrl}
                    alt="Hedera Audit QR"
                    className="w-56 h-56 object-contain rounded-xl"
                  />
                )}
              </div>

              <div className="text-center space-y-1">
                <div className="text-sm font-bold text-white font-mono">
                  {amountKg.toLocaleString()} kg CO2e ({(amountKg / 1000).toFixed(3)} tCO2e)
                </div>
                <div className="text-xs text-purple-300 font-mono">
                  Certificate Ref: {certificateId}
                </div>
                <div className="text-[11px] text-slate-400 font-sans">
                  Beneficiary: <strong className="text-slate-200">{beneficiary}</strong>
                </div>
              </div>
            </div>

            {/* Verification Metadata Box */}
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs font-mono space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Hedera Tx ID:</span>
                <span className="text-purple-300 font-bold truncate max-w-[240px]">{txHash}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Topic Consensus:</span>
                <span className="text-emerald-400 font-bold">{topicId}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Timestamp:</span>
                <span className="text-slate-300">{new Date(timestamp).toLocaleString()}</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
              <button
                onClick={handlePrintPhysicalCertificate}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs font-mono flex items-center gap-1.5 transition-colors"
              >
                <Printer className="w-4 h-4 text-purple-400" />
                <span>Print Physical Certificate</span>
              </button>

              <div className="flex items-center gap-2">
                <a
                  href={verificationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs font-mono flex items-center gap-1.5 transition-colors shadow-lg shadow-purple-950/60"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>HashScan Live</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HederaQrCodeVerification;
