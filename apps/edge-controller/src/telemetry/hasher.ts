import crypto from 'crypto';
import { RawSensorSnapshot } from '../drivers/sensors';
import { FailsafeEvaluationResult } from '../safety/sil3Failsafe';

export interface TelemetryBatchFrame {
  batchId: string;
  nodeId: string;
  periodStart: string;
  periodEnd: string;
  sampleCount: number;
  merkleRoot: string;
  batchSha256: string;
  samples: {
    snapshot: RawSensorSnapshot;
    safety: FailsafeEvaluationResult;
    sampleHash: string;
  }[];
}

export class TelemetryHasherEngine {
  private buffer: {
    snapshot: RawSensorSnapshot;
    safety: FailsafeEvaluationResult;
    sampleHash: string;
  }[] = [];

  constructor(private nodeId: string) {}

  public addSample(snapshot: RawSensorSnapshot, safety: FailsafeEvaluationResult): void {
    const rawString = JSON.stringify({ snapshot, safety });
    const sampleHash = crypto.createHash('sha256').update(rawString).digest('hex');
    this.buffer.push({ snapshot, safety, sampleHash });
  }

  public flushBatch(): TelemetryBatchFrame | null {
    if (this.buffer.length === 0) return null;

    const samples = [...this.buffer];
    this.buffer = [];

    const periodStart = samples[0].snapshot.timestamp;
    const periodEnd = samples[samples.length - 1].snapshot.timestamp;
    const batchId = `BATCH-${this.nodeId}-${Date.now()}`;

    const hashes = samples.map(s => s.sampleHash);
    const merkleRoot = this.computeMerkleRoot(hashes);

    const batchSummary = JSON.stringify({
      batchId,
      nodeId: this.nodeId,
      periodStart,
      periodEnd,
      sampleCount: samples.length,
      merkleRoot,
    });
    const batchSha256 = crypto.createHash('sha256').update(batchSummary).digest('hex');

    return {
      batchId,
      nodeId: this.nodeId,
      periodStart,
      periodEnd,
      sampleCount: samples.length,
      merkleRoot,
      batchSha256,
      samples,
    };
  }

  private computeMerkleRoot(hashes: string[]): string {
    if (hashes.length === 0) return crypto.createHash('sha256').update('').digest('hex');
    let currentLevel = [...hashes];

    while (currentLevel.length > 1) {
      const nextLevel: string[] = [];
      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left;
        const combined = crypto.createHash('sha256').update(left + right).digest('hex');
        nextLevel.push(combined);
      }
      currentLevel = nextLevel;
    }
    return currentLevel[0];
  }
}
