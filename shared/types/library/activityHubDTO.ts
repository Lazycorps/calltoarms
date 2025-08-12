import type { PlatformGameCardDTO } from "./platformGameCardDTO";

export interface ActivityHubDTO {
  friendsActivity: {
    recentlyPlayed: PlatformGameCardDTO[];
    recentlyCompleted: PlatformGameCardDTO[];
  };
  myActivity: {
    recentlyCompleted: PlatformGameCardDTO[];
  };
  popularInCircle: {
    games: PlatformGameCardDTO[];
    totalFriendsPlaying: number;
  };
  recommendations: {
    basedOnFriends: PlatformGameCardDTO[];
  };
  stats: {
    totalFriends: number;
    activeFriendsThisWeek: number;
    totalGamesInCircle: number;
  };
}