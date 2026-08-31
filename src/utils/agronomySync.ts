import { db, auth } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { KaegroService } from '../services/kaegroService';
import { AgronomyProfile, KaegroSoilResponse, SoilComposition, SoilNutrients } from '../types/agronomy';

export enum FirestoreOperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: FirestoreOperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

/**
 * Throws structured error context for Firestore operations as required by security specifications.
 */
function handleFirestoreError(error: unknown, operationType: FirestoreOperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid ?? null,
      email: auth?.currentUser?.email ?? null,
      emailVerified: auth?.currentUser?.emailVerified ?? null,
      isAnonymous: auth?.currentUser?.isAnonymous ?? null,
      tenantId: auth?.currentUser?.tenantId ?? null,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('[agronomySync] Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Options to configure the soil data fetch and caching behavior.
 */
export interface FetchSoilDataOptions {
  /** Maximum number of retry attempts on network/server failure (default: 3) */
  maxRetries?: number;
  /** Initial delay in ms before first retry (default: 1000) */
  initialRetryDelayMs?: number;
  /** Backoff multiplier for consecutive retries (default: 2) */
  backoffFactor?: number;
  /** If true, bypasses the Firestore cache and forces a fresh API sync */
  forceRefresh?: boolean;
}

/**
 * Helper to safely parse and clamp numeric values from potentially messy API payloads.
 */
function parseNumeric(
  value: string | number | undefined | null,
  fallback = 0,
  min?: number,
  max?: number
): number {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  const parsed = typeof value === 'number' ? value : parseFloat(String(value).trim());
  if (isNaN(parsed) || !isFinite(parsed)) {
    return fallback;
  }
  if (min !== undefined && parsed < min) return min;
  if (max !== undefined && parsed > max) return max;
  return Number(parsed.toFixed(4));
}

/**
 * Validates geographical coordinates.
 */
export function validateCoordinates(lat: number, lon: number): { valid: boolean; error?: string } {
  if (typeof lat !== 'number' || typeof lon !== 'number' || isNaN(lat) || isNaN(lon) || !isFinite(lat) || !isFinite(lon)) {
    return { valid: false, error: `Invalid coordinate types: lat=${lat}, lon=${lon}` };
  }
  if (lat < -90 || lat > 90) {
    return { valid: false, error: `Latitude ${lat} is out of bounds (-90 to +90)` };
  }
  if (lon < -180 || lon > 180) {
    return { valid: false, error: `Longitude ${lon} is out of bounds (-180 to +180)` };
  }
  return { valid: true };
}

/**
 * Normalizes raw soil data from the Kaegro Global Soil API into the internal AgronomyProfile schema.
 */
export function normalizeKaegroSoilData(
  raw: KaegroSoilResponse,
  lat: number,
  lon: number,
  documentId: string,
  nodeId?: string
): AgronomyProfile {
  // Normalize soil texture percentages (0 - 100%)
  const sand = parseNumeric(raw.sand_percentage, 0, 0, 100);
  const silt = parseNumeric(raw.silt_percentage, 0, 0, 100);
  const clay = parseNumeric(raw.clay_percentage, 0, 0, 100);
  const organicCarbon = parseNumeric(raw.organic_carbon, 0, 0, 100);

  const soilComposition: SoilComposition = {
    sand,
    silt,
    clay,
    organicCarbon,
  };

  // Normalize primary macronutrients (NPK)
  const nutrients: SoilNutrients = {
    nitrogen: parseNumeric(raw.nitrogen_total, 0, 0),
    phosphorus: parseNumeric(raw.phosphorus_extractable, 0, 0),
    potassium: parseNumeric(raw.potassium_extractable, 0, 0),
  };

  // Normalize physicochemical soil metrics
  const phBaseline = parseNumeric(raw.ph_h2o, 7.0, 0, 14); // Soil pH range [0, 14]
  const cecRatio = parseNumeric(raw.cation_exchange, 15.0, 0); // Cation Exchange Capacity (cmol(+)/kg)
  const soilMoistureIndex = parseNumeric(raw.moisture_index, 0, 0, 100); // Moisture % or index
  const electricalConductivity = parseNumeric(raw.electrical_conductivity, 0, 0); // Salinity (dS/m)
  const bulkDensity = parseNumeric(raw.bulk_density, 1.3, 0.1, 3.0); // Standard soil bulk density (g/cm³)

  return {
    id: documentId,
    nodeId: nodeId || null,
    lat,
    lon,
    faoClassification: raw.classification ? String(raw.classification).trim().toUpperCase() : 'UNKNOWN',
    phBaseline,
    cecRatio,
    soilMoistureIndex,
    electricalConductivity,
    bulkDensity,
    soilComposition,
    nutrients,
    lastSyncedAt: serverTimestamp(),
    source: 'KAEGRO_GLOBAL_SOIL_API_V2'
  };
}

/**
 * Fetches baseline soil data from Kaegro Global Soil API, normalizes it to our internal
 * Agronomy_Profile schema, and caches it in Firestore with automatic retries and error handling.
 * 
 * @param lat Latitude of the target location (-90 to 90)
 * @param lon Longitude of the target location (-180 to 180)
 * @param nodeId Optional Hardware Node ID to associate with this profile
 * @param options Optional configuration for retries, backoff, and cache invalidation
 * @returns The normalized and cached AgronomyProfile
 */
export async function fetchAndCacheSoilData(
  lat: number,
  lon: number,
  nodeId?: string,
  options?: FetchSoilDataOptions
): Promise<AgronomyProfile> {
  const parsedLat = typeof lat === 'number' ? lat : parseFloat(String(lat));
  const parsedLon = typeof lon === 'number' ? lon : parseFloat(String(lon));

  // 1. Strict input validation
  const coordValidation = validateCoordinates(parsedLat, parsedLon);
  if (!coordValidation.valid) {
    console.error(`[agronomySync] Validation Error: ${coordValidation.error}`);
    throw new Error(`[agronomySync] ${coordValidation.error}`);
  }

  // Derive document identifier (use sanitized nodeId or rounded geo-coordinate key)
  const sanitizedNodeId = nodeId ? nodeId.replace(/[^a-zA-Z0-9_\-]/g, '_') : undefined;
  const documentId = sanitizedNodeId || `geo_${parsedLat.toFixed(4)}_${parsedLon.toFixed(4)}`.replace(/[\.]/g, '_');
  const firestorePath = `agronomy_profiles/${documentId}`;
  const profileRef = doc(db, 'agronomy_profiles', documentId);

  // Configuration defaults
  const maxRetries = options?.maxRetries ?? 3;
  const initialRetryDelayMs = options?.initialRetryDelayMs ?? 1000;
  const backoffFactor = options?.backoffFactor ?? 2;
  const forceRefresh = options?.forceRefresh ?? false;

  // 2. Check cache first (unless forceRefresh requested)
  if (!forceRefresh) {
    try {
      const snapshot = await getDoc(profileRef);
      if (snapshot.exists()) {
        const cachedData = snapshot.data() as AgronomyProfile;
        console.log(`[agronomySync] Cache hit for profile document: ${documentId}`);
        return cachedData;
      }
    } catch (err: unknown) {
      console.warn(`[agronomySync] Failed to read cache for ${firestorePath}, falling back to remote API fetch:`, err);
      // If permission or critical firestore error, handle with standard error logger
      if (err instanceof Error && err.message.includes('permission')) {
        handleFirestoreError(err, FirestoreOperationType.GET, firestorePath);
      }
    }
  }

  // 3. Fetch from Kaegro Global Soil API with Exponential Backoff Retry Mechanism
  console.log(`[agronomySync] Fetching fresh baseline from Kaegro API for (${parsedLat}, ${parsedLon})`);

  let soilData: KaegroSoilResponse | null = null;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      soilData = (await KaegroService.getSoilProfile(parsedLat, parsedLon)) as KaegroSoilResponse;
      if (!soilData || typeof soilData !== 'object') {
        throw new Error('Kaegro API returned empty or invalid payload');
      }
      break; // Successfully fetched, exit loop
    } catch (error: any) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const status = error?.response?.status;
      const isClientError = status && status >= 400 && status < 500 && status !== 429; // 4xx (except 429 rate limit) is non-retryable
      
      console.warn(
        `[agronomySync] Kaegro API request failed (Attempt ${attempt}/${maxRetries}) ` +
        `for coords (${parsedLat}, ${parsedLon}): ${lastError.message}`
      );

      if (isClientError) {
        console.error(`[agronomySync] Non-retryable client error (HTTP ${status}) from Kaegro API:`, lastError.message);
        throw new Error(`[agronomySync] Kaegro API client error (HTTP ${status}): ${lastError.message}`);
      }

      if (attempt < maxRetries) {
        // Exponential backoff with slight jitter
        const delayMs = initialRetryDelayMs * Math.pow(backoffFactor, attempt - 1) + Math.random() * 200;
        console.log(`[agronomySync] Waiting ${Math.round(delayMs)}ms before retry attempt ${attempt + 1}...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  if (!soilData) {
    const finalErrorMessage = `Failed to fetch soil data from Kaegro API after ${maxRetries} attempts. Last error: ${lastError?.message ?? 'Unknown'}`;
    console.error(`[agronomySync] ${finalErrorMessage}`);
    throw new Error(finalErrorMessage);
  }

  // 4. Normalize to our internal AgronomyProfile schema
  const agronomyProfile = normalizeKaegroSoilData(soilData, parsedLat, parsedLon, documentId, nodeId);

  // 5. Cache the normalized profile in Firestore
  try {
    await setDoc(profileRef, agronomyProfile);
    console.log(`[agronomySync] Successfully cached AgronomyProfile to Firestore [${firestorePath}]`);
  } catch (err: unknown) {
    console.error(`[agronomySync] Error saving AgronomyProfile to Firestore [${firestorePath}]:`, err);
    handleFirestoreError(err, FirestoreOperationType.WRITE, firestorePath);
  }

  return agronomyProfile;
}
