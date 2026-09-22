export type UserRole = 'SUPER_ADMIN' | 'ENTERPRISE_ADMIN' | 'NGO_COORDINATOR' | 'AGRONOMIST' | 'FARMER';
export type NodeType = 'COMMERCIAL_40FT' | 'HUMANITARIAN_20FT';
export type NodeStatus = 'ONLINE' | 'OFFLINE' | 'MAINTENANCE' | 'EMERGENCY_STOP' | 'PURGING';
export type CropType = 'MAIZE' | 'COFFEE' | 'WHEAT' | 'CORN' | 'SOYBEAN' | 'POTATOES' | 'CASSAVA' | 'RICE' | 'SUGARCANE' | 'CUSTOM';
export type TokenStatus = 'PENDING' | 'MINTED' | 'RETIRED' | 'TRADED';
export type SafetyEventType = 'OVERPRESSURE' | 'H2_LEAK' | 'NH3_SCRUBBER_ENGAGED' | 'EMERGENCY_PURGE' | 'FOLIAR_LOCKOUT_TRIPPED';
export type OrgType = 'ENTERPRISE' | 'NGO' | 'COOPERATIVE';

export interface UserEntity {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  organizationId?: string;
  rfidCardId?: string;
  hederaAccountId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NodeEntity {
  id: string;
  serialNumber: string;
  modelType: NodeType;
  status: NodeStatus;
  lat: number;
  lng: number;
  country: string;
  organizationId?: string;
  sisterNodeId?: string;
  ruthenimBedCapacityKg: number;
  electrolyzerKw: number;
  firmWareVersion: string;
  lastHeartbeatAt: Date;
}

export interface DispenseEventEntity {
  id: string;
  nodeId: string;
  userId: string;
  cropTarget: CropType;
  volumeLiters: number;
  concentrationPercent: number;
  safetyLockStatus: string;
  sensorHash: string;
  dispensedAt: Date;
}

export interface DMRVRecordEntity {
  id: string;
  dispenseEventId: string;
  methaneDestroyedKg: number;
  carbonCapturedKg: number;
  dieselAvoidedKg: number;
  totalCo2eOffsetKg: number;
  hederaHcsTxId?: string;
  hederaTokenTxId?: string;
  tokenStatus: TokenStatus;
  verifiedAt?: Date;
  createdAt: Date;
}

export interface SIL3SafetyLogEntity {
  id: string;
  nodeId: string;
  eventType: SafetyEventType;
  sensorReadingsJson: any;
  resolved: boolean;
  loggedAt: Date;
  resolvedAt?: Date;
}
