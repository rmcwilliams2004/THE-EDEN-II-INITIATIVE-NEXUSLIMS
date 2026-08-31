import { SensorDriverEngine } from './drivers/sensors';
import { SIL3FailsafeEngine } from './safety/sil3Failsafe';
import { TelemetryHasherEngine, TelemetryBatchFrame } from './telemetry/hasher';

export interface EdgeDaemonConfig {
  nodeId: string;
  pollRateMs?: number;
  batchIntervalMs?: number;
  onBatchGenerated?: (batch: TelemetryBatchFrame) => void;
}

export class EdgeControllerApp {
  private sensorDriver = new SensorDriverEngine();
  private sil3Engine = new SIL3FailsafeEngine();
  private hasher: TelemetryHasherEngine;
  private pollInterval?: NodeJS.Timeout;
  private batchInterval?: NodeJS.Timeout;

  constructor(private config: EdgeDaemonConfig) {
    this.hasher = new TelemetryHasherEngine(config.nodeId);
  }

  public start(): void {
    console.log(`[EdgeController] Starting SIL-3 Daemon for Node: ${this.config.nodeId}`);

    // High frequency sensor reading loop (1000ms)
    this.pollInterval = setInterval(() => {
      const snapshot = this.sensorDriver.getFullSnapshot();
      const safety = this.sil3Engine.evaluate(snapshot);
      this.hasher.addSample(snapshot, safety);
    }, this.config.pollRateMs || 1000);

    // 5-second cryptographic batching loop
    this.batchInterval = setInterval(() => {
      const batch = this.hasher.flushBatch();
      if (batch) {
        this.config.onBatchGenerated?.(batch);
      }
    }, this.config.batchIntervalMs || 5000);
  }

  public stop(): void {
    if (this.pollInterval) clearInterval(this.pollInterval);
    if (this.batchInterval) clearInterval(this.batchInterval);
    console.log(`[EdgeController] Stopped SIL-3 Daemon for Node: ${this.config.nodeId}`);
  }

  public getDriver() {
    return this.sensorDriver;
  }

  public getSafety() {
    return this.sil3Engine;
  }
}

// Standalone execution entrypoint
if (import.meta.url.endsWith('index.ts') || process.argv[1]?.includes('edge-controller')) {
  const daemon = new EdgeControllerApp({
    nodeId: process.env.NODE_ID || 'US-CAL-01-EDEN',
    onBatchGenerated: (batch) => {
      console.log(`[dMRV Batch] ID: ${batch.batchId} | Merkle: ${batch.merkleRoot.slice(0, 12)}... | SHA-256: ${batch.batchSha256.slice(0, 16)}...`);
    }
  });
  daemon.start();
}
