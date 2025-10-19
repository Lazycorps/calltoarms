import type { PlatformGameCardDTO } from "./platformGameCardDTO";

export interface ActivityHubDTO {
  friendsActivity: {
    recentlyPlayed: PlatformGameCardDTO[];
    recentlyCompleted: PlatformGameCardDTO[];
  };
  myActivity: {
    recentlyCompleted: PlatformGameCardDTO[];
  };
  stats: {
    totalFriends: number;
    activeFriendsThisWeek: number;
    totalGamesInCircle: number;
  };
}
