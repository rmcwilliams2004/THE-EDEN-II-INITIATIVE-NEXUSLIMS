/**
 * Hedera Hashgraph Client Setup and Network Configuration
 */

export interface HederaConfig {
  operatorId: string;
  operatorKey: string;
  network: 'mainnet' | 'testnet' | 'previewnet';
  hcsTopicId: string;
  ecoCreditTokenId: string;
}

export class HederaClientManager {
  private static instance: HederaClientManager;
  private config: HederaConfig;

  private constructor() {
    this.config = {
      operatorId: process.env.HEDERA_OPERATOR_ID || '0.0.489102',
      operatorKey: process.env.HEDERA_OPERATOR_KEY || '302e020100300506032b657004220420mockedHederaPrivateKey',
      network: (process.env.HEDERA_NETWORK as any) || 'testnet',
      hcsTopicId: process.env.HCS_TOPIC_ID || '0.0.984210',
      ecoCreditTokenId: process.env.ECOCREDIT_TOKEN_ID || '0.0.771239',
    };
  }

  public static getInstance(): HederaClientManager {
    if (!HederaClientManager.instance) {
      HederaClientManager.instance = new HederaClientManager();
    }
    return HederaClientManager.instance;
  }

  public getConfig(): HederaConfig {
    return this.config;
  }

  public isMockMode(): boolean {
    return !process.env.HEDERA_OPERATOR_KEY || process.env.HEDERA_OPERATOR_KEY.includes('mocked');
  }
}

export const hederaManager = HederaClientManager.getInstance();
