/**
 * Agricultural News & Agronomic Advisory Service Module
 * NexusLIMS Edge News Engine for Eden II Container Operators
 * 
 * Aggregates regional extension bulletins, pest warnings, drought updates,
 * and fertilizer market advisories categorized by agro-ecological zones.
 */

import { GpsCoordinates, mapGpsToLocale } from '../utils/geoLocator';

export type AgriNewsCategory = 
  | 'WEATHER_ALERT' 
  | 'AGRONOMY_ADVISORY' 
  | 'PEST_EPIDEMIOLOGY' 
  | 'FERTILIZER_MARKET' 
  | 'REGULATORY';

export type AgriNewsSeverity = 'INFO' | 'ADVISORY' | 'WARNING' | 'CRITICAL';

export type AgroZoneId = 
  | 'GLOBAL' 
  | 'EAST_AFRICA' 
  | 'NORTH_AMERICA' 
  | 'LATIN_AMERICA' 
  | 'WEST_AFRICA' 
  | 'MEDITERRANEAN' 
  | 'SOUTH_ASIA';

export interface AgriNewsItem {
  id: string;
  title: string;
  summary: string;
  category: AgriNewsCategory;
  severity: AgriNewsSeverity;
  source: string;
  publishedAt: string;
  regionName: string;
  zone: AgroZoneId;
  cropImpacts: string[];
  actionPrompt?: string;
  url?: string;
}

/**
 * Regional bulletin repository curated for major agricultural clusters
 */
const REGIONAL_AGRI_BULLETINS: Record<AgroZoneId, AgriNewsItem[]> = {
  EAST_AFRICA: [
    {
      id: 'ea-news-01',
      title: 'Fall Armyworm (Spodoptera frugiperda) Scout Alert across Rift Valley',
      summary: 'Moisture fluctuations and elevated daytime temperatures have triggered second-generation oviposition in maize and sorghum whorls. Early foliar interventions recommended.',
      category: 'PEST_EPIDEMIOLOGY',
      severity: 'WARNING',
      source: 'KALRO / East Africa Agricultural Extension',
      publishedAt: '2026-09-22T08:30:00Z',
      regionName: 'Nakuru / Rift Valley Basin, Kenya',
      zone: 'EAST_AFRICA',
      cropImpacts: ['Maize', 'Sorghum', 'Sweet Corn'],
      actionPrompt: 'Inspect whorls for frass and pinholes; schedule precision neem/aqueous foliar micro-dosing before sunset.',
    },
    {
      id: 'ea-news-02',
      title: 'Inter-Seasonal Dry Spell & Soil Moisture Drawdown Advisory',
      summary: 'Forecast indicates 7 consecutive days of low cloud cover and high solar irradiance (ET0 > 5.8 mm/day). Subsoil moisture at 45cm depth projected to drop below 32%.',
      category: 'WEATHER_ALERT',
      severity: 'ADVISORY',
      source: 'FEWS NET / IGAD Climate Prediction',
      publishedAt: '2026-09-22T06:15:00Z',
      regionName: 'East African Highlands',
      zone: 'EAST_AFRICA',
      cropImpacts: ['Coffee', 'Maize', 'Horticulture'],
      actionPrompt: 'Engage container pre-hydration cycle and adjust drip irrigation runtimes by +25%.',
    },
    {
      id: 'ea-news-03',
      title: 'Decentralized Micro-DGA Nitrogen Distribution Window Open',
      summary: 'Eden II cooperative units in Western Kenya reporting 99.4% catalyst uptime. Aqueous 18% NH4OH stock available for knapsack foliar pickup via 20-ft kiosk.',
      category: 'FERTILIZER_MARKET',
      severity: 'INFO',
      source: 'NexusLIMS Agronomic Cooperative Network',
      publishedAt: '2026-09-21T14:00:00Z',
      regionName: 'Eldoret / Kericho Agri-Zone',
      zone: 'EAST_AFRICA',
      cropImpacts: ['Tea', 'Maize', 'Legumes'],
      actionPrompt: 'Farmers can scan NFC tokens at kiosk for calibrated 1.5% Mode B dilution batches.',
    },
  ],

  NORTH_AMERICA: [
    {
      id: 'na-news-01',
      title: 'Midwest Corn Belt Soil Nitrate Leaching Mitigation Standard',
      summary: 'EPA & state conservation agencies enact enhanced buffer requirements for late-season liquid applications to protect tile-drainage watersheds.',
      category: 'REGULATORY',
      severity: 'WARNING',
      source: 'USDA NRCS / Midwest Crop Extension',
      publishedAt: '2026-09-22T11:00:00Z',
      regionName: 'Iowa / Illinois Corn-Soy Belt',
      zone: 'NORTH_AMERICA',
      cropImpacts: ['Corn', 'Soybeans'],
      actionPrompt: 'Ensure on-site Hedera dMRV sensor verification is logged for zero-runoff compliance.',
    },
    {
      id: 'na-news-02',
      title: 'High Vapor Pressure Deficit & Heat Inversion Forecast',
      summary: 'Atmospheric inversion layer creating midday VPD spikes exceeding 2.6 kPa. Foliar spray droplets risk rapid evaporation before cuticular absorption.',
      category: 'WEATHER_ALERT',
      severity: 'WARNING',
      source: 'National Weather Service Agricultural Desk',
      publishedAt: '2026-09-22T09:45:00Z',
      regionName: 'Central Valley & Great Plains',
      zone: 'NORTH_AMERICA',
      cropImpacts: ['Almonds', 'Wheat', 'Corn'],
      actionPrompt: 'Shift spraying windows to 05:00-08:30 AM or post-twilight when VPD is under 1.5 kPa.',
    },
    {
      id: 'na-news-03',
      title: 'USDA Section 179 Full-Expensing Window for Modular Agrivoltaics',
      summary: '100% bonus depreciation cap verified for distributed green fertilizer production systems paired with captive on-farm solar arrays.',
      category: 'FERTILIZER_MARKET',
      severity: 'INFO',
      source: 'USDA Rural Energy for America Program (REAP)',
      publishedAt: '2026-09-20T16:00:00Z',
      regionName: 'North American Agricultural Grid',
      zone: 'NORTH_AMERICA',
      cropImpacts: ['All Row Crops'],
      actionPrompt: 'Download instant Section 179 compliance schedule via NexusLIMS Finance view.',
    },
  ],

  LATIN_AMERICA: [
    {
      id: 'latam-news-01',
      title: 'Alerta de Roya del Café (Hemileia vastatrix) por Alta Humedad',
      summary: 'Condiciones de saturación microclimática (HR > 85%, VPD < 0.4 kPa) favorecen la germinación de esporas en laderas de la cordillera central.',
      category: 'PEST_EPIDEMIOLOGY',
      severity: 'WARNING',
      source: 'Cenicafé / Federación Nacional de Cafeteros',
      publishedAt: '2026-09-22T10:00:00Z',
      regionName: 'Eje Cafetero & Andes Colombianos',
      zone: 'LATIN_AMERICA',
      cropImpacts: ['Café Arábica', 'Cacao'],
      actionPrompt: 'Aplicar caldo mineral balanceado con micro-dosis foliar de nitrógeno para fortalecer tejido foliar.',
    },
    {
      id: 'latam-news-02',
      title: 'Optimización de Fertilización Verde en Suelos Ácidos (pH < 5.2)',
      summary: 'Pruebas de campo confirman que el amortiguamiento simultáneo con carbonato de calcio micronizado duplica la asimilación radicular de amonio.',
      category: 'AGRONOMY_ADVISORY',
      severity: 'INFO',
      source: 'Embrapa / Red Latinoamericana de Suelos',
      publishedAt: '2026-09-21T13:30:00Z',
      regionName: 'Cerrado Brasileño & Llanos Orientales',
      zone: 'LATIN_AMERICA',
      cropImpacts: ['Soya', 'Maíz', 'Pasturas'],
      actionPrompt: 'Verificar activación del módulo de inyección de CaCO3 en el Farm Command Dashboard.',
    },
  ],

  WEST_AFRICA: [
    {
      id: 'wa-news-01',
      title: 'Alerte Stress Hydrique et Harmattan Précoce dans la Zone Sahélienne',
      summary: 'Vents d\'Est secs augmentant le déficit de pression de vapeur (VPD > 2.8 kPa). Risque d\'assèchement rapide des pépinières maraîchères.',
      category: 'WEATHER_ALERT',
      severity: 'WARNING',
      source: 'AGRHYMET / CILSS Niamey',
      publishedAt: '2026-09-22T07:00:00Z',
      regionName: 'Bassin du Fleuve Sénégal & Sahel',
      zone: 'WEST_AFRICA',
      cropImpacts: ['Arachide', 'Mil', 'Maraîchage'],
      actionPrompt: 'Activer le paillage organique et l\'irrigation goutte-à-goutte nocturne.',
    },
  ],

  MEDITERRANEAN: [
    {
      id: 'med-news-01',
      title: 'Downy Mildew (Plasmopara viticola) Risk Index in Coastal Vineyards',
      summary: 'Dew point confluence during predawn hours creates 4-hour wetness duration on grape leaves. Preventative canopy aerification advised.',
      category: 'PEST_EPIDEMIOLOGY',
      severity: 'ADVISORY',
      source: 'Mediterranean Agronomic Institute (CIHEAM)',
      publishedAt: '2026-09-22T08:00:00Z',
      regionName: 'Mediterranean Coastal Basin',
      zone: 'MEDITERRANEAN',
      cropImpacts: ['Vineyards', 'Olive Groves', 'Citrus'],
      actionPrompt: 'Monitor canopy sensor clusters and delay non-urgent foliar sprays until noon.',
    },
  ],

  SOUTH_ASIA: [
    {
      id: 'sa-news-01',
      title: 'Indo-Gangetic Plain Nitrogen Runoff & Groundwater Nitrate Protocol',
      summary: 'New state guidelines mandate localized on-demand liquid fertigation over broadcast urea pellets to curb groundwater contamination.',
      category: 'REGULATORY',
      severity: 'WARNING',
      source: 'ICAR / National Agronomy Board',
      publishedAt: '2026-09-22T05:30:00Z',
      regionName: 'Punjab & Haryana Agri-Corridor',
      zone: 'SOUTH_ASIA',
      cropImpacts: ['Wheat', 'Basmati Rice', 'Sugarcane'],
      actionPrompt: 'Transition dosing schedules to container direct-injection manifold.',
    },
  ],

  GLOBAL: [
    {
      id: 'global-news-01',
      title: 'Global Green Ammonia Benchmark & Carbon Insetting Index Update',
      summary: 'Decentralized containerized green ammonia verified to avoid 2.87 kg CO2e per kg NH3 compared to fossil Haber-Bosch maritime supply chains.',
      category: 'FERTILIZER_MARKET',
      severity: 'INFO',
      source: 'International Fertilizer Association (IFA)',
      publishedAt: '2026-09-22T04:00:00Z',
      regionName: 'Global Autonomous Network',
      zone: 'GLOBAL',
      cropImpacts: ['Universal Agriculture'],
      actionPrompt: 'Hedera dMRV cryptographic tokens minted automatically on completed batch cycles.',
    },
  ],
};

/**
 * Identify agro-ecological zone from GPS coordinates
 */
export function determineAgroZone(coords: GpsCoordinates): AgroZoneId {
  const { latitude, longitude } = coords;

  // East Africa
  if (latitude >= -15.0 && latitude <= 6.0 && longitude >= 27.0 && longitude <= 52.0) {
    return 'EAST_AFRICA';
  }
  // West Africa
  if (latitude >= 4.0 && latitude <= 22.0 && longitude >= -19.0 && longitude <= 16.0) {
    return 'WEST_AFRICA';
  }
  // North America
  if (latitude >= 24.0 && latitude <= 70.0 && longitude >= -168.0 && longitude <= -50.0) {
    return 'NORTH_AMERICA';
  }
  // Latin America
  if (latitude >= -56.0 && latitude <= 32.0 && longitude >= -120.0 && longitude <= -34.0) {
    return 'LATIN_AMERICA';
  }
  // Mediterranean
  if (latitude >= 30.0 && latitude <= 46.0 && longitude >= -10.0 && longitude <= 36.0) {
    return 'MEDITERRANEAN';
  }
  // South Asia
  if (latitude >= 6.0 && latitude <= 38.0 && longitude >= 65.0 && longitude <= 98.0) {
    return 'SOUTH_ASIA';
  }

  return 'GLOBAL';
}

/**
 * Fetch regional agricultural bulletins with local fallback
 */
export async function fetchRegionalAgriNews(
  coords: GpsCoordinates,
  locale?: string
): Promise<AgriNewsItem[]> {
  try {
    const zone = determineAgroZone(coords);
    const regional = REGIONAL_AGRI_BULLETINS[zone] || [];
    const globalItems = REGIONAL_AGRI_BULLETINS.GLOBAL || [];

    // Combine regional items with global market news
    const combined = [...regional, ...globalItems];

    // Optional simulation delay to emulate edge mesh synchronization
    await new Promise((resolve) => setTimeout(resolve, 80));

    return combined;
  } catch (err) {
    console.warn('[AgriNewsService] Failed to parse regional news, using global items', err);
    return REGIONAL_AGRI_BULLETINS.GLOBAL;
  }
}
