export interface XboxCredentials {
  email: string;
  password: string;
}

// Types de réponse de l'API Xbox Live
export interface XboxUserProfile {
  xuid: string;
  gamertag: string;
  displayName: string;
  realName?: string;
  displayPicRaw: string;
  showUserAsAvatar: string;
  gamerscore: number;
  accountTier: string;
  xboxOneRep: string;
  preferredColor: {
    primaryColor: string;
    secondaryColor: string;
    tertiaryColor: string;
  };
  presenceState: string;
  presenceText: string;
  presenceDevices: Array<{
    type: string;
    titles: Array<{
      id: string;
      name: string;
      placement: string;
      state: string;
      lastModified: string;
    }>;
  }>;
}

export interface XboxGame {
  titleId: string;
  name: string;
  displayImage?: string;
  description?: string;
  publisher: string;
  developer?: string;
  category: string;
  subCategory?: string;
  alternativeTitleId?: string;
  titleHistory: {
    lastTimePlayed: string;
    visible: boolean;
  };
  titleRecord: {
    visible: boolean;
  };
  detail: {
    productId: string;
    xboxLiveTier: string;
  };
  friendsWhoPlayed?: Array<{
    xuid: string;
    gamertag: string;
  }>;
  stats?: {
    arrangedByGamertag: Array<{
      gamertag: string;
      statlistscollection: Array<{
        arrangedByStatName: Array<{
          statname: string;
          type: string;
          value: string;
        }>;
      }>;
    }>;
  };
}

export interface XboxAchievement {
  id: string;
  serviceConfigId: string;
  name: string;
  titleAssociations: Array<{
    name: string;
    id: number;
  }>;
  progressState: "Achieved" | "NotStarted" | "InProgress";
  progression: {
    achievementState: "Achieved" | "NotStarted" | "InProgress";
    percentage: number;
    timeUnlocked?: string;
  };
  mediaAssets: Array<{
    name: string;
    type: string;
    url: string;
  }>;
  platforms: string[];
  isSecret: boolean;
  description: string;
  lockedDescription: string;
  productId: string;
  achievementType: string;
  participationType: string;
  timeWindow?: {
    startDate: string;
    endDate: string;
  };
  rewards: Array<{
    name: string;
    description: string;
    value: string;
    type: string;
    mediaAsset?: {
      name: string;
      type: string;
      url: string;
    };
  }>;
  estimatedTime: string;
  deeplink: string;
  isRevoked: boolean;
  rarity?: {
    currentCategory: string;
    currentPercentage: number;
  };
}

export interface XboxGameStats {
  xuid: string;
  scid: string;
  titleId: string;
  displayName: string;
  preferredLanguage: string;
  stats: Array<{
    statname: string;
    type: string;
    value: string;
  }>;
}

// Types de réponse de l'API Xbox
export interface XboxApiResponse<T> {
  value: T[];
  "@odata.count"?: number;
  "@odata.nextLink"?: string;
}

export interface XboxProfileResponse {
  profileUsers: XboxUserProfile[];
}

export interface XboxTitleHistoryResponse {
  titles: XboxGame[];
}

export interface XboxAchievementsResponse {
  achievements: XboxAchievement[];
  pagingInfo?: {
    continuationToken?: string;
    totalRecords: number;
  };
}

export interface XboxAuthTokens {
  userToken: string;
  xstsToken: string;
  expiresOn: string;
}
