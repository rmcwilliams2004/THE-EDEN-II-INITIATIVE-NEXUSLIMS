import React, { useState } from 'react';
import { useGeminiLive } from '../hooks/useGeminiLive';
import { useNFCReader } from '../hooks/useNFCReader';
import { VoicePushToTalk } from '../components/VoicePushToTalk';
import { IconCropSelector, CropIconKey } from '../components/IconCropSelector';
import { DispenseGauge } from '../components/DispenseGauge';
import { CreditCard, Award, Sparkles, CheckCircle2, RotateCcw, AlertTriangle } from 'lucide-react';

export default function KioskPage() {
  const {
    isListening,
    isSpeaking,
    lastAudioTranscript,
    currentCommand,
    setCurrentCommand,
    startVoiceSession,
    stopVoiceSession,
  } = useGeminiLive();

  const { currentUser, simulateTap, clearSession } = useNFCReader((user) => {
    setCurrentCommand((prev) => ({
      ...prev,
      ui_icon: user.allocatedCrop,
      ui_fill_level: user.allocatedVolumeLiters,
      valve_status: 'ready',
      farmer_name: user.farmerName,
    }));
  });

  const [dispenseProgress, setDispenseProgress] = useState(false);
  const [dispensedDone, setDispensedDone] = useState(false);

  const handleDispenseLever = () => {
    if (currentCommand.valve_status !== 'ready') return;
    setDispenseProgress(true);
    setCurrentCommand((prev) => ({ ...prev, valve_status: 'dispensing' }));

    setTimeout(() => {
      setDispenseProgress(false);
      setDispensedDone(true);
      setCurrentCommand((prev) => ({ ...prev, valve_status: 'complete', eco_credits_earned: 1 }));
    }, 4000);
  };

  const handleReset = () => {
    clearSession();
    setDispensedDone(false);
    setDispenseProgress(false);
    setCurrentCommand({
      ui_icon: 'maize',
      ui_fill_level: 20,
      valve_status: 'locked',
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 flex flex-col items-center justify-between font-sans">
      {/* Top Header: NFC Status & Sister Node ID */}
      <header className="w-full max-w-4xl flex items-center justify-between border-b-4 border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-full bg-emerald-500 animate-ping" />
          <span className="font-black text-sm uppercase tracking-widest text-emerald-400 font-mono">
            EDEN II • 20FT SISTER KIOSK [KE-RIFT-01]
          </span>
        </div>

        {currentUser ? (
          <div className="flex items-center gap-3 bg-emerald-950/80 border-2 border-emerald-500 px-4 py-1.5 rounded-full">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-extrabold text-white uppercase">{currentUser.farmerName}</span>
            <span className="text-xs font-mono bg-emerald-800 px-2 py-0.5 rounded text-emerald-200">
              {currentUser.ecoCreditsBalance} EcoCredits
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => simulateTap('JUMA')}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-xs font-mono font-bold text-amber-400"
            >
              TAP NFC: JUMA (20L Maize)
            </button>
            <button
              onClick={() => simulateTap('MARIA')}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-xs font-mono font-bold text-amber-400"
            >
              TAP NFC: MARIA (15L Coffee)
            </button>
          </div>
        )}
      </header>

      {/* Main Kiosk Viewport */}
      <main className="w-full max-w-4xl flex-1 flex flex-col justify-center items-center gap-8 my-6">
        {dispensedDone ? (
          <div className="w-full bg-emerald-950/90 border-4 border-emerald-500 rounded-3xl p-8 flex flex-col items-center gap-6 text-center animate-in zoom-in">
            <CheckCircle2 className="w-24 h-24 text-emerald-400 animate-bounce" />
            <h1 className="text-4xl font-black uppercase text-white">
              DISPENSE COMPLETE! / UMEMALIZA!
            </h1>
            <p className="text-xl text-emerald-200">
              {currentCommand.ui_fill_level} Liters of 1% Foliar Fertilizer successfully dispensed.
            </p>
            <div className="bg-emerald-900/60 border-2 border-emerald-400 p-4 rounded-2xl flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-yellow-400" />
              <span className="text-lg font-bold text-yellow-300">
                +1 EcoCredit Token Minted for {currentUser?.cooperativeName || 'Rift Valley Coop'}
              </span>
            </div>
            <button
              onClick={handleReset}
              className="mt-4 px-8 py-4 bg-white text-slate-950 hover:bg-slate-200 font-black rounded-2xl text-xl flex items-center gap-2"
            >
              <RotateCcw className="w-6 h-6" /> NEXT FARMER / MTU MWINGINE
            </button>
          </div>
        ) : (
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Left Column: Visual Crop Selector & Push-to-Talk */}
            <div className="flex flex-col items-center gap-8">
              <IconCropSelector
                selectedCrop={currentCommand.ui_icon}
                onSelectCrop={(crop) => setCurrentCommand((prev) => ({ ...prev, ui_icon: crop }))}
              />

              <VoicePushToTalk
                isListening={isListening}
                isSpeaking={isSpeaking}
                onPress={startVoiceSession}
                onRelease={stopVoiceSession}
              />
            </div>

            {/* Right Column: High-Contrast Volume & Dispense Gauge */}
            <div className="flex flex-col items-center gap-6">
              <DispenseGauge
                currentLiters={currentCommand.ui_fill_level}
                valveStatus={currentCommand.valve_status}
              />

              {currentCommand.valve_status === 'ready' && (
                <button
                  onClick={handleDispenseLever}
                  disabled={dispenseProgress}
                  className="w-full py-6 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-2xl uppercase rounded-3xl border-4 border-white shadow-[0_0_40px_rgba(16,185,129,0.8)] transition-all animate-pulse"
                >
                  PULL PHYSICAL LEVER / VUTA LEVER
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Live AI Audio Transcript Overlay */}
      {lastAudioTranscript && (
        <div className="w-full max-w-4xl bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-300">
          <span className="text-emerald-400 font-bold">AI Response:</span> {lastAudioTranscript}
        </div>
      )}
    </div>
  );
}
