export interface PlatformAchievementDTO {
  id: number;
  achievementId: string;
  name: string;
  description?: string;
  iconUrl?: string;
  isUnlocked: boolean;
  unlockedAt?: Date;
  earnedRate?: number;
  rarity?: number;
  points?: number;
  createdAt: Date;
  updatedAt: Date;
}
