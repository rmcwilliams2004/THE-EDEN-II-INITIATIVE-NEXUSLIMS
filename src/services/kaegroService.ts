import axios from 'axios';

const KAEGRO_BASE_URL = process.env.KAEGRO_BASE_URL || 'https://api.kaegro.com';
const KAEGRO_DEVICE_API_KEY = process.env.KAEGRO_DEVICE_API_KEY || '';

export class KaegroService {
  /**
   * Fetch Soil Profile Data
   * Retrieves estimated pH levels, moisture indexes, and nutrient recommendations
   * based on specific farm coordinates.
   * 
   * @param lat Latitude of the edge container
   * @param lon Longitude of the edge container
   */
  static async getSoilProfile(lat: number, lon: number) {
    try {
      const response = await axios.get(`${KAEGRO_BASE_URL}/farms/api/soil`, {
        params: { lat, lon }
      });
      return response.data;
    } catch (error) {
      console.error('[KaegroService] Error fetching soil profile:', error);
      throw error;
    }
  }

  /**
   * Ingest High-Volume Device Data
   * Pushes edge IoT telemetry directly into the Kaegro platform.
   * 
   * @param payload The raw telemetry payload from the edge node
   */
  static async ingestTelemetry(payload: Record<string, any>) {
    try {
      const response = await axios.post(`${KAEGRO_BASE_URL}/farms/api/iot/telemetry`, {
        device_api_key: KAEGRO_DEVICE_API_KEY,
        payload
      });
      return response.data;
    } catch (error) {
      console.error('[KaegroService] Error ingesting telemetry:', error);
      throw error;
    }
  }
}
