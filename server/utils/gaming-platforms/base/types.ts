export interface UserProfile {
  platformId: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  profileUrl?: string;
  accessToken?: string;
  refreshToken?: string;
}

export interface GameData {
  platformGameId: string;
  name: string;
  playtimeTotal: number;
  playtimeRecent?: number;
  lastPlayed?: Date;
  iconUrl?: string;
  coverUrl?: string;
  isInstalled?: boolean;
  isPs5Game?: boolean;
}

export interface AchievementData {
  achievementId: string;
  name: string;
  description?: string;
  iconUrl?: string;
  isUnlocked: boolean;
  unlockedAt?: Date;
  rarity?: number;
  points?: number;
  earnedRate?: number;
}

export interface PlatformCredentials {
  [key: string]: string | number | boolean;
}

export interface SyncResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}
