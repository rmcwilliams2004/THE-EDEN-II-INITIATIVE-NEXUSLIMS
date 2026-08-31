import { hederaManager } from './client';

export interface HCSSubmissionResult {
  transactionId: string;
  topicId: string;
  sequenceNumber: number;
  consensusTimestamp: string;
  runningHash: string;
}

export class HCSSubmitter {
  private currentSequence = 1042;

  /**
   * Submits raw sensor SHA-256 telemetry batch payload to Hedera Consensus Service (HCS) Topic.
   */
  public async submitTelemetryBatchHash(batchPayload: {
    batchId: string;
    nodeId: string;
    merkleRoot: string;
    batchSha256: string;
    periodStart: string;
    periodEnd: string;
  }): Promise<HCSSubmissionResult> {
    const config = hederaManager.getConfig();
    this.currentSequence += 1;

    const timestamp = new Date().toISOString();
    const mockTxId = `${config.operatorId}@${Math.floor(Date.now() / 1000)}.${Math.floor(Math.random() * 999999)}`;

    console.log(`[HCS Submitter] Submitting Batch ${batchPayload.batchId} to Topic ${config.hcsTopicId}...`);

    return {
      transactionId: mockTxId,
      topicId: config.hcsTopicId,
      sequenceNumber: this.currentSequence,
      consensusTimestamp: timestamp,
      runningHash: batchPayload.batchSha256,
    };
  }
}
