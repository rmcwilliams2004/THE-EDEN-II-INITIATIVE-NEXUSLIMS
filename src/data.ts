import { MediaPost, User, HardwareNode } from './types';
import { MOCK_GLOBAL_USERS } from './data/mockNodes';

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

export const userIndia: User = {
  id: 'u_003',
  role: 'COOPERATIVE_MANAGER',
  name: 'Punjab AgriTech Coop',
  location: 'Punjab, India',
  avatarUrl: 'https://images.unsplash.com/photo-1598462083656-74cf8f8df4b3?auto=format&fit=crop&q=80&w=150&h=150',
};

export const userBrazil: User = {
  id: 'u_004',
  role: 'COMMERCIAL_GROWER',
  name: 'Fazenda Boa Vista',
  location: 'Mato Grosso, Brazil',
  avatarUrl: 'https://images.unsplash.com/photo-1535090467336-9501f96eec89?auto=format&fit=crop&q=80&w=150&h=150',
};

export const userNetherlands: User = {
  id: 'u_005',
  role: 'AGRONOMIST',
  name: 'Westland Innovations',
  location: 'Westland, Netherlands',
  avatarUrl: 'https://images.unsplash.com/photo-1581579186913-46aa3ba9fef0?auto=format&fit=crop&q=80&w=150&h=150',
};

export const userAustralia: User = {
  id: 'u_006',
  role: 'COMMERCIAL_GROWER',
  name: 'Queensland Agrinomics',
  location: 'Queensland, Australia',
  avatarUrl: 'https://images.unsplash.com/photo-1522204523234-8729aa6e3d5f?auto=format&fit=crop&q=80&w=150&h=150',
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
    id: 'post_3',
    authorId: 'u_004',
    imageUrl: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&q=80&w=1200',
    thumbnailUrl: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&q=80&w=600',
    description: 'Soybean yields are looking incredible this season! Nexus LIMS node tracking excellent nutrient retention.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1.5).toISOString(), // 1.5 hours ago
    likes: 289,
    comments: 31,
    telemetrySnapshot: {
      id: 'tel_3',
      nodeId: 'hw_004',
      timestamp: new Date().toISOString(),
      phLevel: 6.5,
      pressureBar: 605.1,
      temperatureC: 32.4,
      moisturePercent: 55,
    },
  },
  {
    id: 'post_4',
    authorId: 'u_003',
    imageUrl: 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&q=80&w=1200',
    thumbnailUrl: 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&q=80&w=600',
    description: 'Testing the new autonomous irrigation system. Wheat fields are perfectly hydrated despite the heatwave.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2.2).toISOString(), // 2.2 hours ago
    likes: 156,
    comments: 24,
    telemetrySnapshot: {
      id: 'tel_4',
      nodeId: 'hw_003',
      timestamp: new Date().toISOString(),
      phLevel: 7.0,
      pressureBar: 590.8,
      temperatureC: 41.2,
      moisturePercent: 38,
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
  },
  {
    id: 'post_5',
    authorId: 'u_005',
    imageUrl: 'https://images.unsplash.com/photo-1585408660995-1f6305a468d6?auto=format&fit=crop&q=80&w=1200',
    thumbnailUrl: 'https://images.unsplash.com/photo-1585408660995-1f6305a468d6?auto=format&fit=crop&q=80&w=600',
    description: 'Indoor greenhouse climate control optimized for tomato production. Edge node predicting yield peaks.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4.5).toISOString(), // 4.5 hours ago
    likes: 412,
    comments: 52,
    telemetrySnapshot: {
      id: 'tel_5',
      nodeId: 'hw_005',
      timestamp: new Date().toISOString(),
      phLevel: 6.2,
      pressureBar: 1013.2,
      temperatureC: 24.5,
      moisturePercent: 78,
    },
  },
  {
    id: 'post_6',
    authorId: 'u_006',
    imageUrl: 'https://images.unsplash.com/photo-1590682680695-43b964a3ae17?auto=format&fit=crop&q=80&w=1200',
    thumbnailUrl: 'https://images.unsplash.com/photo-1590682680695-43b964a3ae17?auto=format&fit=crop&q=80&w=600',
    description: 'Drone survey of the sugarcane fields completed. Uploading multispectral imagery to the network for analysis.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
    likes: 215,
    comments: 11,
    telemetrySnapshot: {
      id: 'tel_6',
      nodeId: 'hw_006',
      timestamp: new Date().toISOString(),
      phLevel: 5.8,
      pressureBar: 612.0,
      temperatureC: 28.7,
      moisturePercent: 62,
    },
  }
];

export const MOCK_USERS = {
  'u_001': currentUser,
  'u_002': sisterNodeUser,
  'u_003': userIndia,
  'u_004': userBrazil,
  'u_005': userNetherlands,
  'u_006': userAustralia,
  ...MOCK_GLOBAL_USERS,
};

export * from './data/mockNodes';
