import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { KaegroService } from './kaegroService';

export class AgronomySyncService {
  /**
   * Syncs baseline soil data for a given Hardware Node.
   * Checks the cache in Firestore first. If missing, fetches from Kaegro API,
   * normalizes the data, and stores it in the Agronomy_Profiles schema.
   * 
   * @param nodeId ID of the Hardware Node
   * @param lat Latitude of the node
   * @param lon Longitude of the node
   */
  static async syncBaseline(nodeId: string, lat: number, lon: number) {
    try {
      const profileRef = doc(db, 'agronomy_profiles', nodeId);
      const snapshot = await getDoc(profileRef);

      // 1. Check if we already have a cached profile for this node
      if (snapshot.exists()) {
        console.log(`[AgronomySyncService] Cache hit for Agronomy Profile: ${nodeId}`);
        return snapshot.data();
      }

      // 2. Fetch fresh baseline data from Kaegro API
      console.log(`[AgronomySyncService] Fetching baseline from Kaegro API for node ${nodeId} at (${lat}, ${lon})`);
      const soilData = await KaegroService.getSoilProfile(lat, lon);

      // 3. Normalize to CGIAR / Internal standards (Agronomy_Profiles schema)
      const agronomyProfile = {
        nodeId,
        lat,
        lon,
        faoClassification: soilData.classification || 'UNKNOWN',
        phBaseline: parseFloat(soilData.ph_h2o) || 7.0,
        cecRatio: parseFloat(soilData.cation_exchange) || 15.0,
        soilMoistureIndex: parseFloat(soilData.moisture_index) || 0,
        lastSyncedAt: serverTimestamp(),
        source: 'KAEGRO_API_V2'
      };

      // 4. Cache the result in Firestore
      await setDoc(profileRef, agronomyProfile);
      console.log(`[AgronomySyncService] Successfully cached new Agronomy Profile for ${nodeId}`);

      return agronomyProfile;
    } catch (error) {
      console.error(`[AgronomySyncService] Failed to sync baseline for ${nodeId}:`, error);
      throw error;
    }
  }
}
