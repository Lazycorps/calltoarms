import type { GamingPlatform } from "@prisma/client";

export interface PlatformAccountDTO {
  id: number;
  platform: GamingPlatform;
  platformId: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  profileUrl?: string;
  isActive: boolean;
  lastSync?: Date;
  gamesCount: number;
  createdAt: Date;
  updatedAt: Date;
}
