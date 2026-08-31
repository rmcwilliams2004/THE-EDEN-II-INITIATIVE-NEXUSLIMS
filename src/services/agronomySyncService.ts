import { fetchAndCacheSoilData, FetchSoilDataOptions } from '../utils/agronomySync';
import { AgronomyProfile } from '../types/agronomy';

export class AgronomySyncService {
  /**
   * Syncs baseline soil data for a given Hardware Node using the Kaegro Global Soil API.
   * Checks Firestore cache first, normalizes response into AgronomyProfile, and caches it.
   * 
   * @param nodeId ID of the Hardware Node
   * @param lat Latitude of the node
   * @param lon Longitude of the node
   * @param options Optional configuration for retries and cache invalidation
   */
  static async syncBaseline(
    nodeId: string,
    lat: number,
    lon: number,
    options?: FetchSoilDataOptions
  ): Promise<AgronomyProfile> {
    return fetchAndCacheSoilData(lat, lon, nodeId, options);
  }
}
