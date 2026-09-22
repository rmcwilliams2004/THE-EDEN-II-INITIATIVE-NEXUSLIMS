/**
 * Shared Types for the EDEN II INITIATIVE / NEXUSLIMS Platform
 */

export type UserRole = 'SUPER_ADMIN' | 'ENTERPRISE_ADMIN' | 'NGO_COORDINATOR' | 'AGRONOMIST' | 'FARMER';
export type NodeType = 'COMMERCIAL_40FT' | 'HUMANITARIAN_20FT';
export type NodeStatus = 'ONLINE' | 'OFFLINE' | 'MAINTENANCE' | 'EMERGENCY_STOP' | 'PURGING';
export type CropType = 'MAIZE' | 'COFFEE' | 'WHEAT' | 'CORN' | 'SOYBEAN' | 'POTATOES' | 'CASSAVA' | 'RICE' | 'SUGARCANE' | 'CUSTOM';
export type TokenStatus = 'PENDING' | 'MINTED' | 'RETIRED' | 'TRADED';

export interface PressureSensorReadings {
  pt101: number; // Bar (0-600)
  pt102: number; // Bar (0-600)
  pt103: number; // Bar (0-600)
  votedMedianBar: number;
  votingResult: '2oo3_NOMINAL' | '2oo3_OVERPRESSURE_TRIP' | 'TRANSDUCER_DIVERGENCE';
}

export interface HydrogenSensorReading {
  lelPercent: number; // 0 - 100% Lower Explosive Limit
  h2Ppm: number;
  opticalIrStatus: 'HEALTHY' | 'DEGRADED' | 'FAULT';
}

export interface AmmoniaScrubberReading {
  ambientPpm: number;
  fanSpeedRpm: number;
  scrubberEngaged: boolean;
  neutralizerReservePct: number;
}

export interface MassFlowReadings {
  biogasInflowNm3h: number;
  beccsCo2CapturedKgH: number;
  distilledWaterLpm: number;
  anhydrousNh3Lpm: number;
}

export interface FoliarLockoutStatus {
  aqueousNitrogenPercent: number; // Target 1.00%
  dilutionRatio: number;
  solenoidHardLocked: boolean;
  lockReason?: string;
}

export interface SIL3Actuators {
  nitrogenPurgeValveOpen: boolean;
  electricalBusIsolated: boolean;
  hermeticLouverSealed: boolean;
  wetScrubberFanBoost: boolean;
  dispenseSolenoidUnlocked: boolean;
}

export interface RawEdgeTelemetryPayload {
  nodeId: string;
  sequenceId: number;
  timestamp: string;
  pressures: PressureSensorReadings;
  hydrogen: HydrogenSensorReading;
  ammonia: AmmoniaScrubberReading;
  massFlow: MassFlowReadings;
  foliarLockout: FoliarLockoutStatus;
  actuators: SIL3Actuators;
  safetyState: 'SIL3_NOMINAL' | 'ELEVATED_RISK' | 'EMERGENCY_SHUTDOWN';
  activeTrips: string[];
}

export interface TelemetryBatchHashPacket {
  batchId: string;
  nodeId: string;
  periodStartIso: string;
  periodEndIso: string;
  sampleCount: number;
  merkleRoot: string;
  batchSha256: string;
  hcsTransactionId?: string;
  htsTokensMinted?: number;
}

export interface KioskCommandPayload {
  ui_icon: 'maize' | 'coffee' | 'wheat' | 'corn' | 'soybean' | 'water_drop' | 'gallon_jug';
  ui_fill_level: number; // e.g. 15, 20 Liters
  valve_status: 'locked' | 'ready' | 'dispensing' | 'complete' | 'emergency_stop';
  speaker_lang?: string;
  farmer_name?: string;
  eco_credits_earned?: number;
}

export interface OnboardingFinancials {
  equipmentCost: number;
  section179Deduction: number; // Up to $2.56M
  usdaReapGrantPercent: number; // 50%
  usdaReapGrantAmount: number;
  effectiveNetCost: number;
  annualCarbonDividendEstimate: number;
  paybackPeriodYears: number;
}

export interface SisterLinkPair {
  commercialNodeId: string;
  commercialOrgName: string;
  humanitarianNodeId: string;
  sisterCooperativeName: string;
  location: string;
  activeDispensers: number;
  totalLitersFoliarShared: number;
  carbonCreditsShared: number;
}
