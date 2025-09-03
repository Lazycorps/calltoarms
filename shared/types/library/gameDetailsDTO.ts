import type { PlatformGameDTO } from "./platformGameDTO";
import type { PlatformAchievementDTO } from "./platformAchievementDTO";
import type { GameStatsDTO } from "./gameStatsDTO";

export interface GameDetailsDTO {
  isOwnGame: boolean;
  game: PlatformGameDTO;
  achievements: PlatformAchievementDTO[];
  stats: GameStatsDTO;
}
