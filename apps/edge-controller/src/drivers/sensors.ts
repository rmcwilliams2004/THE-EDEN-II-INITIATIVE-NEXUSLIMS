/**
 * Sensor Driver Interfaces & Ingestion Loops for Eden II Synthesis Node
 * Supports Modbus/TCP registers and simulated hardware streams.
 */

export interface PressureTransducersData {
  pt101: number; // Bar (0-600)
  pt102: number; // Bar (0-600)
  pt103: number; // Bar (0-600)
  votedMedianBar: number;
  votingResult: '2oo3_NOMINAL' | '2oo3_OVERPRESSURE_TRIP' | 'TRANSDUCER_DIVERGENCE';
}

export interface OpticalHydrogenData {
  lelPercent: number; // 0 - 100%
  ppm: number;
  status: 'HEALTHY' | 'DEGRADED' | 'FAULT';
}

export interface AmmoniaScrubberData {
  ambientPpm: number;
  scrubberFanRpm: number;
  acidLevelPercent: number;
  active: boolean;
}

export interface MassFlowData {
  biogasNm3h: number;
  beccsCo2KgH: number;
  distilledWaterLpm: number;
  anhydrousNh3Lpm: number;
}

export interface RawSensorSnapshot {
  timestamp: string;
  pressures: PressureTransducersData;
  hydrogen: OpticalHydrogenData;
  ammonia: AmmoniaScrubberData;
  massFlow: MassFlowData;
}

export class SensorDriverEngine {
  private basePressure = 595.0; // Bar
  private baseH2Lel = 1.1; // %
  private baseNh3Ppm = 3.2; // PPM

  /**
   * Reads 3 independent hydraulic intensifier pressure transducers
   * Applies SIL-3 2-out-of-3 (2oo3) voting logic.
   */
  public readPressureTransducers(): PressureTransducersData {
    const pt101 = parseFloat((this.basePressure + (Math.random() - 0.5) * 3).toFixed(2));
    const pt102 = parseFloat((this.basePressure + (Math.random() - 0.5) * 3).toFixed(2));
    const pt103 = parseFloat((this.basePressure + (Math.random() - 0.5) * 3).toFixed(2));

    const highCount = [pt101, pt102, pt103].filter(p => p > 620.0).length;
    const sorted = [pt101, pt102, pt103].sort((a, b) => a - b);
    const votedMedianBar = sorted[1];

    let votingResult: '2oo3_NOMINAL' | '2oo3_OVERPRESSURE_TRIP' | 'TRANSDUCER_DIVERGENCE' = '2oo3_NOMINAL';
    if (highCount >= 2) {
      votingResult = '2oo3_OVERPRESSURE_TRIP';
    } else if (Math.max(pt101, pt102, pt103) - Math.min(pt101, pt102, pt103) > 40) {
      votingResult = 'TRANSDUCER_DIVERGENCE';
    }

    return {
      pt101,
      pt102,
      pt103,
      votedMedianBar,
      votingResult
    };
  }

  /**
   * Reads Optical Infrared Hydrogen sensor
   */
  public readHydrogenOptics(): OpticalHydrogenData {
    const lelPercent = parseFloat(Math.max(0.1, (this.baseH2Lel + (Math.random() - 0.5) * 0.3)).toFixed(2));
    const ppm = Math.round(lelPercent * 400);

    return {
      lelPercent,
      ppm,
      status: 'HEALTHY'
    };
  }

  /**
   * Reads Internal Ammonia PPM & Scrubber
   */
  public readAmmoniaScrubber(): AmmoniaScrubberData {
    const ambientPpm = parseFloat(Math.max(0.2, (this.baseNh3Ppm + (Math.random() - 0.5) * 0.6)).toFixed(2));
    const active = ambientPpm > 15.0;
    const scrubberFanRpm = active ? 3450 : 900;

    return {
      ambientPpm,
      scrubberFanRpm,
      acidLevelPercent: 89.2,
      active
    };
  }

  /**
   * Reads Biogas & BECCS CO2 mass flow meters
   */
  public readMassFlowMeters(): MassFlowData {
    return {
      biogasNm3h: parseFloat((12.4 + (Math.random() - 0.5) * 0.5).toFixed(2)),
      beccsCo2KgH: parseFloat((34.5 + (Math.random() - 0.5) * 1.2).toFixed(2)),
      distilledWaterLpm: 19.8,
      anhydrousNh3Lpm: 0.20
    };
  }

  public getFullSnapshot(): RawSensorSnapshot {
    return {
      timestamp: new Date().toISOString(),
      pressures: this.readPressureTransducers(),
      hydrogen: this.readHydrogenOptics(),
      ammonia: this.readAmmoniaScrubber(),
      massFlow: this.readMassFlowMeters()
    };
  }

  /**
   * Asynchronous polling generator streaming industrial sensor data at specified interval (default: 1-second)
   * Streams 600-bar pressure readings, optical H2 LEL, and ppm ammonia levels.
   */
  public async *streamSensorTelemetry(
    intervalMs: number = 1000,
    maxSamples?: number
  ): AsyncGenerator<RawSensorSnapshot, void, unknown> {
    let count = 0;
    while (maxSamples === undefined || count < maxSamples) {
      count++;
      yield this.getFullSnapshot();
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }

  // Anomaly Injection Hooks
  public injectPressureSpike(bar = 638.0): void {
    this.basePressure = bar;
    setTimeout(() => { this.basePressure = 595.0; }, 5000);
  }

  public injectHydrogenLeak(lel = 14.5): void {
    this.baseH2Lel = lel;
    setTimeout(() => { this.baseH2Lel = 1.1; }, 5000);
  }
}

/**
 * Standalone asynchronous generator function that polls and streams mock industrial sensor data
 * at a 1-second interval to simulate hardware input (Modbus/TCP & ADC streaming).
 *
 * @param intervalMs Polling cadence in milliseconds (defaults to 1000ms)
 * @param driver Optional pre-instantiated SensorDriverEngine instance
 */
export async function* pollSensorsGenerator(
  intervalMs: number = 1000,
  driver: SensorDriverEngine = new SensorDriverEngine()
): AsyncGenerator<RawSensorSnapshot, void, unknown> {
  yield* driver.streamSensorTelemetry(intervalMs);
}

