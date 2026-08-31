import { MediaPost, User, HardwareNode } from './types';

export const currentUser: User = {
  id: 'u_001',
  role: 'COMMERCIAL_GROWER',
  name: 'Central Valley Farms',
  location: 'California, USA',
  avatarUrl: 'https://images.unsplash.com/photo-1595841696677-6489ff3f8cd1?auto=format&fit=crop&q=80&w=150&h=150',
};

export const currentHardware: HardwareNode = {
  id: 'hw_001',
  ownerId: 'u_001',
  status: 'ONLINE',
  firmwareVer: 'v2.4.1-edge',
  uptime: 99.98,
};

export const sisterNodeUser: User = {
  id: 'u_002',
  role: 'COOPERATIVE_MANAGER',
  name: 'Mwea Cooperative',
  location: 'Kirinyaga, Kenya',
  avatarUrl: 'https://images.unsplash.com/photo-1534073828943-f801091bb18c?auto=format&fit=crop&q=80&w=150&h=150',
};

export const MOCK_FEED: MediaPost[] = [
  {
    id: 'post_1',
    authorId: 'u_002',
    imageUrl: 'https://images.unsplash.com/photo-1592982537447-6f296d9b15d2?auto=format&fit=crop&q=80&w=1200',
    thumbnailUrl: 'https://images.unsplash.com/photo-1592982537447-6f296d9b15d2?auto=format&fit=crop&q=80&w=600',
    description: 'Morning harvest update! The new Eden II container has stabilized our soil pH perfectly. Biogas pressure looks solid.',
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 mins ago
    likes: 124,
    comments: 18,
    telemetrySnapshot: {
      id: 'tel_1',
      nodeId: 'hw_002',
      timestamp: new Date().toISOString(),
      phLevel: 6.8,
      pressureBar: 580.4,
      temperatureC: 38.5,
      moisturePercent: 42,
    },
  },
  {
    id: 'post_2',
    authorId: 'u_001',
    imageUrl: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&q=80&w=1200',
    thumbnailUrl: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&q=80&w=600',
    description: 'Automated tractor dispatch synced with our telemetry overlay. Prepping for winter sowing. #PrecisionAg',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
    likes: 342,
    comments: 45,
    telemetrySnapshot: {
      id: 'tel_2',
      nodeId: 'hw_001',
      timestamp: new Date().toISOString(),
      phLevel: 7.1,
      pressureBar: 610.2,
      temperatureC: 18.2,
      moisturePercent: 31,
    },
  }
];

export const MOCK_USERS = {
  'u_001': currentUser,
  'u_002': sisterNodeUser,
};
