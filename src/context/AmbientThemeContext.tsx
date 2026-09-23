import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useLanguage } from './LanguageContext';

export type AmbientThemeMode = 'AUTO_SOLAR' | 'SUNLIGHT' | 'NIGHT';
export type ActiveVisualTheme = 'sunlight' | 'night';

export interface SolarTelemetry {
  sunrise: string;
  sunset: string;
  solarNoon: string;
  solarElevationDeg: number;
  zenithAngleDeg: number;
  daylightProgressPercent: number;
  isDaytime: boolean;
  isGoldenHour: boolean;
  nextTransitionTime: string;
  localTimeFormatted: string;
}

export interface AmbientThemeContextType {
  mode: AmbientThemeMode;
  visualTheme: ActiveVisualTheme;
  isDaytime: boolean;
  solarData: SolarTelemetry;
  setMode: (mode: AmbientThemeMode) => void;
  toggleThemeOverride: () => void;
}

const AmbientThemeContext = createContext<AmbientThemeContextType | undefined>(undefined);

/**
 * Calculates solar position and astronomical sunrise/sunset for a given latitude, longitude, and date.
 * Based on standard NOAA solar equations.
 */
function calculateSolarTelemetry(lat: number, lon: number, date: Date = new Date()): SolarTelemetry {
  const rad = Math.PI / 180;
  const deg = 180 / Math.PI;

  // Day of the year
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const diff = (date.getTime() - startOfYear.getTime()) + ((startOfYear.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000);
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

  // Fractional year in radians
  const gamma = (2 * Math.PI / 365) * (dayOfYear - 1 + (date.getUTCHours() - 12) / 24);

  // Equation of time in minutes
  const eqtime = 229.18 * (
    0.000075 +
    0.001868 * Math.cos(gamma) -
    0.032077 * Math.sin(gamma) -
    0.014615 * Math.cos(2 * gamma) -
    0.040849 * Math.sin(2 * gamma)
  );

  // Solar declination angle in radians
  const decl = 0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma);

  // Time offset in minutes
  const timezoneOffsetMin = -date.getTimezoneOffset();
  const timeOffset = eqtime + 4 * lon - 60 * (timezoneOffsetMin / 60);

  // True solar time in minutes
  const currentMinutesFromMidnight = date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;
  const tst = currentMinutesFromMidnight + timeOffset;

  // Solar hour angle in degrees
  let ha = (tst / 4) - 180;
  if (ha < -180) ha += 360;
  if (ha > 180) ha -= 360;

  // Solar zenith angle (degrees)
  const phi = lat * rad;
  const cosZenith = Math.sin(phi) * Math.sin(decl) + Math.cos(phi) * Math.cos(decl) * Math.cos(ha * rad);
  const zenithDeg = Math.acos(Math.max(-1, Math.min(1, cosZenith))) * deg;
  const elevationDeg = 90 - zenithDeg;

  // Calculate Sunrise and Sunset hour angle (zenith = 90.833° for atmospheric refraction)
  const zenithRefract = 90.833 * rad;
  const cosHaSunrise = (Math.cos(zenithRefract) - (Math.sin(phi) * Math.sin(decl))) / (Math.cos(phi) * Math.cos(decl));

  let sunriseMin = 6 * 60; // fallback 6:00 AM
  let sunsetMin = 18 * 60; // fallback 6:00 PM
  let isPolarDay = false;
  let isPolarNight = false;

  if (cosHaSunrise > 1) {
    // Sun never rises (polar night)
    isPolarNight = true;
  } else if (cosHaSunrise < -1) {
    // Sun never sets (midnight sun)
    isPolarDay = true;
  } else {
    const haSunriseDeg = Math.acos(cosHaSunrise) * deg;
    const solarNoonMin = 720 - 4 * lon - eqtime + timezoneOffsetMin;
    sunriseMin = solarNoonMin - haSunriseDeg * 4;
    sunsetMin = solarNoonMin + haSunriseDeg * 4;
  }

  const formatMinutes = (totalMin: number): string => {
    let normalized = (totalMin % 1440 + 1440) % 1440;
    const h = Math.floor(normalized / 60);
    const m = Math.floor(normalized % 60);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(h)}:${pad(m)}`;
  };

  const isDaytime = isPolarDay || (!isPolarNight && currentMinutesFromMidnight >= sunriseMin && currentMinutesFromMidnight <= sunsetMin);
  const isGoldenHour = elevationDeg > 0 && elevationDeg <= 10;

  // Daylight progress percentage (0% at sunrise -> 100% at sunset)
  let daylightProgressPercent = 0;
  if (isDaytime && sunsetMin > sunriseMin) {
    const elapsed = currentMinutesFromMidnight - sunriseMin;
    const duration = sunsetMin - sunriseMin;
    daylightProgressPercent = Math.min(100, Math.max(0, Math.round((elapsed / duration) * 100)));
  }

  const nextTransitionTime = isDaytime ? formatMinutes(sunsetMin) : formatMinutes(sunriseMin);

  return {
    sunrise: isPolarNight ? 'N/A (Polar Night)' : formatMinutes(sunriseMin),
    sunset: isPolarDay ? 'N/A (Midnight Sun)' : formatMinutes(sunsetMin),
    solarNoon: formatMinutes(720 - 4 * lon - eqtime + timezoneOffsetMin),
    solarElevationDeg: parseFloat(elevationDeg.toFixed(1)),
    zenithAngleDeg: parseFloat(zenithDeg.toFixed(1)),
    daylightProgressPercent,
    isDaytime,
    isGoldenHour,
    nextTransitionTime,
    localTimeFormatted: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  };
}

export const AmbientThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { gpsCoords } = useLanguage();
  const [mode, setMode] = useState<AmbientThemeMode>('AUTO_SOLAR');
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Update solar calculations every 15 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const lat = gpsCoords?.latitude ?? 37.7749; // Default San Francisco / US
  const lon = gpsCoords?.longitude ?? -122.4194;

  const solarData = useMemo(() => {
    return calculateSolarTelemetry(lat, lon, currentTime);
  }, [lat, lon, currentTime]);

  // Determine active visual theme
  const visualTheme: ActiveVisualTheme = useMemo(() => {
    if (mode === 'SUNLIGHT') return 'sunlight';
    if (mode === 'NIGHT') return 'night';
    return solarData.isDaytime ? 'sunlight' : 'night';
  }, [mode, solarData.isDaytime]);

  // Keep HTML root dark for the overall dashboard while providing visualTheme in context
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('dark');
    root.classList.remove('light');
  }, []);

  const toggleThemeOverride = useCallback(() => {
    setMode(prev => {
      if (prev === 'AUTO_SOLAR') return visualTheme === 'sunlight' ? 'NIGHT' : 'SUNLIGHT';
      if (prev === 'SUNLIGHT') return 'NIGHT';
      return 'AUTO_SOLAR';
    });
  }, [visualTheme]);

  return (
    <AmbientThemeContext.Provider
      value={{
        mode,
        visualTheme,
        isDaytime: solarData.isDaytime,
        solarData,
        setMode,
        toggleThemeOverride,
      }}
    >
      <div className={visualTheme === 'sunlight' ? 'sunlight-theme' : 'night-theme'}>
        {children}
      </div>
    </AmbientThemeContext.Provider>
  );
};

export const useAmbientTheme = (): AmbientThemeContextType => {
  const context = useContext(AmbientThemeContext);
  if (!context) {
    throw new Error('useAmbientTheme must be used within an AmbientThemeProvider');
  }
  return context;
};
