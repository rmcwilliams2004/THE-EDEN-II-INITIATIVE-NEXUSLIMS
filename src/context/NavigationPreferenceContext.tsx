import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { NavigationTab, NAV_ITEMS } from './NavigationContext';
import { WeatherAudioStreamer, PRESET_WEATHER_STATIONS, WeatherStreamStation } from '../services/weatherAudioStreamer';
import { useLanguage } from './LanguageContext';
import {
  geminiVoiceEngine,
  AVAILABLE_GEMINI_VOICES,
  GeminiVoiceName,
  GeminiVoiceOption,
} from '../services/geminiNaturalVoiceService';

export interface NavigationPreferenceContextType {
  // Routing preferences
  defaultView: NavigationTab;
  setDefaultView: (tab: NavigationTab) => void;
  availableDefaultViews: { id: NavigationTab; label: string; description: string }[];
  
  // Live Weather Radio Broadcast state & controls
  isWeatherBroadcastActive: boolean;
  toggleWeatherBroadcast: () => void;
  startWeatherBroadcast: () => void;
  stopWeatherBroadcast: () => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  toggleMute: () => void;
  selectedVoice: GeminiVoiceName;
  setSelectedVoice: (voice: GeminiVoiceName) => void;
  availableVoices: GeminiVoiceOption[];
  rmsVolume: number;
  frequencyBands: number[]; // 8-band audio reactive spectrum [0..1]
  currentStation: WeatherStreamStation;
  setStation: (station: WeatherStreamStation) => void;
  liveStatus: string;
  latestTranscript: string;
}

const STORAGE_KEY = 'nexuslims_default_tab_pref';

export const AVAILABLE_DEFAULT_VIEWS: { id: NavigationTab; label: string; description: string }[] = [
  { id: 'LAUNCHPAD' as NavigationTab, label: 'Launchpad (Command Grid)', description: 'Clean overview block-menu and live broadcast control' },
  { id: 'FARM_COMMAND', label: 'Farm Command (Agronomy ERP)', description: 'Automated drip fertigation and soil NPK monitoring' },
  { id: 'TOUCHSCREEN', label: 'Edge Core (Touchscreen HMI)', description: 'SIL-3 pressure vessel and thermal catalyst telemetry' },
  { id: 'KIOSK', label: 'Sister Kiosk (Voice/NFC Dispenser)', description: 'Cognitive multi-agent core & smallholder foliar dispenser' },
  { id: 'FEED', label: 'Sister-Link (Social Exchange)', description: 'Global agronomy feed, token transfers, and cooperative posts' },
  { id: 'ECOCREDITX', label: 'ESG Ledger (Hedera dMRV)', description: 'Verified carbon offsets, token minting, and audit certificates' },
  { id: 'MARKET_NEWS', label: 'Atmospheric Feed (Weather Radar)', description: 'Micro-climate data, Open-Meteo alerts, and market signals' },
  { id: 'SETTINGS', label: 'System & Safety (Interlocks)', description: 'Emergency trip logs, system diagnostics, and firmware locks' },
];

const NavigationPreferenceContext = createContext<NavigationPreferenceContextType | undefined>(undefined);

export const NavigationPreferenceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { locale } = useLanguage();

  // 1. Persistent Default Tab Preference
  const [defaultView, setDefaultViewState] = useState<NavigationTab>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as NavigationTab;
      if (saved && (saved === 'LAUNCHPAD' || NAV_ITEMS.some(item => item.id === saved))) {
        return saved;
      }
    } catch {
      // Fallback
    }
    return 'LAUNCHPAD' as NavigationTab;
  });

  const setDefaultView = useCallback((tab: NavigationTab) => {
    setDefaultViewState(tab);
    try {
      localStorage.setItem(STORAGE_KEY, tab);
    } catch (e) {
      console.warn('Unable to persist default view preference to localStorage', e);
    }
  }, []);

  // 2. Weather Radio Live Broadcast Engine
  const streamerRef = useRef<WeatherAudioStreamer | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const synthOscRef = useRef<OscillatorNode | null>(null);
  const synthGainRef = useRef<GainNode | null>(null);
  const [isWeatherBroadcastActive, setIsWeatherBroadcastActive] = useState<boolean>(false);
  const [isMuted, setIsMutedState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('nexuslims_audio_muted');
      return saved === 'true';
    } catch {
      return false;
    }
  });
  const isMutedRef = useRef<boolean>(isMuted);
  useEffect(() => {
    isMutedRef.current = isMuted;
    geminiVoiceEngine.setMuted(isMuted);
  }, [isMuted]);

  const [currentStation, setCurrentStation] = useState<WeatherStreamStation>(PRESET_WEATHER_STATIONS[0]);
  const [rmsVolume, setRmsVolume] = useState<number>(0);
  const [frequencyBands, setFrequencyBands] = useState<number[]>([0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1]);
  const [liveStatus, setLiveStatus] = useState<string>('IDLE');
  const [latestTranscript, setLatestTranscript] = useState<string>('');

  const [selectedVoice, setSelectedVoiceState] = useState<GeminiVoiceName>(() => {
    return geminiVoiceEngine.getActiveVoice();
  });
  const selectedVoiceRef = useRef<GeminiVoiceName>(selectedVoice);
  useEffect(() => {
    selectedVoiceRef.current = selectedVoice;
    geminiVoiceEngine.setActiveVoice(selectedVoice);
  }, [selectedVoice]);

  const setSelectedVoice = useCallback((voice: GeminiVoiceName) => {
    setSelectedVoiceState(voice);
    selectedVoiceRef.current = voice;
    geminiVoiceEngine.setActiveVoice(voice);
    if (isWeatherBroadcastActive && latestTranscript) {
      geminiVoiceEngine.speakNatural(latestTranscript, locale, voice);
    }
  }, [isWeatherBroadcastActive, latestTranscript, locale]);

  // Audio wave animation frame
  const animFrameRef = useRef<number | null>(null);

  // Initialize streamer instance
  useEffect(() => {
    const streamer = new WeatherAudioStreamer(currentStation);
    streamerRef.current = streamer;

    streamer.onVolume((rms) => {
      setRmsVolume(rms);
    });

    streamer.onStatusChange((status, msg) => {
      setLiveStatus(status);
      if (msg) console.log(`[Weather Radio] ${status}: ${msg}`);
    });

    return () => {
      streamer.stop();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Web Audio atmospheric radio carrier generator and speech synthesis
  const radioAudioCtxRef = useRef<AudioContext | null>(null);
  const radioCarrierRef = useRef<{ osc: OscillatorNode; noise: AudioBufferSourceNode; gain: GainNode } | null>(null);
  const speechIntervalRef = useRef<any>(null);

  // Stop all audible sounds
  const stopAllAudio = useCallback(() => {
    geminiVoiceEngine.stop();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (speechIntervalRef.current) {
      clearInterval(speechIntervalRef.current);
      speechIntervalRef.current = null;
    }
    if (radioCarrierRef.current) {
      try {
        radioCarrierRef.current.gain.gain.linearRampToValueAtTime(0.0001, (radioAudioCtxRef.current?.currentTime || 0) + 0.2);
        setTimeout(() => {
          radioCarrierRef.current?.osc.stop();
          radioCarrierRef.current?.noise.stop();
          radioCarrierRef.current = null;
        }, 250);
      } catch (e) {
        // cleanup ignore
      }
    }
  }, []);

  // Realistic NOAA 1050Hz alert tone + radio carrier hiss
  const startAtmosphericRadioAudio = useCallback(() => {
    try {
      if (!radioAudioCtxRef.current || radioAudioCtxRef.current.state === 'closed') {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        radioAudioCtxRef.current = new AudioCtx();
      }

      if (radioAudioCtxRef.current.state === 'suspended') {
        radioAudioCtxRef.current.resume();
      }

      const ctx = radioAudioCtxRef.current;
      const now = ctx.currentTime;

      // 1. Initial NOAA 1050 Hz beep burst (standard weather radio intro) if not muted
      if (!isMutedRef.current) {
        const beepOsc = ctx.createOscillator();
        const beepGain = ctx.createGain();
        beepOsc.type = 'sine';
        beepOsc.frequency.setValueAtTime(1050, now);
        beepGain.gain.setValueAtTime(0.001, now);
        beepGain.gain.linearRampToValueAtTime(0.08, now + 0.05);
        beepGain.gain.setValueAtTime(0.08, now + 0.35);
        beepGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
        beepOsc.connect(beepGain);
        beepGain.connect(ctx.destination);
        beepOsc.start(now);
        beepOsc.stop(now + 0.5);
      }

      // 2. Subtle background bandpassed radio static hiss
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.value = 1400;
      bandpass.Q.value = 2.5;

      const carrierOsc = ctx.createOscillator();
      carrierOsc.type = 'triangle';
      carrierOsc.frequency.value = 180;

      const masterGain = ctx.createGain();
      const targetGain = isMutedRef.current ? 0.00001 : 0.015;
      masterGain.gain.setValueAtTime(0.001, now);
      masterGain.gain.linearRampToValueAtTime(targetGain, now + 0.5);

      whiteNoise.connect(bandpass);
      bandpass.connect(masterGain);
      carrierOsc.connect(masterGain);
      masterGain.connect(ctx.destination);

      whiteNoise.start(now + 0.4);
      carrierOsc.start(now + 0.4);

      radioCarrierRef.current = { osc: carrierOsc, noise: whiteNoise, gain: masterGain };
    } catch (e) {
      console.warn('Radio audio initialization note:', e);
    }
  }, []);

  // Speak rolling weather advisories via Gemini Natural Voice (with soft human modulation)
  const speakAdvisory = useCallback((text: string, voiceLocale: string) => {
    if (isMutedRef.current) return; // Mute active speech

    geminiVoiceEngine.speakNatural(
      text,
      voiceLocale,
      selectedVoiceRef.current
    );
  }, []);

  // Frequency wave generator loop when active
  useEffect(() => {
    if (!isWeatherBroadcastActive) {
      setFrequencyBands([0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05]);
      setRmsVolume(0);
      return;
    }

    let t = 0;
    const updateWave = () => {
      t += 0.08;
      const bands = Array.from({ length: 8 }, (_, i) => {
        const base = Math.sin(t * 1.5 + i * 0.8) * 0.4 + 0.5;
        const noise = Math.sin(t * 3.7 + i * 1.4) * 0.2;
        return Math.max(0.12, Math.min(1.0, base + noise + (rmsVolume * 0.5)));
      });
      setFrequencyBands(bands);
      animFrameRef.current = requestAnimationFrame(updateWave);
    };

    animFrameRef.current = requestAnimationFrame(updateWave);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isWeatherBroadcastActive, rmsVolume]);

  const startWeatherBroadcast = useCallback(async () => {
    setIsWeatherBroadcastActive(true);
    setLiveStatus('STREAMING');

    // 1. Start audio carrier & beep
    startAtmosphericRadioAudio();

    if (streamerRef.current) {
      try {
        await streamerRef.current.start();
      } catch (e) {
        console.warn('Streamer start note:', e);
      }
    }

    // 2. Prepare localized bulletins
    const getBulletinsForLocale = (targetLocale: string) => {
      switch (targetLocale) {
        case 'sw-KE':
          return [
            'Hali ya hewa kituo cha KMET. Upepo wa kilomita 14 kwa saa kutoka Mashariki. Kiwango cha unyevu asilimia 68. Masharti mazuri kwa urutubishaji wa majani ya mahindi.',
            'Tahadhari ya agronomia: Shinikizo la hewa thabiti. Joto nyuzi joto 24. Endelea na ratiba ya unyunyiziaji wa maji kwa matone.'
          ];
        case 'es-CO':
        case 'es-MX':
          return [
            'Boletín agrometeorológico de la red INMET. Humedad relativa 72%, viento moderado 11 km/h. Condiciones óptimas para fertirrigación foliar.',
            'Aviso de radiación solar: Índice UV moderado. Temperatura actual 23 grados centígrados. Presión de vapor estable.'
          ];
        case 'fr-SN':
          return [
            'Bulletin agrométéorologique régional Sahel. Humidité relative 65%, vent d\'Est à 15 km/h. Conditions idéales pour la fertigation foliaire et le goutte-à-goutte.',
            'Alerte agronomique : Indice d\'évapotranspiration normal. Maintien des cycles d\'irrigation programmés sur les parcelles.'
          ];
        case 'pt-BR':
          return [
            'Boletim agrometeorológico regional do Cerrado. Umidade relativa de 70%, vento de 12 km/h. Janela ideal para aplicação foliar e fertirrigação por gotejamento.',
            'Alerta agronômico: Pressão de vapor controlada. Temperatura de 25 graus Celsius. Manter cronograma automatizado de dosagem.'
          ];
        default:
          return [
            'NOAA Weather Radio station KEC63 serving agricultural operations. Current conditions: Temperature 23 degrees Celsius, relative humidity 64 percent, wind south-southeast at 12 kilometers per hour.',
            'Agro-meteorological forecast: Evapotranspiration index normal. Optimal atmospheric window for automated biological foliar dosing and closed-loop drip fertigation.'
          ];
      }
    };

    const bulletins = getBulletinsForLocale(locale);
    let currentBulletinIdx = 0;
    const initialText = bulletins[0];
    setLatestTranscript(initialText);

    // Speak initial bulletin after the 1050 Hz alert tone
    setTimeout(() => {
      speakAdvisory(initialText, locale);
    }, 600);

    // Loop periodic updates every 14 seconds
    speechIntervalRef.current = setInterval(() => {
      currentBulletinIdx = (currentBulletinIdx + 1) % bulletins.length;
      const nextText = bulletins[currentBulletinIdx];
      setLatestTranscript(nextText);
      speakAdvisory(nextText, locale);
    }, 14000);

  }, [locale, startAtmosphericRadioAudio, speakAdvisory]);

  // Reactive speech update when user changes language dropdown during active broadcast
  useEffect(() => {
    if (!isWeatherBroadcastActive) return;

    const getBulletinsForLocale = (targetLocale: string) => {
      switch (targetLocale) {
        case 'sw-KE':
          return [
            'Hali ya hewa kituo cha KMET. Upepo wa kilomita 14 kwa saa kutoka Mashariki. Kiwango cha unyevu asilimia 68. Masharti mazuri kwa urutubishaji wa majani ya mahindi.',
            'Tahadhari ya agronomia: Shinikizo la hewa thabiti. Joto nyuzi joto 24. Endelea na ratiba ya unyunyiziaji wa maji kwa matone.'
          ];
        case 'es-CO':
        case 'es-MX':
          return [
            'Boletín agrometeorológico de la red INMET. Humedad relativa 72%, viento moderado 11 km/h. Condiciones óptimas para fertirrigación foliar.',
            'Aviso de radiación solar: Índice UV moderado. Temperatura actual 23 grados centígrados. Presión de vapor estable.'
          ];
        case 'fr-SN':
          return [
            'Bulletin agrométéorologique régional Sahel. Humidité relative 65%, vent d\'Est à 15 km/h. Conditions idéales pour la fertigation foliaire et le goutte-à-goutte.',
            'Alerte agronomique : Indice d\'évapotranspiration normal. Maintien des cycles d\'irrigation programmés sur les parcelles.'
          ];
        case 'pt-BR':
          return [
            'Boletim agrometeorológico regional do Cerrado. Umidade relativa de 70%, vento de 12 km/h. Janela ideal para aplicação foliar e fertirrigação por gotejamento.',
            'Alerta agronômico: Pressão de vapor controlada. Temperatura de 25 graus Celsius. Manter cronograma automatizado de dosagem.'
          ];
        default:
          return [
            'NOAA Weather Radio station KEC63 serving agricultural operations. Current conditions: Temperature 23 degrees Celsius, relative humidity 64 percent, wind south-southeast at 12 kilometers per hour.',
            'Agro-meteorological forecast: Evapotranspiration index normal. Optimal atmospheric window for automated biological foliar dosing and closed-loop drip fertigation.'
          ];
      }
    };

    const bulletins = getBulletinsForLocale(locale);
    const newText = bulletins[0];
    setLatestTranscript(newText);
    speakAdvisory(newText, locale);

    if (speechIntervalRef.current) {
      clearInterval(speechIntervalRef.current);
    }
    let currentBulletinIdx = 0;
    speechIntervalRef.current = setInterval(() => {
      currentBulletinIdx = (currentBulletinIdx + 1) % bulletins.length;
      const nextText = bulletins[currentBulletinIdx];
      setLatestTranscript(nextText);
      speakAdvisory(nextText, locale);
    }, 14000);
  }, [locale, isWeatherBroadcastActive, speakAdvisory]);

  const stopWeatherBroadcast = useCallback(() => {
    setIsWeatherBroadcastActive(false);
    setLiveStatus('STOPPED');
    stopAllAudio();
    if (streamerRef.current) {
      streamerRef.current.stop();
    }
  }, [stopAllAudio]);

  const toggleMute = useCallback(() => {
    setIsMutedState((prev) => {
      const next = !prev;
      isMutedRef.current = next;
      try {
        localStorage.setItem('nexuslims_audio_muted', String(next));
      } catch (e) {
        console.warn('Storage save mute note:', e);
      }

      if (next) {
        // Mute active speech synthesis & attenuate carrier hiss
        geminiVoiceEngine.setMuted(true);
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
        if (radioCarrierRef.current?.gain && radioAudioCtxRef.current) {
          radioCarrierRef.current.gain.gain.setValueAtTime(0.00001, radioAudioCtxRef.current.currentTime);
        }
      } else {
        // Unmute carrier hiss and re-speak current bulletin
        geminiVoiceEngine.setMuted(false);
        if (radioCarrierRef.current?.gain && radioAudioCtxRef.current) {
          radioCarrierRef.current.gain.gain.setValueAtTime(0.015, radioAudioCtxRef.current.currentTime);
        }
        if (isWeatherBroadcastActive && latestTranscript) {
          speakAdvisory(latestTranscript, locale);
        }
      }
      return next;
    });
  }, [isWeatherBroadcastActive, latestTranscript, locale, speakAdvisory]);

  const setIsMuted = useCallback((muted: boolean) => {
    setIsMutedState(muted);
    isMutedRef.current = muted;
    geminiVoiceEngine.setMuted(muted);
    try {
      localStorage.setItem('nexuslims_audio_muted', String(muted));
    } catch (e) {
      console.warn('Storage save mute note:', e);
    }

    if (muted) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (radioCarrierRef.current?.gain && radioAudioCtxRef.current) {
        radioCarrierRef.current.gain.gain.setValueAtTime(0.00001, radioAudioCtxRef.current.currentTime);
      }
    } else {
      if (radioCarrierRef.current?.gain && radioAudioCtxRef.current) {
        radioCarrierRef.current.gain.gain.setValueAtTime(0.015, radioAudioCtxRef.current.currentTime);
      }
      if (isWeatherBroadcastActive && latestTranscript) {
        speakAdvisory(latestTranscript, locale);
      }
    }
  }, [isWeatherBroadcastActive, latestTranscript, locale, speakAdvisory]);

  const toggleWeatherBroadcast = useCallback(() => {
    if (isWeatherBroadcastActive) {
      stopWeatherBroadcast();
    } else {
      startWeatherBroadcast();
    }
  }, [isWeatherBroadcastActive, startWeatherBroadcast, stopWeatherBroadcast]);

  const setStation = useCallback((station: WeatherStreamStation) => {
    setCurrentStation(station);
    if (streamerRef.current) {
      streamerRef.current.setStation(station);
    }
  }, []);

  return (
    <NavigationPreferenceContext.Provider
      value={{
        defaultView,
        setDefaultView,
        availableDefaultViews: AVAILABLE_DEFAULT_VIEWS,
        isWeatherBroadcastActive,
        toggleWeatherBroadcast,
        startWeatherBroadcast,
        stopWeatherBroadcast,
        isMuted,
        setIsMuted,
        toggleMute,
        selectedVoice,
        setSelectedVoice,
        availableVoices: AVAILABLE_GEMINI_VOICES,
        rmsVolume,
        frequencyBands,
        currentStation,
        setStation,
        liveStatus,
        latestTranscript,
      }}
    >
      {children}
    </NavigationPreferenceContext.Provider>
  );
};

export const useNavigationPreference = (): NavigationPreferenceContextType => {
  const context = useContext(NavigationPreferenceContext);
  if (!context) {
    throw new Error('useNavigationPreference must be used within a NavigationPreferenceProvider');
  }
  return context;
};
