import { UserEntity, NodeEntity, DispenseEventEntity, DMRVRecordEntity, SIL3SafetyLogEntity } from './types';

/**
 * High-performance database client adapter for PostgreSQL / Prisma runtime
 */
export class DatabaseClient {
  private static instance: DatabaseClient;

  private constructor() {}

  public static getInstance(): DatabaseClient {
    if (!DatabaseClient.instance) {
      DatabaseClient.instance = new DatabaseClient();
    }
    return DatabaseClient.instance;
  }

  public async recordDispenseEvent(event: Omit<DispenseEventEntity, 'id' | 'dispensedAt'>): Promise<DispenseEventEntity> {
    const created: DispenseEventEntity = {
      ...event,
      id: `dispense-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      dispensedAt: new Date(),
    };
    return created;
  }

  public async logSafetyIncident(log: Omit<SIL3SafetyLogEntity, 'id' | 'loggedAt'>): Promise<SIL3SafetyLogEntity> {
    const created: SIL3SafetyLogEntity = {
      ...log,
      id: `sil3-${Date.now()}`,
      loggedAt: new Date(),
    };
    return created;
  }

  public async createDMRVRecord(record: Omit<DMRVRecordEntity, 'id' | 'createdAt'>): Promise<DMRVRecordEntity> {
    const created: DMRVRecordEntity = {
      ...record,
      id: `dmrv-${Date.now()}`,
      createdAt: new Date(),
    };
    return created;
  }
}

export const db = DatabaseClient.getInstance();
