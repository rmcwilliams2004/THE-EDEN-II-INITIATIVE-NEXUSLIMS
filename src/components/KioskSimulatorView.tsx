import React, { useState } from 'react';
import { 
  CreditCard, Sparkles, CheckCircle2, RotateCcw, Lock, 
  Droplet, Wheat, Coffee, Sprout, Trees, Mic, Radio, Volume2, AlertTriangle, ShieldCheck 
} from 'lucide-react';

export type CropType = 'maize' | 'coffee' | 'wheat' | 'soybean';

export const KioskSimulatorView: React.FC = () => {
  const [selectedCrop, setSelectedCrop] = useState<CropType>('maize');
  const [fillVolume, setFillVolume] = useState<number>(20);
  const [valveStatus, setValveStatus] = useState<'locked' | 'ready' | 'dispensing' | 'complete'>('locked');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastTranscript, setLastTranscript] = useState<string>('');
  const [authenticatedFarmer, setAuthenticatedFarmer] = useState<{
    name: string;
    cardId: string;
    coop: string;
    credits: number;
  } | null>(null);

  const simulateNfcTap = (farmer: 'JUMA' | 'MARIA') => {
    if (farmer === 'JUMA') {
      setAuthenticatedFarmer({
        name: 'Juma Kibet',
        cardId: 'NFC-JUMA-8821',
        coop: 'Rift Valley Eco-Growers Coop',
        credits: 42,
      });
      setSelectedCrop('maize');
      setFillVolume(20);
      setValveStatus('ready');
      setLastTranscript('Habari Juma! Kadi yako imetambuliwa. Umegawiwa lita 20 za mbolea salama ya mahindi (1% N foliar). <cmd>{"ui_icon":"maize","ui_fill_level":20,"valve_status":"ready"}</cmd>');
    } else {
      setAuthenticatedFarmer({
        name: 'Maria Santos',
        cardId: 'NFC-MARIA-4029',
        coop: 'Rift Valley Eco-Growers Coop',
        credits: 28,
      });
      setSelectedCrop('coffee');
      setFillVolume(15);
      setValveStatus('ready');
      setLastTranscript('Habari Maria! Kahawa imechaguliwa. Lita 15 ziko tayari kutolewa. <cmd>{"ui_icon":"coffee","ui_fill_level":15,"valve_status":"ready"}</cmd>');
    }
  };

  const handleVoicePush = () => {
    setIsListening(true);
    setLastTranscript('Listening to spoken prompt...');
    setTimeout(() => {
      setIsListening(false);
      setIsSpeaking(true);
      setLastTranscript('Nimekuelewa. Ninaweka lita 20 za mbolea salama kwa mahindi. Vuta mpini kutoa mbolea. <cmd>{"ui_icon":"maize","ui_fill_level":20,"valve_status":"ready"}</cmd>');
      setSelectedCrop('maize');
      setFillVolume(20);
      setValveStatus('ready');
      setTimeout(() => setIsSpeaking(false), 2500);
    }, 2000);
  };

  const handleDispense = () => {
    if (valveStatus !== 'ready') return;
    setValveStatus('dispensing');
    setTimeout(() => {
      setValveStatus('complete');
    }, 3000);
  };

  const handleReset = () => {
    setAuthenticatedFarmer(null);
    setValveStatus('locked');
    setFillVolume(20);
    setLastTranscript('');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-pulse" />
          <div>
            <h2 className="text-base font-bold text-white uppercase tracking-wider font-mono">
              20-FT SISTER KIOSK • OUTDOOR HIGH-CONTRAST INTERFACE
            </h2>
            <p className="text-xs text-slate-400">
              Zero-literacy voice & icon kiosk for smallholder foliar fertilizer dispensing (1.0% N verified).
            </p>
          </div>
        </div>

        {/* Quick NFC Simulators */}
        <div className="flex items-center gap-2">
          {authenticatedFarmer ? (
            <div className="flex items-center gap-2 bg-emerald-950 border border-emerald-500/60 px-3 py-1.5 rounded-xl text-xs font-mono text-emerald-300">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-white">{authenticatedFarmer.name}</span>
              <button onClick={handleReset} className="ml-2 text-slate-400 hover:text-white">✕</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => simulateNfcTap('JUMA')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-mono font-bold text-amber-400"
              >
                Tap NFC: Juma (20L Maize)
              </button>
              <button
                onClick={() => simulateNfcTap('MARIA')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-mono font-bold text-amber-400"
              >
                Tap NFC: Maria (15L Coffee)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Kiosk Screen */}
      <div className="bg-slate-950 border-2 border-slate-800 rounded-3xl p-6 md:p-8">
        {valveStatus === 'complete' ? (
          <div className="bg-emerald-950/80 border-2 border-emerald-500 rounded-2xl p-8 flex flex-col items-center gap-4 text-center">
            <CheckCircle2 className="w-20 h-20 text-emerald-400 animate-bounce" />
            <h3 className="text-3xl font-black text-white uppercase">DISPENSE COMPLETE / UMEMALIZA!</h3>
            <p className="text-emerald-200 text-sm">
              {fillVolume} Liters of 1.0% N aqueous foliar fertilizer dispensed safely.
            </p>
            <div className="bg-emerald-900/60 border border-emerald-400/60 px-4 py-2 rounded-xl flex items-center gap-2 text-yellow-300 text-xs font-bold font-mono">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              +1 EcoCredit Token Minted for {authenticatedFarmer?.coop || 'Rift Valley Coop'}
            </div>
            <button
              onClick={handleReset}
              className="mt-4 px-6 py-3 bg-white hover:bg-slate-200 text-slate-950 font-black rounded-xl text-sm flex items-center gap-2 uppercase tracking-wider"
            >
              <RotateCcw className="w-4 h-4" /> Next Smallholder Farmer
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Left: Crop Selector & PTT Voice */}
            <div className="flex flex-col items-center gap-6">
              <div className="w-full">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 block text-center mb-3">
                  CHAGUA ZAO / SELECT CROP
                </span>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'maize' as CropType, label: 'MAIZE / CORN', icon: <Sprout className="w-8 h-8" /> },
                    { id: 'coffee' as CropType, label: 'COFFEE', icon: <Coffee className="w-8 h-8" /> },
                    { id: 'wheat' as CropType, label: 'WHEAT', icon: <Wheat className="w-8 h-8" /> },
                    { id: 'soybean' as CropType, label: 'SOYBEAN', icon: <Trees className="w-8 h-8" /> },
                  ].map((crop) => {
                    const isSel = selectedCrop === crop.id;
                    return (
                      <button
                        key={crop.id}
                        onClick={() => setSelectedCrop(crop.id)}
                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                          isSel 
                            ? 'bg-slate-900 border-amber-400 text-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.3)] scale-105' 
                            : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                        }`}
                      >
                        {crop.icon}
                        <span className="text-[10px] font-black tracking-wider uppercase">{crop.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Push to Talk Button */}
              <div className="flex flex-col items-center gap-2">
                <button
                  onMouseDown={handleVoicePush}
                  className={`w-32 h-32 rounded-full flex flex-col items-center justify-center border-4 shadow-xl transition-all ${
                    isListening 
                      ? 'bg-emerald-500 text-slate-950 border-white animate-pulse' 
                      : isSpeaking 
                        ? 'bg-blue-600 text-white border-blue-300'
                        : 'bg-slate-900 text-emerald-400 border-emerald-500 hover:bg-slate-850'
                  }`}
                >
                  {isListening ? (
                    <>
                      <Radio className="w-10 h-10 animate-spin" />
                      <span className="text-[9px] font-black mt-1">LISTENING</span>
                    </>
                  ) : isSpeaking ? (
                    <>
                      <Volume2 className="w-10 h-10 animate-bounce" />
                      <span className="text-[9px] font-black mt-1">SPEAKING</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-10 h-10" />
                      <span className="text-[9px] font-black mt-1">HOLD TO TALK</span>
                    </>
                  )}
                </button>
                <span className="text-[10px] uppercase font-bold text-slate-500">Gemini Multimodal Live Voice</span>
              </div>
            </div>

            {/* Right: Tank Level & Pull Lever */}
            <div className="flex flex-col items-center gap-6">
              <div className="w-full bg-slate-900/80 border-2 border-slate-800 rounded-2xl p-6 flex flex-col items-center gap-4">
                <div className="w-full flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">DISPENSE TANK LEVEL</span>
                    <div className="text-4xl font-black text-white font-mono mt-1">
                      {fillVolume} <span className="text-lg text-emerald-400">LITERS</span>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-400">1.0% N Foliar Concentration Verified</span>
                  </div>

                  <div className="w-12 h-28 bg-slate-950 rounded-xl border border-slate-700 p-1 flex flex-col-reverse relative overflow-hidden">
                    <div 
                      className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-lg transition-all duration-300"
                      style={{ height: `${(fillVolume / 20) * 100}%` }}
                    />
                  </div>
                </div>

                {valveStatus === 'ready' ? (
                  <button
                    onClick={handleDispense}
                    className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-lg uppercase tracking-wider rounded-xl border-2 border-white shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all animate-pulse"
                  >
                    PULL LEVER TO DISPENSE / VUTA LEVER
                  </button>
                ) : valveStatus === 'dispensing' ? (
                  <div className="w-full py-4 bg-blue-950 border border-blue-500 rounded-xl flex items-center justify-center gap-2 text-blue-300 font-bold uppercase text-sm">
                    <Droplet className="w-5 h-5 animate-bounce" /> DISPENSING SAFE FERTILIZER...
                  </div>
                ) : (
                  <div className="w-full py-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center gap-2 text-slate-500 font-bold uppercase text-xs">
                    <Lock className="w-4 h-4" /> TAP NFC CARD OR USE VOICE TO UNLOCK
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Live Audio Transcript */}
        {lastTranscript && (
          <div className="mt-6 p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-xs font-mono text-slate-300">
            <span className="text-emerald-400 font-bold">Voice Assistant:</span> {lastTranscript}
          </div>
        )}
      </div>
    </div>
  );
};
