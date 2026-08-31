import crypto from 'crypto';

/**
 * SHA-256 and Merkle Tree Cryptographic Utilities for EcoCreditX dMRV
 */

export function sha256(data: string | Buffer | object): string {
  const payload = typeof data === 'string' ? data : Buffer.isBuffer(data) ? data : JSON.stringify(data);
  return crypto.createHash('sha256').update(payload).digest('hex');
}

export function computeMerkleRoot(hashes: string[]): string {
  if (hashes.length === 0) {
    return sha256('');
  }
  let currentLevel = [...hashes];

  while (currentLevel.length > 1) {
    const nextLevel: string[] = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left;
      const combined = sha256(left + right);
      nextLevel.push(combined);
    }
    currentLevel = nextLevel;
  }

  return currentLevel[0];
}

export function verifyMerkleProof(leafHash: string, proof: { hash: string; direction: 'left' | 'right' }[], expectedRoot: string): boolean {
  let computed = leafHash;
  for (const step of proof) {
    if (step.direction === 'left') {
      computed = sha256(step.hash + computed);
    } else {
      computed = sha256(computed + step.hash);
    }
  }
  return computed === expectedRoot;
}

export function generateTelemetryBatchHash(batchId: string, nodeId: string, merkleRoot: string, timestamp: string): string {
  return sha256({
    batchId,
    nodeId,
    merkleRoot,
    timestamp,
    standard: 'EDEN-II-SIL3-dMRV-v1',
  });
}
