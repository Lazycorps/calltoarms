export interface GameStatsDTO {
  totalAchievements: number;
  unlockedAchievements: number;
  completionPercentage: number;
  totalPoints: number;
  unlockedPoints: number;
  rarityStats: {
    common: number;
    uncommon: number;
    rare: number;
    ultraRare: number;
  };
}
