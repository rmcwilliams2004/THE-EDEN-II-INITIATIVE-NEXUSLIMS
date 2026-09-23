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

  // Launchpad & Weather Broadcast
  launchpad_kicker: string;
  launchpad_desc: string;
  weather_play_broadcast: string;
  weather_live_stream: string;
  weather_active: string;
  weather_standby: string;
  weather_station: string;
  weather_receiving: string;
  mute_audio: string;
  unmute_audio: string;
  audio_muted: string;
  default_view_boot: string;
  core_operational_modules: string;
  active_domains: string;
  default_boot_badge: string;
  status_label: string;

  // 6 Primary Blocks
  block_farm_command_title: string;
  block_farm_command_subtitle: string;
  block_farm_command_summary: string;
  block_farm_command_status: string;
  block_farm_command_details: string;

  block_edge_core_title: string;
  block_edge_core_subtitle: string;
  block_edge_core_summary: string;
  block_edge_core_status: string;
  block_edge_core_details: string;

  block_esg_ledger_title: string;
  block_esg_ledger_subtitle: string;
  block_esg_ledger_summary: string;
  block_esg_ledger_status: string;
  block_esg_ledger_details: string;

  block_sister_link_title: string;
  block_sister_link_subtitle: string;
  block_sister_link_summary: string;
  block_sister_link_status: string;
  block_sister_link_details: string;

  block_atmospheric_feed_title: string;
  block_atmospheric_feed_subtitle: string;
  block_atmospheric_feed_summary: string;
  block_atmospheric_feed_status: string;
  block_atmospheric_feed_details: string;

  block_system_safety_title: string;
  block_system_safety_subtitle: string;
  block_system_safety_summary: string;
  block_system_safety_status: string;
  block_system_safety_details: string;

  // Footer
  container_node_id: string;
  firmware: string;
  system_config: string;
  dispenser_kiosk: string;
  hardware_sil3: string;
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
    locale_detected: 'Zero-Touch GPS Locale',

    // Launchpad & Weather Broadcast
    launchpad_kicker: 'AUTONOMOUS AGRO-SYNTHESIS PLATFORM · SIL-3 CERTIFIED',
    launchpad_desc: 'Clean command launchpad for containerized biological synthesis, automated precision drip fertigation, and verified Hedera dMRV ESG asset auditing.',
    weather_play_broadcast: 'PLAY WEATHER BROADCAST',
    weather_live_stream: 'LIVE WEATHER STREAM',
    weather_active: 'ACTIVE',
    weather_standby: 'STANDBY',
    weather_station: 'STATION',
    weather_receiving: 'RECEIVING 16kHz PCM',
    mute_audio: 'MUTE AUDIO',
    unmute_audio: 'UNMUTE AUDIO',
    audio_muted: 'MUTED',
    default_view_boot: 'Default View on Boot:',
    core_operational_modules: 'CORE OPERATIONAL MODULES',
    active_domains: '6 ACTIVE DOMAINS',
    default_boot_badge: 'DEFAULT BOOT',
    status_label: 'Status:',

    // 6 Primary Blocks
    block_farm_command_title: 'Farm Command',
    block_farm_command_subtitle: 'Agronomy & Precision Drip Fertigation',
    block_farm_command_summary: 'Automated closed-loop drip fertigation, soil NPK balancing, and crop evapotranspiration scheduling.',
    block_farm_command_status: 'Optimal',
    block_farm_command_details: 'Soil VWC 31.4% · pH 6.35 · Drip Active',

    block_edge_core_title: 'Edge Core',
    block_edge_core_subtitle: 'Hardware Kiosk & 600-Bar Microgrid',
    block_edge_core_summary: '20-ft container catalytic telemetry, hydraulic intensifier, and tactile smallholder foliar dispenser.',
    block_edge_core_status: 'Normal',
    block_edge_core_details: '597.2 bar · 390.4°C · 2,400L Ready',

    block_esg_ledger_title: 'ESG Ledger',
    block_esg_ledger_subtitle: 'EcoCreditX & Verified Carbon Minting',
    block_esg_ledger_summary: 'Tamper-proof Hedera Guardian dMRV tokens, verified regenerative offsets, and carbon audit certificates.',
    block_esg_ledger_status: 'Synced',
    block_esg_ledger_details: '14,820 kg CO₂e Minted · Guardian Block #402,918',

    block_sister_link_title: 'Sister-Link',
    block_sister_link_subtitle: 'Feeders of the World Social Hub',
    block_sister_link_summary: 'Decentralized peer exchange, farmer cooperative field updates, and regional agronomic notes.',
    block_sister_link_status: 'Normal',
    block_sister_link_details: '12 Connected Co-ops · 84 Transmissions',

    block_atmospheric_feed_title: 'Atmospheric Feed',
    block_atmospheric_feed_subtitle: 'Agronomic News & Regional Warnings',
    block_atmospheric_feed_summary: 'Open-Meteo micro-climate tracking, localized weather radio bulletins, and market price radar.',
    block_atmospheric_feed_status: '3 Alerts',
    block_atmospheric_feed_details: 'High Evapotranspiration · 0.0 mm Rain · Low Frost',

    block_system_safety_title: 'System & Safety',
    block_system_safety_subtitle: 'Diagnostics, IAM & SIL-3 Interlocks',
    block_system_safety_summary: 'SIL-3 hardware interlock controls, cryptographic firmware signing, and diagnostic telemetry archives.',
    block_system_safety_status: 'Optimal',
    block_system_safety_details: 'SIL-3 Certified · 0 Interlocks Tripped · 4ms Lag',

    container_node_id: 'CONTAINER NODE ID',
    firmware: 'FIRMWARE',
    system_config: 'System Config',
    dispenser_kiosk: 'Dispenser Kiosk',
    hardware_sil3: 'Hardware SIL-3 Telemetry',
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
    locale_detected: 'Eneo Lililotambuliwa Kiotomatiki',

    // Launchpad & Weather Broadcast
    launchpad_kicker: 'MFUMO WA KIOTOMATIKI WA KILIMO · SIL-3 IMETHIBITISHWA',
    launchpad_desc: 'Kituo kikuu cha amri ya usanisi wa kibaolojia kwenye kontena, umwagiliaji wa matone wa kiotomatiki, na ukaguzi wa kaboni wa Hedera dMRV.',
    weather_play_broadcast: 'CHEZA MATANGAZO YA HALI YA HEWA',
    weather_live_stream: 'MATANGAZO YA HALI YA HEWA MOJA KWA MOJA',
    weather_active: 'INAFANYA KAZI',
    weather_standby: 'TAYARI',
    weather_station: 'KITUO',
    weather_receiving: 'INAPOKEA 16kHz PCM',
    mute_audio: 'ZIMA SAUTI',
    unmute_audio: 'WASHA SAUTI',
    audio_muted: 'IMEZIMWA',
    default_view_boot: 'Mtazamo wa Awali Unapoanza:',
    core_operational_modules: 'SEKTA ZA UENDESHAJI WA MFUMO',
    active_domains: 'SEKTA 6 ZINAZOFANYA KAZI',
    default_boot_badge: 'MTAZAMO WA AWALI',
    status_label: 'Hali:',

    // 6 Primary Blocks
    block_farm_command_title: 'Amri ya Shamba',
    block_farm_command_subtitle: 'Usimamizi wa Kilimo & Umwagiliaji wa Matone',
    block_farm_command_summary: 'Umwagiliaji wa matone wa kiotomatiki, uwiano wa virutubisho vya udongo NPK, na ratiba ya unyevunyevu.',
    block_farm_command_status: 'Bora Kabisa',
    block_farm_command_details: 'Unyevunyevu 31.4% · pH 6.35 · Umwagiliaji Unafanya Kazi',

    block_edge_core_title: 'Kitovu cha Mtambo',
    block_edge_core_subtitle: 'Kioski cha Vifaa & Gridi Ndogo ya Bar 600',
    block_edge_core_summary: 'Kontena la futi 20 la mmenyuko wa vichocheo, kikandamizaji cha maji, na kioski cha kugawa mbolea ya majimaji.',
    block_edge_core_status: 'Kawaida',
    block_edge_core_details: 'Bar 597.2 · 390.4°C · Lita 2,400 Tayari',

    block_esg_ledger_title: 'Daftari la ESG',
    block_esg_ledger_subtitle: 'EcoCreditX & Uthibitishaji wa Kaboni',
    block_esg_ledger_summary: 'Vyeti vya kidijitali vya Hedera Guardian dMRV visivyoweza kubadilishwa na usajili wa mikopo ya kaboni.',
    block_esg_ledger_status: 'Imelandanishwa',
    block_esg_ledger_details: 'Kilo 14,820 za CO₂e Zilizosajiliwa · Guardian Block #402,918',

    block_sister_link_title: 'Mtandao wa Wakulima',
    block_sister_link_subtitle: 'Kituo cha Ushirika wa Kilimo Duniani',
    block_sister_link_summary: 'Mabadilishano ya wakulima, taarifa za vyama vya ushirika kutoka mashambani, na ushauri wa kilimo.',
    block_sister_link_status: 'Kawaida',
    block_sister_link_details: 'Vyama 12 Vilivyounganishwa · Ujumbe 84',

    block_atmospheric_feed_title: 'Hewa & Mazingira',
    block_atmospheric_feed_subtitle: 'Habari za Kilimo & Tahadhari za Hewa',
    block_atmospheric_feed_summary: 'Ufuatiliaji wa hali ya hewa wa Open-Meteo, redio ya tahadhari za kieneo, na bei za soko la mazao.',
    block_atmospheric_feed_status: 'Tahadhari 3',
    block_atmospheric_feed_details: 'Uvukizi Mkubwa · Mvua 0.0 mm · Hakuna Baridi Kali',

    block_system_safety_title: 'Usalama wa Mfumo',
    block_system_safety_subtitle: 'Uchunguzi wa Vifaa & Kufunga kwa SIL-3',
    block_system_safety_summary: 'Uthibitisho wa usalama wa SIL-3, usalama wa programu dhibiti iliyotiwa saini, na kumbukumbu za mfumo.',
    block_system_safety_status: 'Bora Kabisa',
    block_system_safety_details: 'SIL-3 Imethibitishwa · Hitilafu 0 · Muda wa Majibu 4ms',

    container_node_id: 'KITAMBULISHO CHA MTAMBO',
    firmware: 'PROGRAMU DHIBITI',
    system_config: 'Mipangilio ya Mfumo',
    dispenser_kiosk: 'Kioski cha Kugawa',
    hardware_sil3: 'Takwimu za Vifaa vya SIL-3',
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
    locale_detected: 'Ubicación GPS Cero-Toque',

    // Launchpad & Weather Broadcast
    launchpad_kicker: 'PLATAFORMA AUTÓNOMA AGRO-SÍNTESIS · CERTIFICADA SIL-3',
    launchpad_desc: 'Panel de control principal para síntesis biológica en contenedores, fertirriego por goteo automatizado y auditoría de créditos de carbono Hedera dMRV.',
    weather_play_broadcast: 'REPRODUCIR BOLETÍN CLIMÁTICO',
    weather_live_stream: 'TRANSMISIÓN CLIMÁTICA EN VIVO',
    weather_active: 'ACTIVO',
    weather_standby: 'EN ESPERA',
    weather_station: 'ESTACIÓN',
    weather_receiving: 'RECIBIENDO 16kHz PCM',
    mute_audio: 'SILENCIAR AUDIO',
    unmute_audio: 'ACTIVAR AUDIO',
    audio_muted: 'SILENCIADO',
    default_view_boot: 'Vista Predeterminada al Iniciar:',
    core_operational_modules: 'MÓDULOS OPERATIVOS PRINCIPALES',
    active_domains: '6 DOMINIOS ACTIVOS',
    default_boot_badge: 'INICIO PREDETERMINADO',
    status_label: 'Estado:',

    // 6 Primary Blocks
    block_farm_command_title: 'Comando Agrícola',
    block_farm_command_subtitle: 'Agronomía & Fertirriego de Precisión',
    block_farm_command_summary: 'Fertirriego por goteo automatizado de circuito cerrado, balance NPK del suelo y programación de evapotranspiración.',
    block_farm_command_status: 'Óptimo',
    block_farm_command_details: 'Humedad 31.4% · pH 6.35 · Goteo Activo',

    block_edge_core_title: 'Núcleo Edge',
    block_edge_core_subtitle: 'Quiosco de Hardware & Microred de 600 Bar',
    block_edge_core_summary: 'Telemetría catalítica en contenedor de 20 pies, intensificador hidráulico y quiosco dispensador foliar.',
    block_edge_core_status: 'Normal',
    block_edge_core_details: '597.2 bar · 390.4°C · 2,400L Listos',

    block_esg_ledger_title: 'Libro Mayor ESG',
    block_esg_ledger_subtitle: 'EcoCreditX & Acuñación de Carbono',
    block_esg_ledger_summary: 'Tokens Hedera Guardian dMRV a prueba de manipulaciones, compensaciones regenerativas y auditoría de carbono.',
    block_esg_ledger_status: 'Sincronizado',
    block_esg_ledger_details: '14,820 kg CO₂e Acuñados · Bloque Guardian #402,918',

    block_sister_link_title: 'Enlace Comunitario',
    block_sister_link_subtitle: 'Red Social de Productores del Mundo',
    block_sister_link_summary: 'Intercambio directo entre agricultores, actualizaciones de cooperativas rurales y notas agronómicas de campo.',
    block_sister_link_status: 'Normal',
    block_sister_link_details: '12 Cooperativas Conectadas · 84 Mensajes',

    block_atmospheric_feed_title: 'Canal Atmosférico',
    block_atmospheric_feed_subtitle: 'Noticias Agronómicas & Alertas Regionales',
    block_atmospheric_feed_summary: 'Seguimiento microclimático Open-Meteo, radio meteorológica con alertas y radar de precios de mercado.',
    block_atmospheric_feed_status: '3 Alertas',
    block_atmospheric_feed_details: 'Alta Evapotranspiración · 0.0 mm Lluvia · Sin Heladas',

    block_system_safety_title: 'Sistema & Seguridad',
    block_system_safety_subtitle: 'Diagnósticos, IAM & Enclavamientos SIL-3',
    block_system_safety_summary: 'Controles de enclavamiento de hardware SIL-3, firmware firmado criptográficamente y registros de diagnóstico.',
    block_system_safety_status: 'Óptimo',
    block_system_safety_details: 'Certificado SIL-3 · 0 Enclavamientos Activados · Latencia 4ms',

    container_node_id: 'ID DE NODO CONTENEDOR',
    firmware: 'FIRMWARE',
    system_config: 'Configuración del Sistema',
    dispenser_kiosk: 'Quiosco Dispensador',
    hardware_sil3: 'Telemetría de Hardware SIL-3',
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
    configure_recipe: 'CONFIGURER RECETTE',
    save_configuration: 'ENREGISTRER CONFIGURATION',
    reset_defaults: 'RÉINITIALISER VALEURS D\'USINE',
    export_json: 'EXPORTER JSON',
    dry: 'SEC',
    dosing: 'DOSAGE EN COURS',

    kiosk_title: 'KIOSQUE SISTER 20 PIEDS • INTERFACE HAUT CONTRASTE',
    kiosk_subtitle: 'Kiosque vocal et visuel sans barrière linguistique pour la distribution d\'engrais foliaire (1.0% N).',
    scan_nfc: 'SCANNER CARTE NFC POUR AUTHENTIFIER',
    hold_to_dispense: 'MAINTENIR LA POIGNÉE POUR DISTRIBUER',
    dispensing: 'DISTRIBUTION EN COURS...',
    dispense_complete: 'DISTRIBUTION TERMINÉE • VANNE VERROUILLÉE',
    select_crop: 'Sélectionner la Culture Cible',
    crop_maize: 'Maïs',
    crop_coffee: 'Café Arabica',
    crop_wheat: 'Blé',
    crop_soybean: 'Soja',
    crop_potatoes: 'Pommes de Terre',
    crop_cassava: 'Manioc',
    crop_rice: 'Riz Paddy',
    crop_sugarcane: 'Canne à Sucre',
    credits_available: 'Crédits Disponibles',
    speak_prompt: 'APPUYER POUR PARLER (IA VOCALE)',
    listening: 'Écoute en dialecte local...',
    tap_card_prompt: 'Présenter la carte NFC pour distribuer',

    farm_command_title: 'FARMCOMMAND AG-ERP • DISPATCH GOUTTE-À-GOUTTE',
    soil_moisture: 'Humidité du Sol',
    soil_temp: 'Température du Sol',
    soil_ph: 'pH du Sol',
    soil_nitrogen: 'Niveau d\'Azote',
    field_status: 'État des Parcelles',
    live_satellite: 'Imagerie Satellite en Direct',
    ai_agronomist_advisor: 'Conseiller Agronome IA Vocal',
    run_simulation: 'Lancer Cycle Micro-DGA',
    export_drip_plan: 'Exporter Prescription Goutte-à-Goutte',

    satellite_sync: 'Liaison Satellite Active',
    battery_status: 'Stockage Batterie',
    sil3_certified: 'Certifié Sécurité SIL-3',
    connected: 'CONNECTÉ',
    disconnected: 'DÉCONNECTÉ',
    latitude: 'Latitude',
    longitude: 'Longitude',
    locale_detected: 'Position GPS Détectée',

    // Launchpad & Weather Broadcast
    launchpad_kicker: 'PLATEFORME D\'AGRO-SYNTHÈSE AUTONOME · CERTIFIÉE SIL-3',
    launchpad_desc: 'Centre de commandement pour la synthèse biologique en conteneur, l\'irrigation automatisée et l\'audit dMRV de crédits carbone Hedera.',
    weather_play_broadcast: 'ÉCOUTER BULLETIN MÉTÉO',
    weather_live_stream: 'FLUX MÉTÉO EN DIRECT',
    weather_active: 'ACTIF',
    weather_standby: 'EN VEILLE',
    weather_station: 'STATION',
    weather_receiving: 'RÉCEPTION 16kHz PCM',
    mute_audio: 'COUPER LE SON',
    unmute_audio: 'RÉACTIVER LE SON',
    audio_muted: 'EN SOURDINE',
    default_view_boot: 'Vue par Défaut au Démarrage :',
    core_operational_modules: 'MODULES OPÉRATIONNELS PRINCIPAUX',
    active_domains: '6 DOMAINES ACTIFS',
    default_boot_badge: 'DÉMARRAGE PAR DÉFAUT',
    status_label: 'Statut :',

    // 6 Primary Blocks
    block_farm_command_title: 'Commandement Agricole',
    block_farm_command_subtitle: 'Agronomie & Fertigation Goutte-à-Goutte',
    block_farm_command_summary: 'Fertigation automatisée en boucle fermée, équilibrage NPK du sol et planification de l\'évapotranspiration.',
    block_farm_command_status: 'Optimal',
    block_farm_command_details: 'Humidité 31.4% · pH 6.35 · Goutte-à-goutte Actif',

    block_edge_core_title: 'Cœur Edge',
    block_edge_core_subtitle: 'Kiosque Matériel & Micro-réseau 600 Bar',
    block_edge_core_summary: 'Télémétrie catalytique en conteneur de 20 pieds, intensificateur hydraulique et distributeur foliaire.',
    block_edge_core_status: 'Normal',
    block_edge_core_details: '597.2 bar · 390.4°C · 2 400L Prêts',

    block_esg_ledger_title: 'Registre ESG',
    block_esg_ledger_subtitle: 'EcoCreditX & Frappe Carbone Certifiée',
    block_esg_ledger_summary: 'Jetons dMRV Hedera Guardian infalsifiables, compensations régénératrices et certificats d\'audit carbone.',
    block_esg_ledger_status: 'Synchronisé',
    block_esg_ledger_details: '14 820 kg CO₂e Frappés · Bloc Guardian #402,918',

    block_sister_link_title: 'Réseau Sister-Link',
    block_sister_link_subtitle: 'Échange Mondial des Coopératives',
    block_sister_link_summary: 'Échanges décentralisés entre producteurs, partages de terrain des coopératives et notes agronomiques régionales.',
    block_sister_link_status: 'Normal',
    block_sister_link_details: '12 Coopératives Connectées · 84 Messages',

    block_atmospheric_feed_title: 'Flux Atmosphérique',
    block_atmospheric_feed_subtitle: 'Actualités Agronomiques & Alertes Régionales',
    block_atmospheric_feed_summary: 'Suivi microclimatique Open-Meteo, radio météo avec alertes régionales et radar des cours agricoles.',
    block_atmospheric_feed_status: '3 Alertes',
    block_atmospheric_feed_details: 'Évapotranspiration Forte · 0.0 mm Pluie · Pas de Gel',

    block_system_safety_title: 'Système & Sécurité',
    block_system_safety_subtitle: 'Diagnostics, IAM & Verrouillages SIL-3',
    block_system_safety_summary: 'Contrôles de sécurité SIL-3, micrologiciel signé cryptographiquement et archives télémétriques.',
    block_system_safety_status: 'Optimal',
    block_system_safety_details: 'Certifié SIL-3 · 0 Déclenchement · Latence 4ms',

    container_node_id: 'ID CONTENEUR NŒUD',
    firmware: 'MICROLOGICIEL',
    system_config: 'Config Système',
    dispenser_kiosk: 'Kiosque Distributeur',
    hardware_sil3: 'Télémétrie SIL-3',
  },

  'pt-BR': {
    start_batch: 'INICIAR CICLO DE LOTE',
    purge_gas: 'PURGAR LINHA DE GÁS',
    dispatch_drip: 'DESPACHAR PARA LINHAS DE GOTEJAMENTO',
    system_diagnostics: 'DIAGNÓSTICO DO SISTEMA',
    optimal: 'Ótimo',
    neutralized: 'Neutralizado',

    reaction_chamber: 'Câmara de Reação',
    catalyst_bed: 'Leito Catalítico',
    biogas_digester: 'Digestor de Biogás',
    hydraulic_intensifier: 'Intensificador Hidráulico HPDD',
    aqueous_output: 'Saída Aquosa de NH4OH',
    blending_vat: 'Tanque de Mistura Omni-Nutrientes',
    base_water: 'Base (Água Deionizada)',
    nitrogen_nh4oh: 'Nitrogênio (NH4OH)',
    phosphorus_p2o5: 'Fósforo (P2O5)',
    potash_k2o: 'Potássio (K2O)',
    telemetry_active: 'CANAIS ADC EM TEMPO REAL',
    configure_recipe: 'CONFIGURAR RECEITA',
    save_configuration: 'SALVAR CONFIGURAÇÃO',
    reset_defaults: 'RESTAURAR PADRÕES DE FÁBRICA',
    export_json: 'EXPORTAR JSON',
    dry: 'SECO',
    dosing: 'DOSANDO',

    kiosk_title: 'QUIOSQUE SISTER 20 PÉS • INTERFACE DE ALTO CONTRASTE',
    kiosk_subtitle: 'Quiosque de voz e ícones sem barreira de alfabetização para distribuição de fertilizante foliar (1.0% N).',
    scan_nfc: 'APROXIME CARTÃO NFC PARA AUTENTICAR',
    hold_to_dispense: 'SEGURE A ALAVANCA PARA DISPENSAR',
    dispensing: 'DISPENSAÇÃO EM ANDAMENTO...',
    dispense_complete: 'DISPENSAÇÃO CONCLUÍDA • VÁLVULA BLOQUEADA',
    select_crop: 'Selecionar Cultura Alvo',
    crop_maize: 'Milho',
    crop_coffee: 'Café Arábica',
    crop_wheat: 'Trigo',
    crop_soybean: 'Soja',
    crop_potatoes: 'Batata',
    crop_cassava: 'Mandioca / Aipim',
    crop_rice: 'Arroz Irrigado',
    crop_sugarcane: 'Cana-de-Açúcar',
    credits_available: 'Créditos Disponíveis',
    speak_prompt: 'PRESSIONE PARA FALAR (VOZ IA)',
    listening: 'Ouvindo no dialeto local...',
    tap_card_prompt: 'Aproxime o cartão NFC para dispensar',

    farm_command_title: 'FARMCOMMAND AG-ERP • DISPARO DE IRRIGAÇÃO POR GOTEJAMENTO',
    soil_moisture: 'Umidade do Solo',
    soil_temp: 'Temperatura do Solo',
    soil_ph: 'pH do Solo',
    soil_nitrogen: 'Nível de Nitrogênio',
    field_status: 'Status das Parcelas',
    live_satellite: 'Imagens de Satélite em Tempo Real',
    ai_agronomist_advisor: 'Consultor Agrônomo por Voz com IA',
    run_simulation: 'Executar Ciclo Micro-DGA',
    export_drip_plan: 'Exportar Prescrição de Gotejamento',

    satellite_sync: 'Link de Satélite Ativo',
    battery_status: 'Armazenamento de Bateria',
    sil3_certified: 'Certificado de Segurança SIL-3',
    connected: 'CONECTADO',
    disconnected: 'DESCONECTADO',
    latitude: 'Latitude',
    longitude: 'Longitude',
    locale_detected: 'Localização GPS Automática',

    // Launchpad & Weather Broadcast
    launchpad_kicker: 'PLATAFORMA AUTÔNOMA DE AGROSSÍNTESE · CERTIFICADA SIL-3',
    launchpad_desc: 'Central de comando para síntese biológica em contêineres, fertirrigação por gotejamento automatizada e auditoria dMRV de carbono Hedera.',
    weather_play_broadcast: 'TOCAR BOLETIM CLIMÁTICO',
    weather_live_stream: 'TRANSMISSÃO CLIMÁTICA AO VIVO',
    weather_active: 'ATIVO',
    weather_standby: 'EM ESPERA',
    weather_station: 'ESTAÇÃO',
    weather_receiving: 'RECEBENDO 16kHz PCM',
    mute_audio: 'MUTAR ÁUDIO',
    unmute_audio: 'DESMUTAR ÁUDIO',
    audio_muted: 'MUTADO',
    default_view_boot: 'Visão Padrão na Inicialização:',
    core_operational_modules: 'MÓDULOS OPERACIONAIS PRINCIPAIS',
    active_domains: '6 DOMÍNIOS ATIVOS',
    default_boot_badge: 'INICIALIZAÇÃO PADRÃO',
    status_label: 'Status:',

    // 6 Primary Blocks
    block_farm_command_title: 'Comando Agrícola',
    block_farm_command_subtitle: 'Agronomia & Fertirrigação de Precisão',
    block_farm_command_summary: 'Fertirrigação por gotejamento em circuito fechado, balanceamento NPK e planejamento de evapotranspiração.',
    block_farm_command_status: 'Excelente',
    block_farm_command_details: 'Umidade 31.4% · pH 6.35 · Gotejamento Ativo',

    block_edge_core_title: 'Núcleo Edge',
    block_edge_core_subtitle: 'Quiosque de Hardware & Microrrede de 600 Bar',
    block_edge_core_summary: 'Telemetria catalítica em contêiner de 20 pés, intensificador hidráulico e quiosque dispensador foliar.',
    block_edge_core_status: 'Normal',
    block_edge_core_details: '597.2 bar · 390.4°C · 2.400L Prontos',

    block_esg_ledger_title: 'Livro-Razão ESG',
    block_esg_ledger_subtitle: 'EcoCreditX & Emissão de Carbono Auditada',
    block_esg_ledger_summary: 'Tokens dMRV Hedera Guardian invioláveis, créditos regenerativos verificados e certificados de carbono.',
    block_esg_ledger_status: 'Sincronizado',
    block_esg_ledger_details: '14.820 kg CO₂e Emitidos · Bloco Guardian #402,918',

    block_sister_link_title: 'Rede Sister-Link',
    block_sister_link_subtitle: 'Hub Social de Cooperativas Globais',
    block_sister_link_summary: 'Troca descentralizada entre produtores, atualizações de campo de cooperativas e notas agronômicas regionais.',
    block_sister_link_status: 'Normal',
    block_sister_link_details: '12 Cooperativas Conectadas · 84 Mensagens',

    block_atmospheric_feed_title: 'Canal Atmosférico',
    block_atmospheric_feed_subtitle: 'Notícias Agronômicas & Alertas Regionais',
    block_atmospheric_feed_summary: 'Monitoramento microclimático Open-Meteo, rádio de alertas meteorológicos e radar de cotações agrícolas.',
    block_atmospheric_feed_status: '3 Alertas',
    block_atmospheric_feed_details: 'Alta Evapotranspiração · 0.0 mm Chuva · Sem Geadas',

    block_system_safety_title: 'Sistema & Segurança',
    block_system_safety_subtitle: 'Diagnósticos, IAM & Travamentos SIL-3',
    block_system_safety_summary: 'Controles de travamento de hardware SIL-3, firmware assinado criptograficamente e arquivos de telemetria.',
    block_system_safety_status: 'Excelente',
    block_system_safety_details: 'Certificado SIL-3 · 0 Travamentos · Latência 4ms',

    container_node_id: 'ID DO NÓ CONTÊINER',
    firmware: 'FIRMWARE',
    system_config: 'Config do Sistema',
    dispenser_kiosk: 'Quiosque Dispensador',
    hardware_sil3: 'Telemetria SIL-3',
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
  const [locale, setLocaleState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('nexuslims_user_locale');
      if (saved && SUPPORTED_LOCALES[saved]) return saved;
    } catch {}
    return 'en-US';
  });

  const [gpsCoords, setGpsCoordsState] = useState<GpsCoordinates>(() => {
    return SUPPORTED_LOCALES[locale]?.defaultCoordinates || SUPPORTED_LOCALES['en-US'].defaultCoordinates;
  });

  const [isLoadingLocation, setIsLoadingLocation] = useState<boolean>(false);

  const localeProfile = useMemo(() => {
    return SUPPORTED_LOCALES[locale] || SUPPORTED_LOCALES['en-US'];
  }, [locale]);

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
    try {
      localStorage.setItem('nexuslims_user_locale', profile.locale);
    } catch {}
  }, []);

  const setLocale = useCallback((newLocale: string) => {
    if (SUPPORTED_LOCALES[newLocale]) {
      setLocaleState(newLocale);
      setGpsCoordsState(SUPPORTED_LOCALES[newLocale].defaultCoordinates);
      try {
        localStorage.setItem('nexuslims_user_locale', newLocale);
      } catch {}
    }
  }, []);

  const simulateRegion = useCallback((localeCode: string) => {
    if (SUPPORTED_LOCALES[localeCode]) {
      const profile = SUPPORTED_LOCALES[localeCode];
      setGpsCoordsState(profile.defaultCoordinates);
      setLocaleState(profile.locale);
      try {
        localStorage.setItem('nexuslims_user_locale', profile.locale);
      } catch {}
    }
  }, []);

  // Zero-Touch Auto Detection on mount only if no manual preference saved
  const refreshGeoLocation = useCallback(async () => {
    setIsLoadingLocation(true);
    try {
      const coords = await getDeviceCoordinates();
      setGpsCoordsState(coords);
      const saved = localStorage.getItem('nexuslims_user_locale');
      if (!saved) {
        const profile = mapGpsToLocale(coords.latitude, coords.longitude);
        setLocaleState(profile.locale);
      }
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
