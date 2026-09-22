/**
 * Atmospheric & Agronomic Weather Service Module
 * NexusLIMS Edge Weather Engine for Eden II Distributed Ammonia Nodes
 * 
 * Powered by Open-Meteo Free API (Zero-Cost, No-Auth)
 * Features: High-resolution atmospheric ingestion, VPD Tetens formula,
 * WMO code mapping, severe advisory engine & offline caching.
 */

export interface AtmosphericCurrent {
  temperature2m: number; // °C
  relativeHumidity2m: number; // %
  windSpeed10m: number; // km/h
  windDirection10m?: number; // degrees (0-360)
  weatherCode: number;
  weatherDescription: string;
  isDay?: number;
  vaporPressureDeficitKPa: number; // VPD in kPa
  dewPointC: number; // Dew point in °C
  apparentTemperatureC: number; // Feels like in °C
}

export interface DailyForecastDay {
  date: string; // YYYY-MM-DD
  temperatureMax: number; // °C
  temperatureMin: number; // °C
  et0Evapotranspiration: number; // FAO-56 Reference ET0 in mm/day
  precipitationProbabilityMax: number; // %
  precipitationSum?: number; // mm
  windSpeedMax?: number; // km/h
  weatherCode: number;
  weatherDescription: string;
}

export type WeatherAlertSeverity = 'INFO' | 'ADVISORY' | 'WARNING' | 'CRITICAL';
export type WeatherAlertCategory = 
  | 'HEAT' 
  | 'FREEZE' 
  | 'DROUGHT_ET0' 
  | 'STORM_WIND' 
  | 'PRECIPITATION' 
  | 'PEST_RISK'
  | 'VPD_STRESS';

export interface AtmosphericAlert {
  id: string;
  severity: WeatherAlertSeverity;
  category: WeatherAlertCategory;
  headline: string;
  description: string;
  recommendedAction: string;
  prehydrationTrigger: boolean;
  timestamp: string;
}

export interface WeatherResponse {
  latitude: number;
  longitude: number;
  elevation: number;
  timezone: string;
  current: AtmosphericCurrent;
  daily: DailyForecastDay[];
  alerts: AtmosphericAlert[];
  isPrehydrationRecommended: boolean;
  cachedAt: string;
  isOfflineFallback: boolean;
}

// Storage prefix for caching weather forecasts on edge nodes
const WEATHER_CACHE_PREFIX = 'nexuslims_weather_cache_';

/**
 * WMO Weather Interpretation Codes (WW)
 */
export function getWmoWeatherDescription(code: number): string {
  switch (code) {
    case 0: return 'Clear Sky';
    case 1: return 'Mainly Clear';
    case 2: return 'Partly Cloudy';
    case 3: return 'Overcast';
    case 45: return 'Fog & Depositing Rime';
    case 48: return 'Icy Fog';
    case 51: return 'Light Drizzle';
    case 53: return 'Moderate Drizzle';
    case 55: return 'Dense Drizzle';
    case 56: return 'Light Freezing Drizzle';
    case 57: return 'Dense Freezing Drizzle';
    case 61: return 'Slight Rain';
    case 62: return 'Moderate Rain';
    case 63: return 'Moderate Rain';
    case 65: return 'Heavy Rain';
    case 66: return 'Light Freezing Rain';
    case 67: return 'Heavy Freezing Rain';
    case 71: return 'Slight Snow Fall';
    case 73: return 'Moderate Snow Fall';
    case 75: return 'Heavy Snow Fall';
    case 77: return 'Snow Grains';
    case 80: return 'Slight Rain Showers';
    case 81: return 'Moderate Rain Showers';
    case 82: return 'Violent Rain Showers';
    case 85: return 'Slight Snow Showers';
    case 86: return 'Heavy Snow Showers';
    case 95: return 'Thunderstorm (Slight/Moderate)';
    case 96: return 'Thunderstorm with Slight Hail';
    case 99: return 'Thunderstorm with Heavy Hail';
    default: return 'Atmospheric Variance';
  }
}

/**
 * Calculate Vapor Pressure Deficit (VPD in kPa) using the Tetens Equation
 * VPD = Saturated Vapor Pressure (e_s) - Actual Vapor Pressure (e_a)
 */
export function calculateVpdKPa(temperatureC: number, relativeHumidityPct: number): number {
  // Saturated Vapor Pressure (kPa)
  const es = 0.61078 * Math.exp((17.27 * temperatureC) / (temperatureC + 237.3));
  // Actual Vapor Pressure (kPa)
  const ea = es * (Math.max(0, Math.min(100, relativeHumidityPct)) / 100);
  const vpd = Math.max(0, es - ea);
  return Number(vpd.toFixed(2));
}

/**
 * Calculate Dew Point (°C) using Magnus-Tetens approximation
 */
export function calculateDewPointC(temperatureC: number, relativeHumidityPct: number): number {
  const a = 17.27;
  const b = 237.7;
  const alpha = ((a * temperatureC) / (b + temperatureC)) + Math.log(Math.max(0.01, relativeHumidityPct) / 100);
  const dewPoint = (b * alpha) / (a - alpha);
  return Number(dewPoint.toFixed(1));
}

/**
 * Evaluate severe atmospheric thresholds and generate agronomic alerts
 */
export function evaluateAtmosphericAlerts(
  current: AtmosphericCurrent,
  daily: DailyForecastDay[]
): { alerts: AtmosphericAlert[]; isPrehydrationRecommended: boolean } {
  const alerts: AtmosphericAlert[] = [];
  const now = new Date().toISOString();
  let isPrehydrationRecommended = false;

  const todayForecast = daily[0];
  const maxTemp = todayForecast ? Math.max(current.temperature2m, todayForecast.temperatureMax) : current.temperature2m;
  const maxEt0 = todayForecast?.et0Evapotranspiration || 0;

  // 1. Extreme Heat & High Evapotranspiration -> Preemptive Root Hydration Trigger
  if (maxEt0 >= 6.0 || maxTemp >= 38.0) {
    isPrehydrationRecommended = true;
    alerts.push({
      id: `alert-heat-et0-${Date.now()}`,
      severity: maxTemp >= 40.0 || maxEt0 >= 7.5 ? 'CRITICAL' : 'WARNING',
      category: 'DROUGHT_ET0',
      headline: `High Evapotranspiration Surge: ${maxEt0.toFixed(1)} mm/day (Peak ${maxTemp.toFixed(1)}°C)`,
      description: 'Severe transpirational draw projected across the rhizosphere. Canopy moisture depletion accelerates nitrogen burn risks.',
      recommendedAction: 'Engage preemptive root hydration buffer and dilute aqueous foliar dosing by 35% to prevent leaf scorch.',
      prehydrationTrigger: true,
      timestamp: now,
    });
  } else if (maxEt0 >= 4.8 || maxTemp >= 33.0) {
    isPrehydrationRecommended = true;
    alerts.push({
      id: `alert-elevated-et0-${Date.now()}`,
      severity: 'ADVISORY',
      category: 'DROUGHT_ET0',
      headline: `Elevated Evapotranspiration Rate: ${maxEt0.toFixed(1)} mm/day`,
      description: 'Atmospheric demand will draw significant subsoil moisture by mid-afternoon.',
      recommendedAction: 'Schedule rootzone fertigation cycle before 10:00 AM local solar peak.',
      prehydrationTrigger: true,
      timestamp: now,
    });
  }

  // 2. Vapor Pressure Deficit (VPD) Extreme Stress
  if (current.vaporPressureDeficitKPa >= 2.4) {
    alerts.push({
      id: `alert-vpd-high-${Date.now()}`,
      severity: 'WARNING',
      category: 'VPD_STRESS',
      headline: `Severe Vapor Pressure Deficit (${current.vaporPressureDeficitKPa} kPa)`,
      description: 'Stomata closure active. Crop photosynthesis inhibited due to extreme atmospheric dryness.',
      recommendedAction: 'Suspend foliar spraying until relative humidity rises and VPD falls below 1.6 kPa.',
      prehydrationTrigger: false,
      timestamp: now,
    });
  } else if (current.vaporPressureDeficitKPa <= 0.35 && current.relativeHumidity2m >= 88) {
    alerts.push({
      id: `alert-vpd-low-${Date.now()}`,
      severity: 'ADVISORY',
      category: 'PEST_RISK',
      headline: `High Humidity Saturation (VPD ${current.vaporPressureDeficitKPa} kPa, RH ${current.relativeHumidity2m}%)`,
      description: 'Prolonged leaf wetness creates favorable incubation for fungal spores and bacterial blight.',
      recommendedAction: 'Increase canopy airflow monitoring; avoid late evening sprinkler fertigation.',
      prehydrationTrigger: false,
      timestamp: now,
    });
  }

  // 3. High Wind Vectors (Foliar Drift Lockout)
  if (current.windSpeed10m >= 35.0) {
    alerts.push({
      id: `alert-wind-${Date.now()}`,
      severity: current.windSpeed10m >= 50.0 ? 'CRITICAL' : 'WARNING',
      category: 'STORM_WIND',
      headline: `High Wind Speed: ${current.windSpeed10m.toFixed(1)} km/h`,
      description: 'Off-target droplet drift hazard. Knapsack and boom spraying efficiency drops below 40%.',
      recommendedAction: 'Lock out Mode B smallholder foliar dispensing until wind drops below 20 km/h.',
      prehydrationTrigger: false,
      timestamp: now,
    });
  }

  // 4. Frost / Freezing Temperature Hazard
  const minTemp = todayForecast ? Math.min(current.temperature2m, todayForecast.temperatureMin) : current.temperature2m;
  if (minTemp <= 2.0) {
    alerts.push({
      id: `alert-freeze-${Date.now()}`,
      severity: minTemp <= -2.0 ? 'CRITICAL' : 'WARNING',
      category: 'FREEZE',
      headline: `Freeze & Frost Risk: Projected Minimum ${minTemp.toFixed(1)}°C`,
      description: 'Risk of vegetative tissue freeze damage and line crystallisation in surface irrigation manifolds.',
      recommendedAction: 'Drain exposed foliar dosing lines and engage container auxiliary heat tracing.',
      prehydrationTrigger: false,
      timestamp: now,
    });
  }

  // 5. Severe Thunderstorm / Hail WMO Codes
  if (current.weatherCode >= 95) {
    alerts.push({
      id: `alert-storm-${Date.now()}`,
      severity: 'CRITICAL',
      category: 'STORM_WIND',
      headline: `Severe Storm & Hail Warning: ${current.weatherDescription}`,
      description: 'Lightning, high gust fronts, or hail potential near container perimeter.',
      recommendedAction: 'Stow container deployable solar panels, latch kiosk bay door, and maintain backup battery charge.',
      prehydrationTrigger: false,
      timestamp: now,
    });
  }

  return { alerts, isPrehydrationRecommended };
}

/**
 * Fallback generator for resilient offline operation
 */
function createOfflineFallback(latitude: number, longitude: number): WeatherResponse {
  // Determine seasonal default based on latitude
  const isTropical = Math.abs(latitude) < 23.5;
  const temp = isTropical ? 27.4 : 21.8;
  const rh = isTropical ? 68 : 55;
  const vpd = calculateVpdKPa(temp, rh);
  const dewPoint = calculateDewPointC(temp, rh);

  const mockDaily: DailyForecastDay[] = Array.from({ length: 5 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      date: d.toISOString().split('T')[0],
      temperatureMax: temp + (i % 2 === 0 ? 3.2 : 2.1),
      temperatureMin: temp - 8.5,
      et0Evapotranspiration: 5.4 + (i * 0.2),
      precipitationProbabilityMax: 15 + (i * 5),
      weatherCode: 2,
      weatherDescription: 'Partly Cloudy (Cached Model)',
    };
  });

  const current: AtmosphericCurrent = {
    temperature2m: temp,
    relativeHumidity2m: rh,
    windSpeed10m: 12.6,
    windDirection10m: 140,
    weatherCode: 2,
    weatherDescription: 'Partly Cloudy (Edge Fallback)',
    isDay: 1,
    vaporPressureDeficitKPa: vpd,
    dewPointC: dewPoint,
    apparentTemperatureC: temp + 1.2,
  };

  const { alerts, isPrehydrationRecommended } = evaluateAtmosphericAlerts(current, mockDaily);

  return {
    latitude,
    longitude,
    elevation: 1650,
    timezone: 'auto',
    current,
    daily: mockDaily,
    alerts,
    isPrehydrationRecommended,
    cachedAt: new Date().toISOString(),
    isOfflineFallback: true,
  };
}

/**
 * Main Weather Fetcher with Open-Meteo Integration & Local Caching
 */
export async function fetchAtmosphericWeather(
  latitude: number,
  longitude: number
): Promise<WeatherResponse> {
  const cacheKey = `${WEATHER_CACHE_PREFIX}${latitude.toFixed(2)}_${longitude.toFixed(2)}`;

  try {
    const endpoint = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,et0_fao_evapotranspiration,precipitation_probability_max,precipitation_sum,wind_speed_10m_max&timezone=auto`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6500); // 6.5s timeout for weak cellular/satellite

    const response = await fetch(endpoint, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Open-Meteo HTTP error: ${response.status}`);
    }

    const json = await response.json();

    const currRaw = json.current || {};
    const dailyRaw = json.daily || {};

    const temp2m = Number(currRaw.temperature_2m ?? 24.0);
    const rh2m = Number(currRaw.relative_humidity_2m ?? 50.0);
    const windSpeed = Number(currRaw.wind_speed_10m ?? 8.0);
    const windDir = Number(currRaw.wind_direction_10m ?? 0);
    const code = Number(currRaw.weather_code ?? 0);
    const apparent = Number(currRaw.apparent_temperature ?? temp2m);
    const isDay = Number(currRaw.is_day ?? 1);

    const vpd = calculateVpdKPa(temp2m, rh2m);
    const dewPoint = calculateDewPointC(temp2m, rh2m);
    const weatherDescription = getWmoWeatherDescription(code);

    const current: AtmosphericCurrent = {
      temperature2m: temp2m,
      relativeHumidity2m: rh2m,
      windSpeed10m: windSpeed,
      windDirection10m: windDir,
      weatherCode: code,
      weatherDescription,
      isDay,
      vaporPressureDeficitKPa: vpd,
      dewPointC: dewPoint,
      apparentTemperatureC: apparent,
    };

    // Format Daily Array (up to 7 days)
    const dailyCount = Array.isArray(dailyRaw.time) ? dailyRaw.time.length : 0;
    const daily: DailyForecastDay[] = [];

    for (let i = 0; i < dailyCount; i++) {
      const dCode = Number(dailyRaw.weather_code?.[i] ?? 0);
      daily.push({
        date: dailyRaw.time[i],
        temperatureMax: Number(dailyRaw.temperature_2m_max?.[i] ?? temp2m + 4),
        temperatureMin: Number(dailyRaw.temperature_2m_min?.[i] ?? temp2m - 5),
        et0Evapotranspiration: Number(dailyRaw.et0_fao_evapotranspiration?.[i] ?? 4.5),
        precipitationProbabilityMax: Number(dailyRaw.precipitation_probability_max?.[i] ?? 10),
        precipitationSum: Number(dailyRaw.precipitation_sum?.[i] ?? 0),
        windSpeedMax: Number(dailyRaw.wind_speed_10m_max?.[i] ?? windSpeed + 5),
        weatherCode: dCode,
        weatherDescription: getWmoWeatherDescription(dCode),
      });
    }

    const { alerts, isPrehydrationRecommended } = evaluateAtmosphericAlerts(current, daily);

    const result: WeatherResponse = {
      latitude: json.latitude ?? latitude,
      longitude: json.longitude ?? longitude,
      elevation: json.elevation ?? 0,
      timezone: json.timezone ?? 'auto',
      current,
      daily,
      alerts,
      isPrehydrationRecommended,
      cachedAt: new Date().toISOString(),
      isOfflineFallback: false,
    };

    // Save to localStorage for satellite dropouts
    try {
      localStorage.setItem(cacheKey, JSON.stringify(result));
    } catch {
      // ignore storage quota issues
    }

    return result;
  } catch (err: any) {
    console.warn(`[WeatherService] Open-Meteo fetch failed (${err.message}). Attempting local cache fallback...`);

    // Check local storage cache
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed: WeatherResponse = JSON.parse(cached);
        parsed.isOfflineFallback = true;
        // Re-evaluate alerts against current time
        const recheck = evaluateAtmosphericAlerts(parsed.current, parsed.daily);
        parsed.alerts = recheck.alerts;
        parsed.isPrehydrationRecommended = recheck.isPrehydrationRecommended;
        return parsed;
      }
    } catch {
      // ignore parse errors
    }

    return createOfflineFallback(latitude, longitude);
  }
}
