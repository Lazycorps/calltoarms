export interface EpicCredentials {
  accessToken?: string;
  refreshToken?: string;
  code?: string; // Pour le flow OAuth initial
}

// Types de réponse de l'API Epic Games
export interface EpicUserProfile {
  accountId: string;
  displayName: string;
  preferredLanguage: string;
  linkedAccounts?: Array<{
    identityProviderId: string;
    displayName: string;
  }>;
}

export interface EpicGame {
  catalogItemId: string;
  namespace: string;
  offerId?: string;
  title: string;
  description?: string;
  longDescription?: string;
  keyImages?: Array<{
    type: string;
    url: string;
    alt?: string;
  }>;
  categories?: Array<{
    path: string;
  }>;
  releaseDate?: string;
  pcReleaseDate?: string;
  developer?: string;
  publisher?: string;
  price?: {
    totalPrice: {
      discountPrice: number;
      originalPrice: number;
      voucherDiscount: number;
      discount: number;
      currencyCode: string;
      currencyInfo: {
        decimals: number;
      };
      fmtPrice: {
        originalPrice: string;
        discountPrice: string;
        intermediatePrice: string;
      };
    };
  };
}

export interface EpicLibraryItem {
  appName: string;
  catalogItemId: string;
  namespace: string;
  displayName: string;
  developer?: string;
  publisherDisplayName?: string;
  installationGuid?: string;
  isCompleteInstall?: boolean;
  canRunOffline?: boolean;
  baseURLs?: string[];
  launchParameters?: string[];
  accountId: string;
  entitlementName?: string;
  entitlementType?: string;
  installStatus?: string;
  installedAppVersion?: string;
  availableAppVersion?: string;
  lastPlayedTime?: string;
  totalPlayTime?: number;
}

export interface EpicAchievement {
  achievementName: string;
  progress: {
    playerAward: {
      awardedAt: string;
      epicAccountId: string;
    };
  };
  XP: number;
  isBase: boolean;
  isHidden: boolean;
}

// Types de réponse de l'API Epic Games
export interface EpicAuthTokenResponse {
  access_token: string;
  expires_in: number;
  expires_at: string;
  token_type: string;
  refresh_token?: string;
  refresh_expires?: number;
  refresh_expires_at?: string;
  account_id: string;
  client_id: string;
  internal_client: boolean;
  client_service: string;
  scope: string[];
  displayName: string;
  app: string;
  in_app_id: string;
  device_id: string;
}

export interface EpicLibraryResponse {
  records: EpicLibraryItem[];
  responseMetadata: {
    nextCursor?: string;
  };
}

export interface EpicUserResponse {
  accountId: string;
  displayName: string;
  name: string;
  email: string;
  failedLoginAttempts: number;
  lastLogin: string;
  numberOfDisplayNameChanges: number;
  ageGroup: string;
  headless: boolean;
  country: string;
  lastName: string;
  firstName: string;
  preferredLanguage: string;
  canUpdateDisplayName: boolean;
  tfaEnabled: boolean;
  emailVerified: boolean;
  minorVerified: boolean;
  minorExpected: boolean;
  minorStatus: string;
  cabinedMode: boolean;
  hasHashedEmail: boolean;
}

export interface EpicGameDetailsResponse {
  catalogItems: EpicGame[];
  paging: {
    count: number;
    total: number;
  };
}

export interface EpicAchievementsResponse {
  playerAchievements: EpicAchievement[];
  achievementSets: Array<{
    achievementSetId: string;
    isBase: boolean;
  }>;
}

// Interface pour retourner profil + tokens lors de l'authentification
export interface EpicAuthResult {
  platformId: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  profileUrl?: string;
  accessToken: string;
  refreshToken?: string;
}