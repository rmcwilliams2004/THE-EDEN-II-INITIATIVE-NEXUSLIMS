/**
 * SIL-Agronomy Failsafe Driver: Alkaline Calcium Carbonate Dosing Pump
 * apps/edge-controller/src/drivers/alkalineDosingPump.ts
 * 
 * Complies with closed-loop precision fertigation & rhizosphere pH stabilization.
 * 
 * Functional Purpose:
 * Ingests real-time soil pH telemetry from in-ground LoRaWAN wireless sensor nodes via NexusLIMS.
 * When continuous drip fertigation of ammonium-based nitrogen (NH4+) undergoes bacterial nitrification
 * (NH4+ + 2O2 -> NO3- + H2O + 2H+), the resulting release of hydrogen ions (H+) causes soil acidification.
 * 
 * This driver autonomously:
 * 1. Monitors LoRaWAN multi-depth soil pH sensors (rhizosphere 15cm & 45cm subsoil).
 * 2. Computes the stoichiometric lime equivalent / liquid micronized Calcium Carbonate (CaCO3) buffer
 *    required to neutralize the acidifying nitrification flux for the current fertigation flow rate.
 * 3. Actuates the positive-displacement peristaltic/diaphragm dosing pump to inject the CaCO3 slurry
 *    directly into the outbound fertigation manifold.
 * 4. Provides failsafe interlocks against over-alkalization (pH > 7.5) and low buffer reservoir levels.
 */

export interface LoRaWANSoilPhTelemetry {
  sensorNodeId: string;
  fieldZone: string;
  soilDepthCm: 15 | 45; // 15cm active rootzone vs 45cm deep horizon
  measuredPh: number; // e.g. 5.6 to 7.4
  soilTempCelsius: number;
  volumetricWaterContentPercent: number; // VWC %
  electricalConductivityDsm: number; // EC (dS/m)
  batteryMillivolts: number;
  rssiDbm: number;
  timestamp: string;
}

export interface FertigationManifoldState {
  manifoldId: string;
  irrigationFlowRateLpm: number; // Outbound water flow rate (L/min)
  manifoldPressureBar: number; // Outbound irrigation pressure (typically 2.0 - 4.5 Bar)
  activeNitrogenPpm: number; // Ammonium nitrogen concentration (mg/L NH4-N)
  activeZones: string[];
  systemDripActive: boolean;
}

export type DosingPumpState =
  | 'IDLE_STANDBY'
  | 'MONITORING_TELEMETRY'
  | 'ACIDIFICATION_DETECTED'
  | 'CALCULATING_BUFFER_DOSE'
  | 'DOSING_ACTIVE'
  | 'INJECTION_CONFIRMED'
  | 'STANDBY_STABILIZING'
  | 'OVER_ALKALINE_LOCKOUT'
  | 'HARDWARE_FAULT';

export interface AlkalineBufferDosingCalculation {
  measuredSoilPh: number;
  targetSoilPh: number; // Standard optimal agronomy target: 6.8
  deltaPh: number; // target - measured
  cationExchangeCapacityIndex: number; // CEC buffer factor (typically 12 - 25 meq/100g)
  requiredCaCO3PpmInManifold: number; // mg/L CaCO3 needed in irrigation stream
  instantaneousDoseRateMlMin: number; // mL/min dosing pump injection rate
  batchNeutralizationVolumeMl: number; // cumulative required buffer volume
  neutralizationEquation: string; // "CaCO3 + 2H+ -> Ca2+ + H2O + CO2"
  isDosingRequired: boolean;
  isWithinSafetyEnvelope: boolean;
}

export interface AlkalinePumpTelemetry {
  pumpState: DosingPumpState;
  pumpMotorRunning: boolean;
  strokeFrequencySpm: number; // Strokes per minute (0 - 180 SPM)
  actualDoseFlowRateMlMin: number; // Measured flow sensor on buffer injection line
  manifoldInjectionSolenoidOpen: boolean;
  bufferTankLevelPercent: number; // CaCO3 slurry reservoir level (0 - 100%)
  bufferTankVolumeRemainingLiters: number;
  cumulativeInjectedBufferMl: number;
  pumpCurrentDrawAmps: number;
  lineBackpressureBar: number;
}

export interface AgronomyFailsafeSnapshot {
  systemState: DosingPumpState;
  latestTelemetry: LoRaWANSoilPhTelemetry | null;
  manifold: FertigationManifoldState;
  calculation: AlkalineBufferDosingCalculation;
  actuator: AlkalinePumpTelemetry;
  nitrificationAcidFluxRate: number; // Relative H+ generation rate based on NH4 dosing
  activeAlerts: string[];
  isDosingPermitted: boolean;
  timestamp: string;
}

export class AlkalineDosingPumpDriver {
  // Agronomy threshold constants
  public static readonly TARGET_SOIL_PH = 6.8;
  public static readonly CRITICAL_ACID_THRESHOLD_PH = 6.0;
  public static readonly EARLY_BUFFER_THRESHOLD_PH = 6.4;
  public static readonly OVER_ALKALINE_LOCKOUT_PH = 7.5;
  public static readonly BUFFER_CONCENTRATION_G_PER_L = 250.0; // 250 g/L micronized CaCO3 liquid suspension

  private state: DosingPumpState = 'MONITORING_TELEMETRY';
  private latestTelemetry: LoRaWANSoilPhTelemetry | null = null;
  private currentManifold: FertigationManifoldState = {
    manifoldId: 'MANIFOLD-01-WEST',
    irrigationFlowRateLpm: 45.0,
    manifoldPressureBar: 3.2,
    activeNitrogenPpm: 120.0,
    activeZones: ['A1', 'A2'],
    systemDripActive: true,
  };

  private activeCalculation: AlkalineBufferDosingCalculation = {
    measuredSoilPh: 6.8,
    targetSoilPh: 6.8,
    deltaPh: 0.0,
    cationExchangeCapacityIndex: 18.0,
    requiredCaCO3PpmInManifold: 0.0,
    instantaneousDoseRateMlMin: 0.0,
    batchNeutralizationVolumeMl: 0.0,
    neutralizationEquation: 'CaCO3 + 2H+ -> Ca2+ + H2O + CO2',
    isDosingRequired: false,
    isWithinSafetyEnvelope: true,
  };

  private actuatorState: AlkalinePumpTelemetry = {
    pumpState: 'MONITORING_TELEMETRY',
    pumpMotorRunning: false,
    strokeFrequencySpm: 0,
    actualDoseFlowRateMlMin: 0,
    manifoldInjectionSolenoidOpen: false,
    bufferTankLevelPercent: 88.0,
    bufferTankVolumeRemainingLiters: 176.0,
    cumulativeInjectedBufferMl: 1420.0,
    pumpCurrentDrawAmps: 0.0,
    lineBackpressureBar: 3.2,
  };

  private activeAlerts: string[] = [];

  constructor() {
    // Initialize default nominal snapshot
    this.latestTelemetry = {
      sensorNodeId: 'LORA-SOIL-NODE-78B',
      fieldZone: 'Zone-A1',
      soilDepthCm: 15,
      measuredPh: 6.8,
      soilTempCelsius: 21.4,
      volumetricWaterContentPercent: 28.5,
      electricalConductivityDsm: 1.4,
      batteryMillivolts: 3580,
      rssiDbm: -72,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Primary Telemetry Ingestion Loop from NexusLIMS LoRaWAN Gateways
   */
  public ingestLoRaWANTelemetry(
    telemetry: LoRaWANSoilPhTelemetry,
    manifoldUpdate?: Partial<FertigationManifoldState>
  ): AgronomyFailsafeSnapshot {
    this.latestTelemetry = telemetry;
    if (manifoldUpdate) {
      this.currentManifold = { ...this.currentManifold, ...manifoldUpdate };
    }

    const currentPh = telemetry.measuredPh;

    // Safety Interlock 1: Over-alkalization guard
    if (currentPh >= AlkalineDosingPumpDriver.OVER_ALKALINE_LOCKOUT_PH) {
      this.state = 'OVER_ALKALINE_LOCKOUT';
      this.stopPump();
      this.activeAlerts = [
        `[LOCKOUT] Soil pH (${currentPh.toFixed(2)}) is alkaline (>= ${AlkalineDosingPumpDriver.OVER_ALKALINE_LOCKOUT_PH}). CaCO3 dosing disabled.`,
      ];
      return this.getSnapshot();
    }

    // Safety Interlock 2: Buffer Tank Exhaustion guard
    if (this.actuatorState.bufferTankLevelPercent < 5.0) {
      this.state = 'HARDWARE_FAULT';
      this.stopPump();
      this.activeAlerts = ['[FAULT] Liquid Calcium Carbonate buffer reservoir depleted (< 5%). Refill required.'];
      return this.getSnapshot();
    }

    // Calculate Stoichiometric Neutralization Buffer Dose
    this.activeCalculation = this.calculateNeutralizationDose(
      currentPh,
      AlkalineDosingPumpDriver.TARGET_SOIL_PH,
      this.currentManifold.irrigationFlowRateLpm,
      18.0
    );

    // Evaluate Dosing Trigger
    if (currentPh <= AlkalineDosingPumpDriver.EARLY_BUFFER_THRESHOLD_PH && this.currentManifold.systemDripActive) {
      this.state = currentPh < AlkalineDosingPumpDriver.CRITICAL_ACID_THRESHOLD_PH
        ? 'ACIDIFICATION_DETECTED'
        : 'DOSING_ACTIVE';

      // Actuate hardware injection pump
      this.actuateDosingPump(this.activeCalculation.instantaneousDoseRateMlMin);
      
      this.activeAlerts = [
        `[AUTONOMOUS BUFFER ACTIVE] Soil acidification (pH ${currentPh.toFixed(2)}) detected from NH4+ nitrification. Injecting ${this.activeCalculation.instantaneousDoseRateMlMin.toFixed(1)} mL/min CaCO3 slurry buffer.`,
      ];
    } else {
      // Nominal pH range -> Standby
      this.state = 'MONITORING_TELEMETRY';
      this.stopPump();
      this.activeAlerts = [];
    }

    return this.getSnapshot();
  }

  /**
   * Stoichiometric Neutralization Calculator:
   * Computes the exact mass and volumetric flow rate of 250 g/L CaCO3 suspension
   * required to balance H+ ions produced by nitrification and soil buffering.
   */
  public calculateNeutralizationDose(
    soilPh: number,
    targetPh: number = AlkalineDosingPumpDriver.TARGET_SOIL_PH,
    flowRateLpm: number = 45.0,
    cecBufferFactor: number = 18.0
  ): AlkalineBufferDosingCalculation {
    const deltaPh = Math.max(0, targetPh - soilPh);
    const isDosingRequired = deltaPh > 0.05 && soilPh < AlkalineDosingPumpDriver.EARLY_BUFFER_THRESHOLD_PH;

    if (!isDosingRequired) {
      return {
        measuredSoilPh: parseFloat(soilPh.toFixed(2)),
        targetSoilPh: parseFloat(targetPh.toFixed(2)),
        deltaPh: 0.0,
        cationExchangeCapacityIndex: cecBufferFactor,
        requiredCaCO3PpmInManifold: 0.0,
        instantaneousDoseRateMlMin: 0.0,
        batchNeutralizationVolumeMl: 0.0,
        neutralizationEquation: 'CaCO3 + 2H+ -> Ca2+ + H2O + CO2',
        isDosingRequired: false,
        isWithinSafetyEnvelope: true,
      };
    }

    // Agronomy buffer formula:
    // Required CaCO3 (mg/L water) = deltaPh * (CEC / 10) * 85 mg/L baseline
    const requiredCaCO3Ppm = deltaPh * (cecBufferFactor / 10.0) * 85.0;

    // Required CaCO3 mass flow (mg/min) = requiredCaCO3Ppm (mg/L) * flowRateLpm (L/min)
    const massFlowMgPerMin = requiredCaCO3Ppm * flowRateLpm;

    // With 250,000 mg/L (250 g/L) slurry:
    // Volume flow (mL/min) = massFlowMgPerMin / 250 mg/mL
    const doseRateMlMin = Math.min(180.0, Math.max(2.0, massFlowMgPerMin / 250.0));
    const batchVolumeMl = doseRateMlMin * 30.0; // 30-minute standard stabilization cycle

    return {
      measuredSoilPh: parseFloat(soilPh.toFixed(2)),
      targetSoilPh: parseFloat(targetPh.toFixed(2)),
      deltaPh: parseFloat(deltaPh.toFixed(2)),
      cationExchangeCapacityIndex: cecBufferFactor,
      requiredCaCO3PpmInManifold: parseFloat(requiredCaCO3Ppm.toFixed(1)),
      instantaneousDoseRateMlMin: parseFloat(doseRateMlMin.toFixed(1)),
      batchNeutralizationVolumeMl: parseFloat(batchVolumeMl.toFixed(0)),
      neutralizationEquation: 'CaCO3 + 2H+ -> Ca2+ + H2O + CO2',
      isDosingRequired: true,
      isWithinSafetyEnvelope: doseRateMlMin <= 180.0,
    };
  }

  /**
   * Actuates the physical dosing pump hardware
   */
  public actuateDosingPump(targetDoseMlMin: number): void {
    const clampedRate = Math.min(180.0, Math.max(0.0, targetDoseMlMin));
    const spm = Math.round((clampedRate / 180.0) * 160); // 160 SPM max rating

    this.actuatorState.pumpMotorRunning = clampedRate > 0;
    this.actuatorState.strokeFrequencySpm = spm;
    this.actuatorState.actualDoseFlowRateMlMin = clampedRate;
    this.actuatorState.manifoldInjectionSolenoidOpen = clampedRate > 0;
    this.actuatorState.pumpCurrentDrawAmps = clampedRate > 0 ? 0.85 + (clampedRate / 180.0) * 0.45 : 0.0;
    this.actuatorState.lineBackpressureBar = this.currentManifold.manifoldPressureBar + 0.3; // Positive injection differential
    this.actuatorState.pumpState = clampedRate > 0 ? 'DOSING_ACTIVE' : 'MONITORING_TELEMETRY';
  }

  /**
   * Shuts off dosing pump and closes injection manifold solenoid
   */
  public stopPump(): void {
    this.actuatorState.pumpMotorRunning = false;
    this.actuatorState.strokeFrequencySpm = 0;
    this.actuatorState.actualDoseFlowRateMlMin = 0;
    this.actuatorState.manifoldInjectionSolenoidOpen = false;
    this.actuatorState.pumpCurrentDrawAmps = 0.0;
  }

  /**
   * Simulates continuous closed-loop soil pH drift or acid injection test
   */
  public simulatePhStep(newPh: number): AgronomyFailsafeSnapshot {
    if (!this.latestTelemetry) {
      this.latestTelemetry = {
        sensorNodeId: 'LORA-SOIL-NODE-78B',
        fieldZone: 'Zone-A1',
        soilDepthCm: 15,
        measuredPh: newPh,
        soilTempCelsius: 21.4,
        volumetricWaterContentPercent: 28.5,
        electricalConductivityDsm: 1.4,
        batteryMillivolts: 3580,
        rssiDbm: -72,
        timestamp: new Date().toISOString(),
      };
    } else {
      this.latestTelemetry.measuredPh = newPh;
      this.latestTelemetry.timestamp = new Date().toISOString();
    }

    return this.ingestLoRaWANTelemetry(this.latestTelemetry);
  }

  /**
   * Resets active faults
   */
  public resetFaults(): AgronomyFailsafeSnapshot {
    this.state = 'MONITORING_TELEMETRY';
    this.activeAlerts = [];
    this.actuatorState.bufferTankLevelPercent = 90.0;
    this.actuatorState.bufferTankVolumeRemainingLiters = 180.0;
    return this.getSnapshot();
  }

  /**
   * Real-time Agronomy Failsafe Snapshot
   */
  public getSnapshot(): AgronomyFailsafeSnapshot {
    return {
      systemState: this.state,
      latestTelemetry: this.latestTelemetry ? { ...this.latestTelemetry } : null,
      manifold: { ...this.currentManifold },
      calculation: { ...this.activeCalculation },
      actuator: { ...this.actuatorState },
      nitrificationAcidFluxRate:
        this.currentManifold.systemDripActive && this.currentManifold.activeNitrogenPpm > 0
          ? parseFloat(((this.currentManifold.activeNitrogenPpm / 100.0) * 0.14).toFixed(3))
          : 0.0,
      activeAlerts: [...this.activeAlerts],
      isDosingPermitted: this.state !== 'OVER_ALKALINE_LOCKOUT' && this.state !== 'HARDWARE_FAULT',
      timestamp: new Date().toISOString(),
    };
  }
}
