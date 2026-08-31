import { RawSensorSnapshot } from '../drivers/sensors';

export interface ActuatorInterlockState {
  nitrogenPurgeValveOpen: boolean;  // Failsafe Open Valve (N2 inert gas blanket)
  electricalBusIsolated: boolean;   // High-voltage synthesis inverter isolation
  hermeticLouverSealed: boolean;    // Motorized hermetic fire/gas enclosure louvers
  wetScrubberFanBoost: boolean;     // Emergency neutralizing scrubber boost
  primaryDispenseValveUnlocked: boolean; // 1% N foliar fertilizer dispenser
}

export interface FailsafeEvaluationResult {
  safetyState: 'SIL3_NOMINAL' | 'ELEVATED_RISK' | 'EMERGENCY_SHUTDOWN';
  actuators: ActuatorInterlockState;
  activeTrips: string[];
  foliarLockoutReason?: string;
  isFoliarSafe: boolean;
}

export class SIL3FailsafeEngine {
  private actuators: ActuatorInterlockState = {
    nitrogenPurgeValveOpen: false,
    electricalBusIsolated: false,
    hermeticLouverSealed: false,
    wetScrubberFanBoost: false,
    primaryDispenseValveUnlocked: false,
  };

  /**
   * Evaluates incoming raw sensor telemetry against SIL-3 physical safety rules.
   */
  public evaluate(snapshot: RawSensorSnapshot): FailsafeEvaluationResult {
    const activeTrips: string[] = [];

    // Rule 1: 2-out-of-3 pressure sensors breach 620 Bar -> Trigger N2 Inert Gas Purge (Valve fails open)
    if (snapshot.pressures.votingResult === '2oo3_OVERPRESSURE_TRIP') {
      activeTrips.push(`[SIL-3 TRIP] 2oo3 Pressure Exceeded 620 Bar (PT-101: ${snapshot.pressures.pt101}B, PT-102: ${snapshot.pressures.pt102}B, PT-103: ${snapshot.pressures.pt103}B). Failsafe N2 Purge OPEN.`);
      this.actuators.nitrogenPurgeValveOpen = true;
    }

    // Rule 2: H2 exceeds 10% LEL -> Isolate electrical bus & trigger hermetic louver seal
    if (snapshot.hydrogen.lelPercent >= 10.0) {
      activeTrips.push(`[SIL-3 TRIP] Optical H2 sensor breached 10.0% LEL (Current: ${snapshot.hydrogen.lelPercent}% LEL). Electrical bus isolated & hermetic louvers sealed.`);
      this.actuators.electricalBusIsolated = true;
      this.actuators.hermeticLouverSealed = true;
    }

    // Secondary Containment: Ammonia > 25 PPM -> Boost wet scrubber
    if (snapshot.ammonia.ambientPpm >= 25.0) {
      activeTrips.push(`[CONTAINMENT] High NH3 concentration (${snapshot.ammonia.ambientPpm} PPM). Emergency acid scrubber boost engaged.`);
      this.actuators.wetScrubberFanBoost = true;
    }

    // Rule 3: Enforce aqueous ammonia foliar line dilution lockout at exactly 1.0% N before opening the output valve
    const nh3 = snapshot.massFlow.anhydrousNh3Lpm;
    const water = snapshot.massFlow.distilledWaterLpm;
    const calculatedNConcentration = (nh3 / (water + nh3)) * 100;
    const isExactOnePercent = Math.abs(calculatedNConcentration - 1.0) <= 0.05;

    let foliarLockoutReason: string | undefined;
    let isFoliarSafe = false;

    if (!isExactOnePercent) {
      foliarLockoutReason = `Aqueous N concentration (${calculatedNConcentration.toFixed(2)}%) is not within calibrated 1.0% N target. Hardware lockout active.`;
      this.actuators.primaryDispenseValveUnlocked = false;
    } else if (activeTrips.length > 0) {
      foliarLockoutReason = `Failsafe condition active. Dispense prohibited.`;
      this.actuators.primaryDispenseValveUnlocked = false;
    } else {
      isFoliarSafe = true;
      this.actuators.primaryDispenseValveUnlocked = true;
    }

    let safetyState: 'SIL3_NOMINAL' | 'ELEVATED_RISK' | 'EMERGENCY_SHUTDOWN' = 'SIL3_NOMINAL';
    if (activeTrips.some(t => t.includes('SIL-3 TRIP'))) {
      safetyState = 'EMERGENCY_SHUTDOWN';
    } else if (activeTrips.length > 0 || snapshot.pressures.votingResult === 'TRANSDUCER_DIVERGENCE') {
      safetyState = 'ELEVATED_RISK';
    }

    return {
      safetyState,
      actuators: { ...this.actuators },
      activeTrips,
      foliarLockoutReason,
      isFoliarSafe,
    };
  }

  public resetInterlocks(): void {
    this.actuators = {
      nitrogenPurgeValveOpen: false,
      electricalBusIsolated: false,
      hermeticLouverSealed: false,
      wetScrubberFanBoost: false,
      primaryDispenseValveUnlocked: false,
    };
  }
}
