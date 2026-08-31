import { HCSSubmitter } from './hedera/hcsSubmitter';
import { HTSMinter } from './hedera/htsMinter';
import { RevenueSplitSettlementEngine } from './settlement/revenueSplit';

export class EcoCreditXServiceApp {
  private hcs = new HCSSubmitter();
  private hts = new HTSMinter();
  private settlement = new RevenueSplitSettlementEngine();

  public async processDMRVAndSettle(batch: {
    batchId: string;
    nodeId: string;
    merkleRoot: string;
    batchSha256: string;
    periodStart: string;
    periodEnd: string;
    methaneDestroyedKg: number;
    beccsCarbonCapturedKg: number;
    dieselAvoidedKg: number;
    enterpriseAccount?: string;
    cooperativeAccount?: string;
  }) {
    console.log(`\n========================================`);
    console.log(`[EcoCreditX] Processing dMRV Batch ${batch.batchId}...`);

    // 1. Submit Batch to HCS Consensus Topic
    const hcsResult = await this.hcs.submitTelemetryBatchHash({
      batchId: batch.batchId,
      nodeId: batch.nodeId,
      merkleRoot: batch.merkleRoot,
      batchSha256: batch.batchSha256,
      periodStart: batch.periodStart,
      periodEnd: batch.periodEnd,
    });

    // 2. Mint Verified Micro-Carbon Credits via HTS
    const mintResult = await this.hts.mintEcoCredits({
      methaneDestroyedKg: batch.methaneDestroyedKg,
      beccsCarbonCapturedKg: batch.beccsCarbonCapturedKg,
      dieselAvoidedKg: batch.dieselAvoidedKg,
    });

    // 3. Execute 50/30/20 Smart Split Settlement
    const splitResult = this.settlement.calculateAndSettle(
      mintResult.tokensMinted,
      batch.enterpriseAccount,
      batch.cooperativeAccount
    );

    console.log(`[EcoCreditX] Completed Pipeline. HCS Tx: ${hcsResult.transactionId} | HTS Tx: ${mintResult.htsTransactionId}`);
    console.log(`========================================\n`);

    return {
      hcsResult,
      mintResult,
      splitResult,
    };
  }
}

// Standalone execution entrypoint
if (import.meta.url.endsWith('index.ts') || process.argv[1]?.includes('ecocreditx-service')) {
  const service = new EcoCreditXServiceApp();
  service.processDMRVAndSettle({
    batchId: 'BATCH-US-CAL-01-INITIAL',
    nodeId: 'US-CAL-01-EDEN',
    merkleRoot: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    batchSha256: 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0',
    periodStart: new Date(Date.now() - 5000).toISOString(),
    periodEnd: new Date().toISOString(),
    methaneDestroyedKg: 3.5,
    beccsCarbonCapturedKg: 12.0,
    dieselAvoidedKg: 8.5,
  });
}
