import type { GamingPlatform } from "@prisma/client";

export interface GameCard {
  id: number;
  name: string;
  iconUrl: string | null;
  coverUrl: string | null;
  lastPlayed: Date | null;
  playtimeTotal: number;
  platformGameId: number;
  platform: GamingPlatform;
  achievementsCount: number;
  totalAchievements: number;
  achievementPercentage: number;
}
