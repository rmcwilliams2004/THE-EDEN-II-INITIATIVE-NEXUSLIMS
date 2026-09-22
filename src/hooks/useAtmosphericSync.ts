/**
 * Atmospheric & Agronomic Edge Synchronization Hook
 * NexusLIMS Platform - Eden II Micro-DGA Container Nodes
 * 
 * Synchronizes real-time Open-Meteo weather telemetry, VPD stress indexes,
 * FAO-56 evapotranspiration (ET0), agricultural bulletins, and automated
 * pre-hydration triggers.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  GpsCoordinates,
  getDeviceCoordinates,
  mapGpsToLocale,
  LocaleGeoProfile,
} from '../utils/geoLocator';
import {
  fetchAtmosphericWeather,
  WeatherResponse,
  AtmosphericCurrent,
  DailyForecastDay,
  AtmosphericAlert,
} from '../services/weatherService';
import {
  fetchRegionalAgriNews,
  AgriNewsItem,
  determineAgroZone,
  AgroZoneId,
} from '../services/agriNewsService';
import { useLanguage } from '../context/LanguageContext';

export interface UseAtmosphericSyncOptions {
  customCoordinates?: GpsCoordinates;
  autoRefreshIntervalMs?: number; // default: 5 minutes (300,000ms)
  onPrehydrationTriggered?: (details: { maxTemp: number; et0: number; reason: string }) => void;
  onSevereAlertDetected?: (alert: AtmosphericAlert) => void;
}

export type VpdStressLevel = 
  | 'OPTIMAL' 
  | 'MODERATE_STRESS' 
  | 'SEVERE_TRANSPIRATION_DEFICIT' 
  | 'HUMID_SATURATION';

export function useAtmosphericSync(options?: UseAtmosphericSyncOptions) {
  const { locale } = useLanguage();
  const [coords, setCoords] = useState<GpsCoordinates>({ latitude: -1.286389, longitude: 36.817223 }); // Default Rift Valley
  const [geoProfile, setGeoProfile] = useState<LocaleGeoProfile | null>(null);
  const [agroZone, setAgroZone] = useState<AgroZoneId>('EAST_AFRICA');
  
  const [weatherData, setWeatherData] = useState<WeatherResponse | null>(null);
  const [newsItems, setNewsItems] = useState<AgriNewsItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);

  // Prehydration dispatch state to edge controller
  const [isPrehydrationEngaged, setIsPrehydrationEngaged] = useState<boolean>(false);
  const [prehydrationLog, setPrehydrationLog] = useState<string | null>(null);

  // 1. Resolve GPS Coordinates
  useEffect(() => {
    let isMounted = true;
    async function resolveLocation() {
      if (options?.customCoordinates) {
        if (isMounted) {
          setCoords(options.customCoordinates);
          setGeoProfile(mapGpsToLocale(options.customCoordinates.latitude, options.customCoordinates.longitude));
          setAgroZone(determineAgroZone(options.customCoordinates));
        }
        return;
      }

      try {
        const resolved = await getDeviceCoordinates();
        if (isMounted) {
          setCoords(resolved);
          setGeoProfile(mapGpsToLocale(resolved.latitude, resolved.longitude));
          setAgroZone(determineAgroZone(resolved));
        }
      } catch (err) {
        console.warn('[useAtmosphericSync] Using fallback coordinates', err);
      }
    }

    resolveLocation();
    return () => { isMounted = false; };
  }, [options?.customCoordinates]);

  // 2. Main Synchronous Fetcher
  const syncAtmosphericData = useCallback(async (targetCoords?: GpsCoordinates) => {
    const activeCoords = targetCoords || coords;
    setIsLoading(true);
    setError(null);

    try {
      const [weather, news] = await Promise.all([
        fetchAtmosphericWeather(activeCoords.latitude, activeCoords.longitude),
        fetchRegionalAgriNews(activeCoords, locale),
      ]);

      setWeatherData(weather);
      setNewsItems(news);
      setLastRefreshedAt(new Date());

      // Check severe alerts callback
      const criticalAlert = weather.alerts.find((a) => a.severity === 'CRITICAL' || a.severity === 'WARNING');
      if (criticalAlert && options?.onSevereAlertDetected) {
        options.onSevereAlertDetected(criticalAlert);
      }

      // Check pre-hydration trigger callback
      if (weather.isPrehydrationRecommended && options?.onPrehydrationTriggered) {
        const today = weather.daily[0];
        options.onPrehydrationTriggered({
          maxTemp: today?.temperatureMax || weather.current.temperature2m,
          et0: today?.et0Evapotranspiration || 0,
          reason: 'High atmospheric evapotranspiration & thermal stress threshold exceeded',
        });
      }
    } catch (err: any) {
      console.error('[useAtmosphericSync] Sync failure:', err);
      setError(err.message || 'Atmospheric sync failed');
    } finally {
      setIsLoading(false);
    }
  }, [coords, locale, options]);

  // Initial and coordinate change sync
  useEffect(() => {
    syncAtmosphericData(coords);
  }, [coords.latitude, coords.longitude, syncAtmosphericData]);

  // Periodic Auto-refresh (defaults to 5 minutes)
  useEffect(() => {
    const intervalTime = options?.autoRefreshIntervalMs || 300000;
    const interval = setInterval(() => {
      syncAtmosphericData();
    }, intervalTime);

    return () => clearInterval(interval);
  }, [syncAtmosphericData, options?.autoRefreshIntervalMs]);

  // Calculate VPD Stress Category
  const vpdStressLevel: VpdStressLevel = useMemo(() => {
    if (!weatherData) return 'OPTIMAL';
    const vpd = weatherData.current.vaporPressureDeficitKPa;
    if (vpd >= 2.2) return 'SEVERE_TRANSPIRATION_DEFICIT';
    if (vpd >= 1.6) return 'MODERATE_STRESS';
    if (vpd <= 0.4 && weatherData.current.relativeHumidity2m >= 85) return 'HUMID_SATURATION';
    return 'OPTIMAL';
  }, [weatherData]);

  // Trigger Pre-hydration on edge controller
  const triggerPrehydrationCycle = useCallback(() => {
    setIsPrehydrationEngaged(true);
    const time = new Date().toLocaleTimeString();
    setPrehydrationLog(`[${time}] PLC Command: OUTBOUND_PREHYDRATION_VALVE_OPEN (Target: 450L @ 1.2 Bar, Rootzone Buffer Active)`);
  }, []);

  const cancelPrehydrationCycle = useCallback(() => {
    setIsPrehydrationEngaged(false);
    const time = new Date().toLocaleTimeString();
    setPrehydrationLog(`[${time}] PLC Command: PREHYDRATION_DISENGAGED (Returned to standard LoRaWAN closed-loop pH schedule)`);
  }, []);

  // Helper for Gemini Live Audio Kiosk announcement
  const getSevereAlertSpeechText = useCallback((): string | null => {
    if (!weatherData || weatherData.alerts.length === 0) return null;
    const topAlert = weatherData.alerts[0];
    return `Attention Operator: Atmospheric advisory active. ${topAlert.headline}. ${topAlert.recommendedAction}`;
  }, [weatherData]);

  return {
    coords,
    geoProfile,
    agroZone,
    weatherData,
    currentWeather: weatherData?.current || null,
    dailyForecast: weatherData?.daily || [],
    alerts: weatherData?.alerts || [],
    newsItems,
    isLoading,
    error,
    lastRefreshedAt,
    isOfflineFallback: weatherData?.isOfflineFallback || false,
    
    // Agronomic calculations & triggers
    isPrehydrationRecommended: weatherData?.isPrehydrationRecommended || false,
    vpd: weatherData?.current.vaporPressureDeficitKPa ?? null,
    vpdStressLevel,
    isPrehydrationEngaged,
    prehydrationLog,
    triggerPrehydrationCycle,
    cancelPrehydrationCycle,
    
    // Actions
    refresh: syncAtmosphericData,
    getSevereAlertSpeechText,
  };
}

export default useAtmosphericSync;
