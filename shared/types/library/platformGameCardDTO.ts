import type { GamingPlatform } from "@prisma/client";

export interface PlatformGameCardDTO {
  id: number;
  name: string;
  iconUrl: string | null;
  coverUrl: string | null;
  lastPlayed: Date | null;
  playtimeTotal: number;
  platformGameId: string;
  platform: GamingPlatform;
  achievementsCount: number;
  totalAchievements: number;
  achievementPercentage: number;
  isCompleted: boolean;
  // Informations sur l'ami qui possède ce jeu
  friendName?: string;
  friendSlug?: string;
}
