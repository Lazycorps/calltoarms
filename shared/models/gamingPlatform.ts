import type {
  GamingPlatform,
  PlatformAccount,
  PlatformGame,
} from "@prisma/client";

export interface PlatformAccountWithStats extends PlatformAccount {
  _count: {
    games: number;
  };
}

export interface PlatformGameWithAccount extends PlatformGame {
  platformAccount: {
    id: number;
    platform: GamingPlatform;
    username: string | null;
    displayName: string | null;
  };
  _count: {
    achievements: number;
  };
}

export interface PlatformStats {
  totalConnectedPlatforms: number;
  totalGames: number;
  totalPlaytime: number;
  totalAchievements: number;
}
