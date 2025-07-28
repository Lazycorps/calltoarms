import type { GamingPlatform, PlatformAccount } from "@prisma/client";
import { PlatformService } from "../base/PlatformService";
import type {
  UserProfile,
  GameData,
  AchievementData,
  PlatformCredentials,
  SyncResult,
} from "../base/types";
import type { PlayStationCredentials } from "./playstation-types";

// Import de la bibliothèque psn-api
import {
  exchangeAccessCodeForAuthTokens,
  exchangeNpssoForAccessCode,
  exchangeRefreshTokenForAuthTokens,
  getUserTitles,
  getUserTrophiesEarnedForTitle,
  getProfileFromUserName,
} from "psn-api";

export class PlayStationService extends PlatformService {
  readonly platform: GamingPlatform = "PLAYSTATION";
  private accessToken: string | null = null;
  private psRefreshToken: string | null = null;

  async authenticate(
    credentials: PlatformCredentials
  ): Promise<SyncResult<UserProfile>> {
    try {
      if (!this.validateCredentials(credentials)) {
        return this.createErrorResult("Invalid PlayStation credentials");
      }

      const psCredentials = credentials as unknown as PlayStationCredentials;

      // Note: L'authentification PlayStation nécessite un code d'autorisation OAuth
      // Le username/password ne peut pas être utilisé directement
      // Il faut d'abord obtenir un code d'autorisation via le navigateur

      try {
        // Authentification avec NPSSO
        const accessCode = await exchangeNpssoForAccessCode(
          psCredentials.npsso
        );
        const authTokens = await exchangeAccessCodeForAuthTokens(accessCode);

        this.accessToken = authTokens.accessToken;
        this.psRefreshToken = authTokens.refreshToken;

        // Récupérer l'accountId à partir du username
        const response = await getProfileFromUserName(authTokens, "me");
        const profile: UserProfile = {
          platformId: response.profile.accountId,
          username: psCredentials.username,
          displayName: psCredentials.username,
          avatarUrl: undefined,
          profileUrl: `https://psnprofiles.com/${psCredentials.username}`,
        };

        return this.createSuccessResult(profile);
      } catch (authError) {
        return this.createErrorResult(
          `PlayStation authentication failed: ${
            authError instanceof Error
              ? authError.message
              : "Invalid authorization code"
          }`
        );
      }
    } catch (error) {
      return this.createErrorResult(
        `PlayStation authentication failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async refreshToken(
    account: PlatformAccount
  ): Promise<SyncResult<PlatformAccount>> {
    try {
      if (!this.psRefreshToken) {
        return this.createErrorResult("No refresh token available");
      }

      const authTokens = await exchangeRefreshTokenForAuthTokens(
        this.psRefreshToken
      );
      this.accessToken = authTokens.accessToken;
      this.psRefreshToken = authTokens.refreshToken;

      return this.createSuccessResult(account);
    } catch (error) {
      return this.createErrorResult(
        `Failed to refresh PlayStation token: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async syncGames(account: PlatformAccount): Promise<SyncResult<GameData[]>> {
    try {
      if (!this.accessToken) {
        return this.createErrorResult("No access token available");
      }

      // Récupérer les titres de l'utilisateur
      const userTitles = await getUserTitles(
        { accessToken: this.accessToken },
        "me"
      );
      console.log(userTitles);
      if (!userTitles?.trophyTitles) {
        return this.createSuccessResult([]);
      }

      const games: GameData[] = userTitles.trophyTitles.map((game: any) => {
        return {
          platformGameId: game.npCommunicationId,
          name: game.trophyTitleName,
          playtimeTotal: 0,
          playtimeRecent: undefined, // PlayStation API ne fournit pas cette info
          lastPlayed: new Date(game.lastUpdatedDateTime),
          iconUrl: game.trophyTitleIconUrl,
          coverUrl: game.trophyTitleIconUrl,
          isInstalled: false, // Information non disponible via l'API trophées
        };
      });

      return this.createSuccessResult(games);
    } catch (error) {
      return this.createErrorResult(
        `Failed to sync PlayStation games: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async syncAchievements(
    account: PlatformAccount,
    gameId: string
  ): Promise<SyncResult<AchievementData[]>> {
    try {
      if (!this.accessToken) {
        return this.createErrorResult("No access token available");
      }

      // Récupérer les trophées pour un jeu spécifique
      const trophiesData = await getUserTrophiesEarnedForTitle(
        { accessToken: this.accessToken },
        "me",
        gameId,
        "all", // Groupe de trophées
        {
          npServiceName: "trophy",
        }
      );

      if (!trophiesData?.trophies) {
        return this.createSuccessResult([]);
      }

      const achievements: AchievementData[] = trophiesData.trophies.map(
        (trophy: any) => ({
          achievementId: trophy.trophyId.toString(),
          name: trophy.trophyName,
          description: trophy.trophyDetail,
          iconUrl: trophy.trophyIconUrl,
          isUnlocked: trophy.earned,
          unlockedAt: trophy.earnedDateTime
            ? new Date(trophy.earnedDateTime)
            : undefined,
          rarity: parseFloat(trophy.trophyEarnedRate.replace("%", "")),
          points: this.getTrophyPoints(trophy.trophyType),
        })
      );

      return this.createSuccessResult(achievements);
    } catch (error) {
      return this.createErrorResult(
        `Failed to sync PlayStation trophies: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async getUserProfile(
    account: PlatformAccount
  ): Promise<SyncResult<UserProfile>> {
    // Retourner le profil basé sur les données du compte
    const profile: UserProfile = {
      platformId: account.platformId,
      username: account.username || account.platformId,
      displayName:
        account.displayName || account.username || account.platformId,
      avatarUrl: account.avatarUrl || undefined,
      profileUrl:
        account.profileUrl || `https://psnprofiles.com/${account.username}`,
    };

    return this.createSuccessResult(profile);
  }

  validateCredentials(credentials: PlatformCredentials): boolean {
    const psCredentials = credentials as unknown as PlayStationCredentials;
    return !!(
      psCredentials.username &&
      psCredentials.npsso &&
      typeof psCredentials.username === "string" &&
      typeof psCredentials.npsso === "string" &&
      psCredentials.username.length > 0 &&
      psCredentials.npsso.length > 0
    );
  }

  private getTrophyPoints(trophyType: string): number {
    switch (trophyType) {
      case "platinum":
        return 300;
      case "gold":
        return 90;
      case "silver":
        return 30;
      case "bronze":
        return 15;
      default:
        return 0;
    }
  }
}
