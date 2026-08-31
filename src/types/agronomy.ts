import { FieldValue } from 'firebase/firestore';

/**
 * Represents the raw response structure from the Kaegro API.
 * The API typically returns stringified numbers for scientific data.
 */
export interface KaegroSoilResponse {
  classification?: string;
  ph_h2o?: string | number;
  cation_exchange?: string | number;
  moisture_index?: string | number;
  sand_percentage?: string | number;
  silt_percentage?: string | number;
  clay_percentage?: string | number;
  organic_carbon?: string | number;
  electrical_conductivity?: string | number;
  bulk_density?: string | number;
  nitrogen_total?: string | number;
  phosphorus_extractable?: string | number;
  potassium_extractable?: string | number;
  // Index signature for any additional properties returned by the API
  [key: string]: any;
}

/**
 * Represents the essential soil macronutrients (NPK)
 */
export interface SoilNutrients {
  nitrogen: number;
  phosphorus: number;
  potassium: number;
}

/**
 * Represents the soil composition structure within an Agronomy Profile
 */
export interface SoilComposition {
  sand: number;
  silt: number;
  clay: number;
  organicCarbon: number;
}

/**
 * Represents the normalized internal Agronomy Profile model
 * used within the application and cached in the database.
 */
export interface AgronomyProfile {
  id: string;
  nodeId: string | null;
  lat: number;
  lon: number;
  faoClassification: string;
  phBaseline: number;
  cecRatio: number;
  soilMoistureIndex: number;
  electricalConductivity: number;
  bulkDensity: number;
  soilComposition: SoilComposition;
  nutrients: SoilNutrients;
  lastSyncedAt: FieldValue | Date;
  source: string;
}
