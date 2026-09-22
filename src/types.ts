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
  cropType?: string;
  isBookmarked?: boolean;
}

export interface PostComment {
  id: string;
  postId: string;
  authorName: string;
  authorRole: string;
  authorAvatar: string;
  authorLocation?: string;
  content: string;
  createdAt: string;
  likes: number;
}

export interface ForumReply {
  id: string;
  threadId: string;
  authorName: string;
  authorRole: string;
  authorAvatar: string;
  authorLocation?: string;
  content: string;
  createdAt: string;
  upvotes: number;
  isVerifiedSolution?: boolean;
}

export interface ForumThread {
  id: string;
  title: string;
  category: 'AGRONOMY' | 'ELECTROLYZER' | 'FOLIAR_DOSING' | 'ECOCREDITX' | 'KIOSK_HARDWARE' | 'GENERAL';
  authorName: string;
  authorRole: string;
  authorAvatar: string;
  nodeLocation: string;
  nodeId?: string;
  content: string;
  tags: string[];
  createdAt: string;
  upvotes: number;
  repliesCount: number;
  isResolved?: boolean;
  replies?: ForumReply[];
}

export interface ArchivedTelemetryPacket {
  id: string;
  nodeId: string;
  nodeName: string;
  country: string;
  cropType: string;
  timestamp: string;
  phLevel: number;
  pressureBar: number;
  temperatureC: number;
  moisturePercent: number;
  ammoniaYieldKg: number;
  hederaTxHash: string;
  ipfsCid: string;
  status: 'VERIFIED' | 'FLAGGED' | 'CALIBRATING';
}
