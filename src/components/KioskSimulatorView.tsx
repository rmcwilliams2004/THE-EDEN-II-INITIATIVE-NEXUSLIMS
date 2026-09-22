import React, { useState } from 'react';
import { 
  CreditCard, Sparkles, CheckCircle2, RotateCcw, Lock, 
  Droplet, Wheat, Coffee, Sprout, Trees, Mic, Radio, Volume2, 
  AlertTriangle, ShieldCheck, MapPin, Globe, Apple, Flower2, Leaf 
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useGeminiLive } from '../hooks/useGeminiLive';
import { LanguageSelector } from './LanguageSelector';
import { ModeBFoliarDispenser } from '../../apps/kiosk-ui/src/components/ModeBFoliarDispenser';

export type CropType = 'maize' | 'coffee' | 'wheat' | 'soybean' | 'potatoes' | 'cassava' | 'rice' | 'sugarcane';

export const KioskSimulatorView: React.FC = () => {
  const { t, locale, localeProfile, gpsCoords } = useLanguage();
  const [selectedCrop, setSelectedCrop] = useState<CropType>('maize');
  const [fillVolume, setFillVolume] = useState<number>(20);
  const [valveStatus, setValveStatus] = useState<'locked' | 'ready' | 'dispensing' | 'complete'>('locked');
  const [isSimulatedListening, setIsSimulatedListening] = useState(false);
  const [isSimulatedSpeaking, setIsSimulatedSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const [authenticatedFarmer, setAuthenticatedFarmer] = useState<{
    name: string;
    cardId: string;
    coop: string;
    credits: number;
  } | null>(null);

  // Gemini Live WebRTC / Audio streaming integration with active zero-touch locale
  const { 
    isActive: isLiveActive, 
    status: liveStatus, 
    startSession: startLiveSession, 
    stopSession: stopLiveSession 
  } = useGeminiLive({
    locale,
    onTranscript: (txt) => setTranscript(txt)
  });

  const simulateNfcTap = (farmer: 'JUMA' | 'MARIA' | 'CARLOS') => {
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
      setTranscript(
        locale === 'sw-KE'
          ? 'Habari Juma! Kadi yako imetambuliwa. Umegawiwa lita 20 za mbolea salama ya mahindi (1% N foliar). Vuta mpini kutoa.'
          : locale === 'es-CO'
          ? '¡Hola Juma! Tarjeta identificada. Se han asignado 20L de fertilizante foliar para maíz (1% N). Mueva la palanca para dispensar.'
          : 'Hello Juma! Card verified. 20 Liters allocated for maize prescription (1% N foliar). Pull handle to dispense.'
      );
    } else if (farmer === 'MARIA') {
      setAuthenticatedFarmer({
        name: 'Maria Santos',
        cardId: 'NFC-MARIA-4029',
        coop: 'Andean Agri-Corridor Union',
        credits: 28,
      });
      setSelectedCrop('coffee');
      setFillVolume(15);
      setValveStatus('ready');
      setTranscript(
        locale === 'sw-KE'
          ? 'Habari Maria! Kahawa imechaguliwa. Lita 15 ziko tayari kutolewa.'
          : locale === 'es-CO'
          ? '¡Hola María! Cultivo de café seleccionado. 15 Litros listos para dispensar.'
          : 'Hello Maria! Coffee crop selected. 15 Liters ready for dispensing.'
      );
    } else {
      setAuthenticatedFarmer({
        name: 'Carlos Mendez',
        cardId: 'NFC-CARLOS-1193',
        coop: 'Cerrado Bio-Agro Cooperative',
        credits: 35,
      });
      setSelectedCrop('soybean');
      setFillVolume(20);
      setValveStatus('ready');
      setTranscript(
        locale === 'es-CO'
          ? '¡Bienvenido Carlos! Dispensando 20L de nutriente equilibrado para soja.'
          : 'Welcome Carlos! 20L nutrient allocation ready for soybean crop.'
      );
    }
  };

  const handleVoicePush = async () => {
    if (isLiveActive) {
      stopLiveSession();
      return;
    }

    try {
      await startLiveSession(locale);
    } catch {
      // Fallback simulated voice prompt with exact locale phrasing
      setIsSimulatedListening(true);
      setTranscript(t('listening', 'Listening in regional dialect...'));
      setTimeout(() => {
        setIsSimulatedListening(false);
        setIsSimulatedSpeaking(true);
        const spoken = 
          locale === 'sw-KE'
            ? 'Nimekuelewa. Ninaweka lita 20 za mbolea salama kwa mahindi. Vuta mpini kutoa mbolea.'
            : locale === 'es-CO'
            ? 'Entendido. Configurando 20 litros de fertilizante foliar para maíz. Tire de la palanca.'
            : locale === 'fr-SN'
            ? 'Compris. Attribution de 20 litres d\'engrais foliaire pour le maïs. Tirez le levier.'
            : 'Understood. Setting 20 Liters of safe foliar fertilizer for maize. Pull the handle.';
        setTranscript(spoken);
        setSelectedCrop('maize');
        setFillVolume(20);
        setValveStatus('ready');
        setTimeout(() => setIsSimulatedSpeaking(false), 2500);
      }, 1500);
    }
  };

  const handleDispense = () => {
    if (valveStatus !== 'ready') return;
    setValveStatus('dispensing');
    setTimeout(() => {
      setValveStatus('complete');
    }, 2800);
  };

  const handleReset = () => {
    setAuthenticatedFarmer(null);
    setValveStatus('locked');
    setFillVolume(20);
    setTranscript('');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner with Zero-Touch Location Sync */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <span>{t('kiosk_title', '20-FT SISTER KIOSK • OUTDOOR HIGH-CONTRAST INTERFACE')}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {t('kiosk_subtitle', 'Zero-literacy voice & icon kiosk for smallholder foliar fertilizer dispensing (1.0% N verified).')}
            </p>
          </div>
        </div>

        {/* Quick Language Selector & NFC Simulation Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <LanguageSelector compact />

          {authenticatedFarmer ? (
            <div className="flex items-center gap-2 bg-emerald-950 border border-emerald-500/60 px-3 py-1.5 rounded-xl text-xs font-mono text-emerald-300 shadow-md">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-white">{authenticatedFarmer.name}</span>
              <span className="text-[10px] text-emerald-400">({authenticatedFarmer.credits} {t('credits_available', 'credits')})</span>
              <button 
                onClick={handleReset} 
                className="ml-2 text-slate-400 hover:text-white cursor-pointer"
                title="Reset session"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => simulateNfcTap('JUMA')}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-mono font-bold text-amber-400 transition-colors cursor-pointer"
              >
                NFC: Juma (20L)
              </button>
              <button
                onClick={() => simulateNfcTap('MARIA')}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-mono font-bold text-amber-400 transition-colors cursor-pointer"
              >
                NFC: María (15L)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Kiosk Screen */}
      <div className="bg-slate-950 border-2 border-slate-800 rounded-3xl p-5 md:p-8 shadow-2xl">
        {valveStatus === 'complete' ? (
          <div className="bg-emerald-950/80 border-2 border-emerald-500 rounded-2xl p-8 flex flex-col items-center gap-4 text-center">
            <CheckCircle2 className="w-20 h-20 text-emerald-400 animate-bounce" />
            <h3 className="text-2xl sm:text-3xl font-black text-white uppercase font-mono">
              {t('dispense_complete', 'DISPENSE COMPLETE • VALVE LOCKED')}
            </h3>
            <p className="text-emerald-200 text-sm">
              {fillVolume} {t('aqueous_output', 'Liters')} (1.0% N) {t('optimal', 'Optimal')}.
            </p>
            <div className="bg-emerald-900/60 border border-emerald-400/60 px-4 py-2 rounded-xl flex items-center gap-2 text-yellow-300 text-xs font-bold font-mono">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              +1 EcoCredit Token Minted for {authenticatedFarmer?.coop || 'Agricultural Coop'}
            </div>
            <button
              onClick={handleReset}
              className="mt-4 px-6 py-3 bg-white hover:bg-slate-200 text-slate-950 font-black rounded-xl text-sm flex items-center gap-2 uppercase tracking-wider cursor-pointer shadow-lg active:scale-95"
            >
              <RotateCcw className="w-4 h-4" /> {t('reset_defaults', 'Next Smallholder Farmer')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Left: Crop Selector & PTT Voice */}
            <div className="flex flex-col items-center gap-6">
              <div className="w-full">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 block text-center mb-3 font-mono">
                  {t('select_crop', 'Select Crop Prescription')}
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: 'maize' as CropType, label: t('crop_maize', 'Maize / Corn'), icon: <Sprout className="w-6 h-6" /> },
                    { id: 'coffee' as CropType, label: t('crop_coffee', 'Coffee Arabica'), icon: <Coffee className="w-6 h-6" /> },
                    { id: 'wheat' as CropType, label: t('crop_wheat', 'Wheat'), icon: <Wheat className="w-6 h-6" /> },
                    { id: 'soybean' as CropType, label: t('crop_soybean', 'Soybean'), icon: <Trees className="w-6 h-6" /> },
                    { id: 'potatoes' as CropType, label: t('crop_potatoes', 'Potatoes'), icon: <Apple className="w-6 h-6" /> },
                    { id: 'cassava' as CropType, label: t('crop_cassava', 'Cassava / Manioc'), icon: <Flower2 className="w-6 h-6" /> },
                    { id: 'rice' as CropType, label: t('crop_rice', 'Paddy Rice'), icon: <Leaf className="w-6 h-6" /> },
                    { id: 'sugarcane' as CropType, label: t('crop_sugarcane', 'Sugarcane'), icon: <Sparkles className="w-6 h-6" /> },
                  ].map((crop) => {
                    const isSel = selectedCrop === crop.id;
                    return (
                      <button
                        key={crop.id}
                        onClick={() => setSelectedCrop(crop.id)}
                        className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          isSel 
                            ? 'bg-slate-900 border-amber-400 text-amber-300 shadow-[0_0_18px_rgba(251,191,36,0.3)] scale-105' 
                            : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                        }`}
                      >
                        {crop.icon}
                        <span className="text-[9px] font-mono font-black tracking-wider uppercase text-center">{crop.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Push to Talk Button (Gemini Live with Regional Directive) */}
              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={handleVoicePush}
                  className={`w-32 h-32 rounded-full flex flex-col items-center justify-center border-4 shadow-xl transition-all cursor-pointer ${
                    isLiveActive || isSimulatedListening
                      ? 'bg-emerald-500 text-slate-950 border-white animate-pulse shadow-[0_0_30px_rgba(16,185,129,0.5)]' 
                      : isSimulatedSpeaking 
                        ? 'bg-cyan-600 text-white border-cyan-300 animate-bounce'
                        : 'bg-slate-900 text-emerald-400 border-emerald-500 hover:bg-slate-850'
                  }`}
                >
                  {isLiveActive || isSimulatedListening ? (
                    <>
                      <Radio className="w-10 h-10 animate-spin" />
                      <span className="text-[9px] font-black mt-1 font-mono">{t('listening', 'LISTENING')}</span>
                    </>
                  ) : isSimulatedSpeaking ? (
                    <>
                      <Volume2 className="w-10 h-10 animate-bounce" />
                      <span className="text-[9px] font-black mt-1 font-mono">SPEAKING</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-10 h-10" />
                      <span className="text-[9px] font-black mt-1 font-mono text-center px-1">
                        {t('speak_prompt', 'HOLD TO TALK')}
                      </span>
                    </>
                  )}
                </button>
                <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-500 font-mono">
                  <span>Gemini Live Multimodal ({localeProfile.flag} {locale})</span>
                </div>
              </div>
            </div>

            {/* Right: Tank Level & Pull Lever */}
            <div className="flex flex-col items-center gap-6">
              <div className="w-full bg-slate-900/80 border-2 border-slate-800 rounded-2xl p-6 flex flex-col items-center gap-4">
                <div className="w-full flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">
                      {t('aqueous_output', 'DISPENSE TANK LEVEL')}
                    </span>
                    <div className="text-4xl font-black text-white font-mono mt-1">
                      {fillVolume} <span className="text-lg text-emerald-400">LITERS</span>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      {t('optimal', '1.0% N Foliar Concentration Verified')}
                    </span>
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
                    className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-base sm:text-lg uppercase tracking-wider rounded-xl border-2 border-white shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all animate-pulse cursor-pointer"
                  >
                    {t('hold_to_dispense', 'PULL LEVER TO DISPENSE / VUTA LEVER')}
                  </button>
                ) : valveStatus === 'dispensing' ? (
                  <div className="w-full py-4 bg-cyan-950 border border-cyan-500 rounded-xl flex items-center justify-center gap-2 text-cyan-300 font-bold uppercase text-xs sm:text-sm font-mono">
                    <Droplet className="w-5 h-5 animate-bounce text-cyan-400" /> 
                    {t('dispensing', 'DISPENSING SAFE FERTILIZER...')}
                  </div>
                ) : (
                  <div className="w-full py-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center gap-2 text-slate-500 font-bold uppercase text-xs font-mono text-center px-2">
                    <Lock className="w-4 h-4 shrink-0" /> 
                    {t('tap_card_prompt', 'TAP NFC CARD OR USE VOICE TO UNLOCK')}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Live Audio Transcript */}
        {transcript && (
          <div className="mt-6 p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-xs font-mono text-slate-300">
            <span className="text-emerald-400 font-bold">Voice Assistant ({locale}):</span> {transcript}
          </div>
        )}
      </div>

      {/* Mode B Batch Foliar Dilution Station (SIL-3 Governed) */}
      <ModeBFoliarDispenser />
    </div>
  );
};

export const KioskDashboard = KioskSimulatorView;
