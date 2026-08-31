export type Role = 'COMMERCIAL_GROWER' | 'COOPERATIVE_MANAGER' | 'AGRONOMIST';

export interface User {
  id: string;
  role: Role;
  name: string;
  location: string;
  avatarUrl: string;
}

export interface HardwareNode {
  id: string;
  ownerId: string;
  status: 'ONLINE' | 'OFFLINE' | 'SYNCING';
  firmwareVer: string;
  uptime: number;
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
