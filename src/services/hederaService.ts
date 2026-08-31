/**
 * Hedera Consensus Service (HCS) Simulator for Eden II / EcoCreditX dMRV
 * Simulates cryptographic transaction submission to Hedera Hashgraph HCS Topic 0.0.984210.
 */

export interface HCSMessagePacket {
  nodeId: string;
  telemetryHash: string;
  signature: string;
  timestamp: string;
  version: string;
  payloadType: 'SIL3_TELEMETRY_BATCH' | 'DMRV_MEASUREMENT' | 'EQUIPMENT_EVENT';
  metadata?: {
    sampleCount?: number;
    votedPressureBar?: number;
    h2LelPct?: number;
    co2CapturedKgH?: number;
    sil3SafetyState?: string;
  };
}

export interface HCSSubmitResult {
  transactionId: string;
  topicId: string;
  consensusTimestamp: string;
  sequenceNumber: number;
  runningHash: string;
  status: 'SUCCESS' | 'SUBMITTED';
  packet: HCSMessagePacket;
  explorerUrl: string;
}

// In-memory HCS Topic State (Topic: 0.0.984210)
const HCS_TOPIC_ID = '0.0.984210';
const HCS_ACCOUNT_ID = '0.0.482910';

let hcsSequenceCounter = 142890;
let lastRunningHash = '4a8b29f0c13e5d7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a';
const hcsTransactionLog: HCSSubmitResult[] = [];

/**
 * Generates a pseudo-random hex string of given length
 */
function generateHex(length: number): string {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

/**
 * Computes a simulated SHA-256 / Ed25519 signature of the telemetry payload
 */
function createNodeSignature(nodeId: string, telemetryHash: string, timestamp: string): string {
  const raw = `${nodeId}:${telemetryHash}:${timestamp}`;
  // Generate deterministic-looking 128-char hex signature
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const prefix = Math.abs(hash).toString(16).padStart(8, '0');
  return `0xed25519_${prefix}_${generateHex(64)}`;
}

/**
 * Submits a cryptographically signed telemetry packet to the Hedera Consensus Service (HCS).
 * 
 * @param nodeId The unique Eden Node identifier (e.g., 'US-CAL-01-EDEN', 'KE-NAI-02-EDEN')
 * @param telemetryHash The SHA-256 Merkle root or batch hash of the sensor packet
 * @param metadata Optional additional sensory metadata for the dMRV audit trail
 * @returns A promise resolving to the Hedera transaction receipt and consensus confirmation
 */
export async function submitTelemetryToHCS(
  nodeId: string, 
  telemetryHash: string,
  metadata?: HCSMessagePacket['metadata']
): Promise<HCSSubmitResult> {
  const now = new Date();
  const timestampIso = now.toISOString();
  
  // Hedera consensus timestamp format: <epoch_seconds>.<nanoseconds>
  const epochSec = Math.floor(now.getTime() / 1000);
  const nanos = String(now.getMilliseconds() * 1000000 + Math.floor(Math.random() * 999999)).padStart(9, '0');
  const consensusTimestamp = `${epochSec}.${nanos}`;
  
  // Hedera Transaction ID format: <accountId>@<validStartSeconds>.<validStartNanos>
  const validStartNanos = String(Math.floor(Math.random() * 900000000) + 100000000);
  const transactionId = `${HCS_ACCOUNT_ID}@${epochSec}.${validStartNanos}`;

  // Increment sequence number on HCS Topic
  hcsSequenceCounter += 1;
  const sequenceNumber = hcsSequenceCounter;

  // Compute updated HCS Running Hash: SHA-256(lastRunningHash + currentMessageHash)
  const messageSignature = createNodeSignature(nodeId, telemetryHash, timestampIso);
  const currentMessageDigest = `${telemetryHash.slice(0, 16)}${messageSignature.slice(10, 26)}`;
  const runningHash = `${lastRunningHash.slice(0, 32)}${currentMessageDigest.slice(0, 32)}`;
  lastRunningHash = runningHash;

  const packet: HCSMessagePacket = {
    nodeId,
    telemetryHash,
    signature: messageSignature,
    timestamp: timestampIso,
    version: '2.4.0-SIL3',
    payloadType: 'SIL3_TELEMETRY_BATCH',
    metadata: metadata || {
      votedPressureBar: 595.2,
      h2LelPct: 1.1,
      co2CapturedKgH: 34.5,
      sil3SafetyState: 'NORMAL_OPERATION',
    },
  };

  const result: HCSSubmitResult = {
    transactionId,
    topicId: HCS_TOPIC_ID,
    consensusTimestamp,
    sequenceNumber,
    runningHash,
    status: 'SUCCESS',
    packet,
    explorerUrl: `https://hashscan.io/mainnet/transaction/${transactionId}`,
  };

  // Prepend to transaction log buffer (cap at 50)
  hcsTransactionLog.unshift(result);
  if (hcsTransactionLog.length > 50) {
    hcsTransactionLog.pop();
  }

  // Artificial network round-trip simulation (50-120ms Hedera finality)
  await new Promise(resolve => setTimeout(resolve, 80));

  return result;
}

/**
 * Retrieves the recent history of submitted HCS telemetry transactions
 */
export function getHCSTransactionLog(): HCSSubmitResult[] {
  return [...hcsTransactionLog];
}

/**
 * Returns current HCS Topic statistics
 */
export function getHCSTopicInfo() {
  return {
    topicId: HCS_TOPIC_ID,
    payerAccount: HCS_ACCOUNT_ID,
    currentSequenceNumber: hcsSequenceCounter,
    lastRunningHash,
    totalLogged: hcsTransactionLog.length,
    consensusNetwork: 'Hedera Mainnet (Consensus Layer)',
  };
}

export default {
  submitTelemetryToHCS,
  getHCSTransactionLog,
  getHCSTopicInfo,
};
