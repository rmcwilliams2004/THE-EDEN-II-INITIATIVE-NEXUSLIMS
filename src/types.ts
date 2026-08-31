export type Role = 'COMMERCIAL_GROWER' | 'COOPERATIVE_MANAGER' | 'AGRONOMIST';

export interface User {
  id: string;
  role: Role;
  name: string;
  location: string;
  country?: string;
  avatarUrl: string;
}

export type HardwareStatus = 'ONLINE' | 'WARNING' | 'OFFLINE' | 'SYNCING';

export interface HardwareNode {
  id: string;
  name?: string;
  ownerId: string;
  country?: string;
  region?: string;
  coordinates?: [number, number]; // [longitude, latitude]
  elevationMeters?: number;
  cropFocus?: string;
  status: HardwareStatus;
  firmwareVer: string;
  uptime: number;
  agronomyProfileId?: string;
  specs?: {
    mcu: string;
    firmware: string;
    network: string;
    power: string;
    installed: string;
  };
  metrics?: {
    ph: number;
    pressure: number;
    temp: number;
    moisturePercent?: number;
  };
}

export interface SisterLink {
  id: string;
  commercialNodeId: string;
  cooperativeNodeId: string;
  establishedAt: string;
}

export interface TelemetryLog {
  id: string;
  nodeId: string;
  timestamp: string;
  phLevel: number;
  pressureBar: number;
  temperatureC: number;
  moisturePercent?: number;
}

export interface MediaPost {
  id: string;
  authorId: string;
  videoUrl?: string; // Optional if it's just a photo
  imageUrl?: string;
  thumbnailUrl: string;
  description: string;
  telemetrySnapshot: TelemetryLog;
  createdAt: string;
  likes: number;
  comments: number;
}
