import type { PlatformAccountDTO } from "./platformAccountDTO";

export interface PlatformGameDTO {
  id: number;
  platformGameId: string;
  name: string;
  playtimeTotal: number;
  playtimeRecent?: number;
  lastPlayed?: Date;
  iconUrl?: string;
  coverUrl?: string;
  isInstalled: boolean;
  isCompleted: boolean;
  completedAt?: Date;
  platformAccount: PlatformAccountDTO;
  achievementsCount: number;
  totalAchievements: number;
  achievementPercentage: number;
  createdAt: Date;
  updatedAt: Date;
}
