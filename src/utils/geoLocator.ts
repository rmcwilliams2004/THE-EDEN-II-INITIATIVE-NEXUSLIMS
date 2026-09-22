/**
 * GPS-to-Language Reverse Geolocation & Bounding Box Utility
 * NexusLIMS Zero-Touch Edge Localization Module
 */

export interface GpsCoordinates {
  latitude: number;
  longitude: number;
}

export interface LocaleGeoProfile {
  locale: string;
  languageName: string;
  regionName: string;
  countryCode: string;
  flag: string;
  defaultCoordinates: GpsCoordinates;
}

export interface RegionBoundingBox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  profile: LocaleGeoProfile;
}

export const SUPPORTED_LOCALES: Record<string, LocaleGeoProfile> = {
  'sw-KE': {
    locale: 'sw-KE',
    languageName: 'Kiswahili (East Africa)',
    regionName: 'Rift Valley / East Africa Hub',
    countryCode: 'KE',
    flag: '🇰🇪',
    defaultCoordinates: { latitude: -1.286389, longitude: 36.817223 } // Nairobi, Kenya
  },
  'es-CO': {
    locale: 'es-CO',
    languageName: 'Español (América Latina)',
    regionName: 'Andean Agri-Corridor',
    countryCode: 'CO',
    flag: '🇨🇴',
    defaultCoordinates: { latitude: 4.7110, longitude: -74.0721 } // Bogotá, Colombia
  },
  'fr-SN': {
    locale: 'fr-SN',
    languageName: 'Français (Afrique de l\'Ouest)',
    regionName: 'Sahel Agricultural Zone',
    countryCode: 'SN',
    flag: '🇸🇳',
    defaultCoordinates: { latitude: 14.7167, longitude: -17.4677 } // Dakar, Senegal
  },
  'pt-BR': {
    locale: 'pt-BR',
    languageName: 'Português (Brasil)',
    regionName: 'Cerrado Agro-Tech Sector',
    countryCode: 'BR',
    flag: '🇧🇷',
    defaultCoordinates: { latitude: -15.7975, longitude: -47.8919 } // Brasília, Brazil
  },
  'en-US': {
    locale: 'en-US',
    languageName: 'English (US / Global)',
    regionName: 'North America / Global Mesh',
    countryCode: 'US',
    flag: '🇺🇸',
    defaultCoordinates: { latitude: 37.7749, longitude: -122.4194 } // California, USA
  }
};

/**
 * Regional Bounding Box rules for zero-touch GPS mapping
 */
const REGIONAL_BOUNDING_BOXES: RegionBoundingBox[] = [
  // East Africa (Kenya, Tanzania, Uganda, Rwanda, Burundi) -> Swahili (sw-KE)
  {
    minLat: -12.0,
    maxLat: 5.5,
    minLng: 28.0,
    maxLng: 42.5,
    profile: SUPPORTED_LOCALES['sw-KE']
  },
  // Northern South America & Central America (Colombia, Ecuador, Peru, Mexico, Central America) -> Spanish (es-CO)
  {
    minLat: -18.5,
    maxLat: 32.5,
    minLng: -118.0,
    maxLng: -55.0,
    profile: SUPPORTED_LOCALES['es-CO']
  },
  // Brazil & Lusophone South America -> Portuguese (pt-BR)
  {
    minLat: -33.7,
    maxLat: 5.2,
    minLng: -73.9,
    maxLng: -34.7,
    profile: SUPPORTED_LOCALES['pt-BR']
  },
  // Francophone West & Central Africa (Senegal, Mali, Côte d'Ivoire, Guinea, Cameroon) -> French (fr-SN)
  {
    minLat: 4.0,
    maxLat: 20.0,
    minLng: -18.0,
    maxLng: 15.0,
    profile: SUPPORTED_LOCALES['fr-SN']
  },
  // North America (US & Canada) -> English (en-US)
  {
    minLat: 24.0,
    maxLat: 71.0,
    minLng: -168.0,
    maxLng: -52.0,
    profile: SUPPORTED_LOCALES['en-US']
  }
];

/**
 * Calculate Great-Circle distance between two coordinates in kilometers (Haversine formula)
 */
export function calculateDistanceKm(coord1: GpsCoordinates, coord2: GpsCoordinates): number {
  const R = 6371; // Earth radius in km
  const dLat = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const dLng = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1.latitude * Math.PI) / 180) *
      Math.cos((coord2.latitude * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Maps raw GPS coordinates (latitude, longitude) to the target language locale.
 * Uses strict bounding box checking first, followed by nearest hub proximity fallback.
 */
export function mapGpsToLocale(latitude: number, longitude: number): LocaleGeoProfile {
  // 1. Check if coordinates fall inside any configured regional bounding box
  for (const box of REGIONAL_BOUNDING_BOXES) {
    if (
      latitude >= box.minLat &&
      latitude <= box.maxLat &&
      longitude >= box.minLng &&
      longitude <= box.maxLng
    ) {
      return box.profile;
    }
  }

  // 2. Proximity fallback: find the nearest regional hub
  let nearestProfile = SUPPORTED_LOCALES['en-US'];
  let minDistance = Infinity;

  const currentCoords: GpsCoordinates = { latitude, longitude };
  for (const profile of Object.values(SUPPORTED_LOCALES)) {
    const dist = calculateDistanceKm(currentCoords, profile.defaultCoordinates);
    if (dist < minDistance) {
      minDistance = dist;
      nearestProfile = profile;
    }
  }

  return nearestProfile;
}

/**
 * Resolves current device or browser GPS coordinates asynchronously.
 * Falls back safely to default GPS (Kenya for agricultural pilot) if unavailable.
 */
export async function getDeviceCoordinates(): Promise<GpsCoordinates> {
  return new Promise((resolve) => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.warn('Geolocation lookup skipped or denied, using US English default', error.message);
          // Default to US English California/North America coordinates
          resolve(SUPPORTED_LOCALES['en-US'].defaultCoordinates);
        },
        { timeout: 4000, maximumAge: 60000 }
      );
    } else {
      resolve(SUPPORTED_LOCALES['en-US'].defaultCoordinates);
    }
  });
}
