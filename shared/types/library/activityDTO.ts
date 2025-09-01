export interface ActivityDTO {
  id: string;
  type: 'gaming' | 'achievement' | 'completion' | 'social';
  timestamp: Date;
  platformGame?: {
    id: number;
    name: string;
    iconUrl?: string;
  };
  achievement?: {
    id: number;
    name: string;
    description: string;
    iconUrl?: string;
  };
  user: {
    id: string;
    name: string;
    slug: string;
    avatarUrl?: string;
  };
  platform: string;
  data?: Record<string, unknown>;
}