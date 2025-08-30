export interface PlayStationCredentials {
  username: string;
  npsso: string; // NPSSO token au lieu du password
}

// Types de réponse de l'API PlayStation (basés sur l'API PSN non officielle)
export interface PlayStationUserProfile {
  onlineId: string;
  accountId: string;
  avatarUrls: Array<{
    size: string;
    avatarUrl: string;
  }>;
  plus: number;
  aboutMe: string;
  languagesUsed: string[];
  trophySummary: {
    level: number;
    progress: number;
    earnedTrophies: {
      platinum: number;
      gold: number;
      silver: number;
      bronze: number;
    };
  };
  isOfficiallyVerified: boolean;
  personalDetail: {
    firstName: string;
    lastName: string;
    profilePictureUrls: Array<{
      size: string;
      profilePictureUrl: string;
    }>;
  };
  personalDetailSharing: string;
  personalDetailSharingRequestMessageFlag: boolean;
  primaryOnlineStatus: string;
  presences: Array<{
    onlineStatus: string;
    platform: string;
    lastOnlineDate: string;
  }>;
}

export interface PlayStationGame {
  npCommunicationId: string;
  trophyTitleName: string;
  trophyTitleDetail: string;
  trophyTitleIconUrl: string;
  trophyTitlePlatform: string;
  hasTrophyGroups: boolean;
  definedTrophies: {
    platinum: number;
    gold: number;
    silver: number;
    bronze: number;
  };
  progress: number;
  earnedTrophies: {
    platinum: number;
    gold: number;
    silver: number;
    bronze: number;
  };
  hiddenFlag: boolean;
  lastUpdatedDateTime: string;
}

export interface PlayStationTrophy {
  trophyId: number;
  trophyHidden: boolean;
  earned: boolean;
  earnedDateTime?: string;
  trophyType: "platinum" | "gold" | "silver" | "bronze";
  trophyName: string;
  trophyDetail: string;
  trophyIconUrl: string;
  trophyRare: number;
  trophyEarnedRate: string;
}

export interface PlayStationGameDetail {
  npCommunicationId: string;
  trophyTitleName: string;
  trophyTitleDetail: string;
  trophyTitleIconUrl: string;
  trophyTitlePlatform: string;
  hasTrophyGroups: boolean;
  trophyGroups: Array<{
    trophyGroupId: string;
    trophyGroupName: string;
    trophyGroupDetail: string;
    trophyGroupIconUrl: string;
    definedTrophies: {
      platinum: number;
      gold: number;
      silver: number;
      bronze: number;
    };
  }>;
  definedTrophies: {
    platinum: number;
    gold: number;
    silver: number;
    bronze: number;
  };
  progress: number;
  earnedTrophies: {
    platinum: number;
    gold: number;
    silver: number;
    bronze: number;
  };
  hiddenFlag: boolean;
  lastUpdatedDateTime: string;
}

// Types de réponse de l'API PlayStation
export interface PlayStationApiResponse<T> {
  data: T;
  totalItemCount?: number;
  nextOffset?: number;
  previousOffset?: number;
}

export interface PlayStationProfileResponse {
  profile: PlayStationUserProfile;
}

export interface PlayStationGamesResponse {
  trophyTitles: PlayStationGame[];
  totalItemCount: number;
  nextOffset?: number;
  previousOffset?: number;
}

export interface PlayStationTrophiesResponse {
  trophies: PlayStationTrophy[];
  totalItemCount: number;
  nextOffset?: number;
  previousOffset?: number;
}
