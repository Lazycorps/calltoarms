export interface GameStatsDTO {
  playtimeTotal: number;
  achievementsCount: number;
  totalAchievements: number;
  achievementPercentage: number;
  isCompleted: boolean;
  lastPlayed?: Date;
}

export interface GameComparisonDTO {
  game: {
    id: number;
    name: string;
    platform: string;
    iconUrl?: string;
    coverUrl?: string;
  };
  friend: {
    name: string;
    slug: string;
    stats: GameStatsDTO;
  };
  user: {
    stats?: GameStatsDTO;
    hasGame: boolean;
  };
}