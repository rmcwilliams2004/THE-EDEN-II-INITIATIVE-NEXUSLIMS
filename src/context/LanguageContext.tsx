import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { 
  GpsCoordinates, 
  LocaleGeoProfile, 
  SUPPORTED_LOCALES, 
  mapGpsToLocale, 
  getDeviceCoordinates 
} from '../utils/geoLocator';

export interface TranslationDictionary {
  // Core Kiosk Action Terms
  start_batch: string;
  purge_gas: string;
  dispatch_drip: string;
  system_diagnostics: string;
  optimal: string;
  neutralized: string;

  // Touchscreen & Hardware Metrics
  reaction_chamber: string;
  catalyst_bed: string;
  biogas_digester: string;
  hydraulic_intensifier: string;
  aqueous_output: string;
  blending_vat: string;
  base_water: string;
  nitrogen_nh4oh: string;
  phosphorus_p2o5: string;
  potash_k2o: string;
  telemetry_active: string;
  configure_recipe: string;
  save_configuration: string;
  reset_defaults: string;
  export_json: string;
  dry: string;
  dosing: string;

  // Kiosk Dispenser & Zero-Touch Voice
  kiosk_title: string;
  kiosk_subtitle: string;
  scan_nfc: string;
  hold_to_dispense: string;
  dispensing: string;
  dispense_complete: string;
  select_crop: string;
  crop_maize: string;
  crop_coffee: string;
  crop_wheat: string;
  crop_soybean: string;
  crop_potatoes: string;
  crop_cassava: string;
  crop_rice: string;
  crop_sugarcane: string;
  credits_available: string;
  speak_prompt: string;
  listening: string;
  tap_card_prompt: string;

  // FarmCommand & Agronomy
  farm_command_title: string;
  soil_moisture: string;
  soil_temp: string;
  soil_ph: string;
  soil_nitrogen: string;
  field_status: string;
  live_satellite: string;
  ai_agronomist_advisor: string;
  run_simulation: string;
  export_drip_plan: string;

  // Generic & Status
  satellite_sync: string;
  battery_status: string;
  sil3_certified: string;
  connected: string;
  disconnected: string;
  latitude: string;
  longitude: string;
  locale_detected: string;
}

export const DICTIONARIES: Record<string, TranslationDictionary> = {
  'en-US': {
    start_batch: 'START BATCH CYCLE',
    purge_gas: 'PURGE GAS LINE',
    dispatch_drip: 'DISPATCH TO DRIP LINES',
    system_diagnostics: 'SYSTEM DIAGNOSTICS',
    optimal: 'Optimal',
    neutralized: 'Neutralized',

    reaction_chamber: 'Reaction Chamber',
    catalyst_bed: 'Catalyst Bed',
    biogas_digester: 'Biogas Digester',
    hydraulic_intensifier: 'HPDD Hydraulic Intensifier',
    aqueous_output: 'Aqueous NH4OH Output',
    blending_vat: 'Omni-Nutrient Blending Vat',
    base_water: 'Base (DI Water)',
    nitrogen_nh4oh: 'Nitrogen (NH4OH)',
    phosphorus_p2o5: 'Phosphorus (P2O5)',
    potash_k2o: 'Potash (K2O)',
    telemetry_active: 'REAL-TIME ADC CHANNELS',
    configure_recipe: 'CONFIGURE RECIPE',
    save_configuration: 'SAVE CONFIGURATION',
    reset_defaults: 'RESET DEFAULTS',
    export_json: 'EXPORT JSON',
    dry: 'DRY',
    dosing: 'DOSING',

    kiosk_title: '20-FT SISTER KIOSK • OUTDOOR HIGH-CONTRAST INTERFACE',
    kiosk_subtitle: 'Zero-literacy voice & icon kiosk for smallholder foliar fertilizer dispensing (1.0% N verified).',
    scan_nfc: 'SCAN NFC CARD TO AUTHENTICATE',
    hold_to_dispense: 'HOLD HANDLE TO DISPENSE FERTILIZER',
    dispensing: 'DISPENSING IN PROGRESS...',
    dispense_complete: 'DISPENSE COMPLETE • VALVE LOCKED',
    select_crop: 'Select Crop Prescription',
    crop_maize: 'Maize / Corn',
    crop_coffee: 'Coffee Arabica',
    crop_wheat: 'Wheat',
    crop_soybean: 'Soybean',
    crop_potatoes: 'Potatoes',
    crop_cassava: 'Cassava / Manioc',
    crop_rice: 'Paddy Rice',
    crop_sugarcane: 'Sugarcane',
    credits_available: 'Available Credits',
    speak_prompt: 'PUSH TO TALK (VOICE AI)',
    listening: 'Listening to speech in local dialect...',
    tap_card_prompt: 'Tap NFC Card to dispense',

    farm_command_title: 'FARMCOMMAND AG-ERP • PRECISION DRIP DISPATCH',
    soil_moisture: 'Soil Moisture',
    soil_temp: 'Soil Temp',
    soil_ph: 'Soil pH',
    soil_nitrogen: 'Nitrogen Level',
    field_status: 'Field Status',
    live_satellite: 'Live Satellite Imagery',
    ai_agronomist_advisor: 'AI Agronomist Voice Advisor',
    run_simulation: 'Run Micro-DGA Cycle',
    export_drip_plan: 'Export Drip Irrigation Prescription',

    satellite_sync: 'Satellink Active',
    battery_status: 'Battery Storage',
    sil3_certified: 'SIL-3 Safety Certified',
    connected: 'CONNECTED',
    disconnected: 'DISCONNECTED',
    latitude: 'Latitude',
    longitude: 'Longitude',
    locale_detected: 'Zero-Touch GPS Locale'
  },

  'sw-KE': {
    start_batch: 'ANZA MZUNGUKO WA AWAMU',
    purge_gas: 'SAFISHA MFUMO WA GESI',
    dispatch_drip: 'PELEKA KWENYE MIFEREJI YA MATONE',
    system_diagnostics: 'UCHUNGUZI WA MFUMO',
    optimal: 'Bora / Salama',
    neutralized: 'Imetulizwa',

    reaction_chamber: 'Chumba cha Mmenyuko',
    catalyst_bed: 'Kitanda cha Kichocheo',
    biogas_digester: 'Mtambo wa Bayogesi',
    hydraulic_intensifier: 'Kikandamizaji cha Shinikizo la HPDD',
    aqueous_output: 'Mbolea ya Maji ya NH4OH',
    blending_vat: 'Tangi la Mchanganyiko wa Virutubisho',
    base_water: 'Maji Safi ya Msingi',
    nitrogen_nh4oh: 'Naitrojeni (NH4OH)',
    phosphorus_p2o5: 'Fosfara (P2O5)',
    potash_k2o: 'Potashi (K2O)',
    telemetry_active: 'MITAMBO YA DATA MOJA KWA MOJA',
    configure_recipe: 'WEKA VIWANGO VYA FORMULA',
    save_configuration: 'HIFADHI MIPANGILIO KWENYE PLC',
    reset_defaults: 'RUDISHA VIWANGO VYA KIWANDA',
    export_json: 'PAKUA FAILI LA JSON',
    dry: 'KAME / INAHITAJI MAJI',
    dosing: 'INAPOKEA MBOLEA',

    kiosk_title: 'KIOSKI CHA WAKULIMA • KIWANGO CHA JUU CHA UWEZO WA KUONA',
    kiosk_subtitle: 'Kioski cha sauti na aikoni kwa ajili ya kutoa mbolea ya majimaji kwa wakulima wadogo (1.0% N).',
    scan_nfc: 'GUSA KADI YA NFC KUTAMBULIKA',
    hold_to_dispense: 'SHIKILIA MPINI KUTOA MBOLEA',
    dispensing: 'MBOLEA INATOLEWA SASA...',
    dispense_complete: 'UTOAJI UMEKAMILIKA • VALVU IMEFUNGWA',
    select_crop: 'Chagua Zao Linalohitajika',
    crop_maize: 'Mahindi',
    crop_coffee: 'Kahawa ya Arabika',
    crop_wheat: 'Ngano',
    crop_soybean: 'Soya',
    crop_potatoes: 'Viazi Mviringo',
    crop_cassava: 'Mhogo / Mihogo',
    crop_rice: 'Mpunga / Mchele',
    crop_sugarcane: 'Miwa',
    credits_available: 'Salio la Mbolea',
    speak_prompt: 'BONYEZA KUONGEA (AI YA SAUTI)',
    listening: 'Inasikiliza sauti kwa Kiswahili...',
    tap_card_prompt: 'Gusa kadi ya NFC kutoa mbolea',

    farm_command_title: 'KITI CHA AMRI YA SHAMBA • MFUMO WA UMWAGILIAJI WA MATONE',
    soil_moisture: 'Unyevunyevu wa Udongo',
    soil_temp: 'Joto la Udongo',
    soil_ph: 'Kiwango cha pH ya Udongo',
    soil_nitrogen: 'Kiwango cha Naitrojeni',
    field_status: 'Hali ya Shamba',
    live_satellite: 'Picha za Satelaiti Moja kwa Moja',
    ai_agronomist_advisor: 'Mshauri wa Kilimo wa AI kwa Sauti',
    run_simulation: 'Endesha Awamu ya Micro-DGA',
    export_drip_plan: 'Pakua Mpango wa Umwagiliaji wa Matone',

    satellite_sync: 'Muunganisho wa Satelaiti Uko Hewani',
    battery_status: 'Hifadhi ya Betri',
    sil3_certified: 'Imethibitishwa Usalama wa SIL-3',
    connected: 'IMEUNGANISHWA',
    disconnected: 'HAIJAUNGANISHWA',
    latitude: 'Latitudo',
    longitude: 'Longitudo',
    locale_detected: 'Eneo Lililotambuliwa Kiotomatiki'
  },

  'es-CO': {
    start_batch: 'INICIAR CICLO DE LOTE',
    purge_gas: 'PURGAR LÍNEA DE GAS',
    dispatch_drip: 'DESPACHAR A LÍNEAS DE GOTEO',
    system_diagnostics: 'DIAGNÓSTICO DEL SISTEMA',
    optimal: 'Óptimo',
    neutralized: 'Neutralizado',

    reaction_chamber: 'Cámara de Reacción',
    catalyst_bed: 'Lecho Catalítico',
    biogas_digester: 'Digestor de Biogás',
    hydraulic_intensifier: 'Intensificador Hidráulico HPDD',
    aqueous_output: 'Salida Acuosa de NH4OH',
    blending_vat: 'Tanque de Mezcla Omni-Nutriente',
    base_water: 'Base (Agua Desionizada)',
    nitrogen_nh4oh: 'Nitrógeno (NH4OH)',
    phosphorus_p2o5: 'Fósforo (P2O5)',
    potash_k2o: 'Potasio (K2O)',
    telemetry_active: 'CANALES ADC EN TIEMPO REAL',
    configure_recipe: 'CONFIGURAR RECETA',
    save_configuration: 'GUARDAR CONFIGURACIÓN',
    reset_defaults: 'RESTAURAR VALORES DE FÁBRICA',
    export_json: 'EXPORTAR JSON',
    dry: 'SECO',
    dosing: 'DOSIFICANDO',

    kiosk_title: 'QUIOSCO HERMANO DE 20 PIES • INTERFAZ DE ALTO CONTRASTE',
    kiosk_subtitle: 'Quiosco de voz e íconos sin barrera de alfabetización para dispensar fertilizante foliar (1.0% N).',
    scan_nfc: 'ACERQUE TARJETA NFC PARA AUTENTICAR',
    hold_to_dispense: 'MANTENGA LA PALANCA PARA DISPENSAR',
    dispensing: 'DISPENSACIÓN EN PROGRESO...',
    dispense_complete: 'DISPENSACIÓN COMPLETA • VÁLVULA BLOQUEADA',
    select_crop: 'Seleccionar Cultivo Objetivo',
    crop_maize: 'Maíz',
    crop_coffee: 'Café Arábica',
    crop_wheat: 'Trigo',
    crop_soybean: 'Soja',
    crop_potatoes: 'Papas / Patatas',
    crop_cassava: 'Yuca / Mandioca',
    crop_rice: 'Arroz',
    crop_sugarcane: 'Caña de Azúcar',
    credits_available: 'Créditos Disponibles',
    speak_prompt: 'PRESIONE PARA HABLAR (VOZ IA)',
    listening: 'Escuchando en dialecto local...',
    tap_card_prompt: 'Acerque tarjeta NFC para dispensar',

    farm_command_title: 'FARMCOMMAND AG-ERP • DESPACHO DE RIEGO POR GOTEO',
    soil_moisture: 'Humedad del Suelo',
    soil_temp: 'Temperatura del Suelo',
    soil_ph: 'pH del Suelo',
    soil_nitrogen: 'Nivel de Nitrógeno',
    field_status: 'Estado del Campo',
    live_satellite: 'Imágenes Satelitales en Vivo',
    ai_agronomist_advisor: 'Asesor Agrónomo por Voz con IA',
    run_simulation: 'Ejecutar Ciclo Micro-DGA',
    export_drip_plan: 'Exportar Prescripción de Riego',

    satellite_sync: 'Enlace Satelital Activo',
    battery_status: 'Almacenamiento de Batería',
    sil3_certified: 'Certificado de Seguridad SIL-3',
    connected: 'CONECTADO',
    disconnected: 'DESCONECTADO',
    latitude: 'Latitud',
    longitude: 'Longitud',
    locale_detected: 'Ubicación GPS Cero-Toque'
  },

  'fr-SN': {
    start_batch: 'DÉMARRER CYCLE DE LOT',
    purge_gas: 'PURGER LIGNE DE GAZ',
    dispatch_drip: 'DISTRIBUER AUX GOUTTEURS',
    system_diagnostics: 'DIAGNOSTIC DU SYSTÈME',
    optimal: 'Optimal',
    neutralized: 'Neutralisé',

    reaction_chamber: 'Chambre de Réaction',
    catalyst_bed: 'Lit Catalytique',
    biogas_digester: 'Digesteur de Biogaz',
    hydraulic_intensifier: 'Intensificateur Hydraulique HPDD',
    aqueous_output: 'Production Aqueuse NH4OH',
    blending_vat: 'Cuve de Mélange Omni-Nutriments',
    base_water: 'Base (Eau Désionisée)',
    nitrogen_nh4oh: 'Azote (NH4OH)',
    phosphorus_p2o5: 'Phosphore (P2O5)',
    potash_k2o: 'Potasse (K2O)',
    telemetry_active: 'CANAUX ADC EN TEMPS RÉEL',
    configure_recipe: 'CONFIGURER LA FORMULE',
    save_configuration: 'ENREGISTRER SUR L\'AUTOMATE',
    reset_defaults: 'RÉTABLIR VALEURS D\'USINE',
    export_json: 'EXPORTER JSON',
    dry: 'SEC',
    dosing: 'DOSAGE EN COURS',

    kiosk_title: 'KIOSQUE AGRICOLE 20 PIEDS • INTERFACE HAUT CONTRASTE',
    kiosk_subtitle: 'Kiosque vocal et pictographique pour la distribution d\'engrais foliaire liquide (1.0% N).',
    scan_nfc: 'SCANNER CARTE NFC POUR IDENTIFICATION',
    hold_to_dispense: 'MAINTENIR LE LEVIER POUR DISTRIBUER',
    dispensing: 'DISTRIBUTION EN COURS...',
    dispense_complete: 'DISTRIBUTION TERMINÉE • VANNE VERROUILLÉE',
    select_crop: 'Sélectionner la Culture',
    crop_maize: 'Maïs',
    crop_coffee: 'Café',
    crop_wheat: 'Blé',
    crop_soybean: 'Soja',
    crop_potatoes: 'Pommes de Terre',
    crop_cassava: 'Manioc',
    crop_rice: 'Riz',
    crop_sugarcane: 'Canne à Sucre',
    credits_available: 'Crédits Disponibles',
    speak_prompt: 'APPUYER POUR PARLER (IA VOCALE)',
    listening: 'Écoute en cours...',
    tap_card_prompt: 'Présenter la carte NFC pour distribuer',

    farm_command_title: 'FARMCOMMAND AG-ERP • GESTION GOUTTE-À-GOUTTE',
    soil_moisture: 'Humidité du Sol',
    soil_temp: 'Température du Sol',
    soil_ph: 'pH du Sol',
    soil_nitrogen: 'Teneur en Azote',
    field_status: 'État de la Parcelle',
    live_satellite: 'Imagerie Satellite en Direct',
    ai_agronomist_advisor: 'Conseiller Agronome Vocal IA',
    run_simulation: 'Lancer le Cycle Micro-DGA',
    export_drip_plan: 'Exporter la Prescription d\'Irrigation',

    satellite_sync: 'Liaison Satellite Active',
    battery_status: 'Stockage Batterie',
    sil3_certified: 'Sécurité Certifiée SIL-3',
    connected: 'CONNECTÉ',
    disconnected: 'DÉCONNECTÉ',
    latitude: 'Latitude',
    longitude: 'Longitude',
    locale_detected: 'Localisation GPS Zéro-Touche'
  }
};

export interface LanguageContextType {
  locale: string;
  localeProfile: LocaleGeoProfile;
  setLocale: (locale: string) => void;
  gpsCoords: GpsCoordinates;
  setGpsCoords: (coords: GpsCoordinates) => void;
  detectedRegionName: string;
  t: (key: keyof TranslationDictionary | string, defaultText?: string) => string;
  dictionary: TranslationDictionary;
  isLoadingLocation: boolean;
  refreshGeoLocation: () => Promise<void>;
  simulateRegion: (localeCode: string) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Start with default coordinates (North America / US English default)
  const [gpsCoords, setGpsCoordsState] = useState<GpsCoordinates>(SUPPORTED_LOCALES['en-US'].defaultCoordinates);
  const [locale, setLocaleState] = useState<string>('en-US');
  const [isLoadingLocation, setIsLoadingLocation] = useState<boolean>(true);

  // Derive locale profile from active locale code
  const localeProfile = useMemo(() => {
    return SUPPORTED_LOCALES[locale] || SUPPORTED_LOCALES['en-US'];
  }, [locale]);

  // Derive dictionary
  const dictionary = useMemo(() => {
    return DICTIONARIES[locale] || DICTIONARIES['en-US'];
  }, [locale]);

  // Translation lookup helper
  const t = useCallback((key: keyof TranslationDictionary | string, defaultText?: string): string => {
    const dict = DICTIONARIES[locale] || DICTIONARIES['en-US'];
    const val = (dict as any)[key];
    if (val) return val;

    // Fallback to en-US dictionary
    const fallbackVal = (DICTIONARIES['en-US'] as any)[key];
    if (fallbackVal) return fallbackVal;

    return defaultText || key;
  }, [locale]);

  // Set GPS coordinates and automatically map to locale
  const setGpsCoords = useCallback((coords: GpsCoordinates) => {
    setGpsCoordsState(coords);
    const profile = mapGpsToLocale(coords.latitude, coords.longitude);
    setLocaleState(profile.locale);
  }, []);

  const setLocale = useCallback((newLocale: string) => {
    if (SUPPORTED_LOCALES[newLocale]) {
      setLocaleState(newLocale);
      setGpsCoordsState(SUPPORTED_LOCALES[newLocale].defaultCoordinates);
    }
  }, []);

  const simulateRegion = useCallback((localeCode: string) => {
    if (SUPPORTED_LOCALES[localeCode]) {
      const profile = SUPPORTED_LOCALES[localeCode];
      setGpsCoordsState(profile.defaultCoordinates);
      setLocaleState(profile.locale);
    }
  }, []);

  // Zero-Touch Auto Detection on mount
  const refreshGeoLocation = useCallback(async () => {
    setIsLoadingLocation(true);
    try {
      const coords = await getDeviceCoordinates();
      setGpsCoordsState(coords);
      const profile = mapGpsToLocale(coords.latitude, coords.longitude);
      setLocaleState(profile.locale);
    } catch (e) {
      console.warn('Geolocation auto-resolution fallback:', e);
    } finally {
      setIsLoadingLocation(false);
    }
  }, []);

  useEffect(() => {
    refreshGeoLocation();
  }, [refreshGeoLocation]);

  const value = useMemo(() => ({
    locale,
    localeProfile,
    setLocale,
    gpsCoords,
    setGpsCoords,
    detectedRegionName: localeProfile.regionName,
    t,
    dictionary,
    isLoadingLocation,
    refreshGeoLocation,
    simulateRegion
  }), [
    locale,
    localeProfile,
    setLocale,
    gpsCoords,
    setGpsCoords,
    t,
    dictionary,
    isLoadingLocation,
    refreshGeoLocation,
    simulateRegion
  ]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
