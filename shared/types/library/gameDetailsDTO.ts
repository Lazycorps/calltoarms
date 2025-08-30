import type { PlatformGameDTO } from "./platformGameDTO";
import type { PlatformAchievementDTO } from "./platformAchievementDTO";
import type { GameStatsDTO } from "./gameStatsDTO";

export interface GameDetailsDTO {
  game: PlatformGameDTO;
  achievements: PlatformAchievementDTO[];
  stats: GameStatsDTO;
}
