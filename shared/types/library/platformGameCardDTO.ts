import type { GamingPlatform } from "@prisma/client";

export interface PlatformGameCardDTO {
  id: number;
  name: string;
  iconUrl?: string;
  coverUrl?: string;
  lastPlayed?: Date;
  playtimeTotal: number;
  platform: GamingPlatform;
  achievementsCount: number;
  totalAchievements: number;
  achievementPercentage: number;
  isCompleted: boolean;
}
