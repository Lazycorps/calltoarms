import type { GamingPlatform, PlatformAccount } from "@prisma/client";
import type {
  UserProfile,
  GameData,
  AchievementData,
  PlatformCredentials,
  SyncResult,
} from "../base/types";
import type { PlayStationCredentials } from "./playstation-types";

// Import de la bibliothèque psn-api
import type { UserThinTrophy, TrophyTitle, Trophy } from "psn-api";
import {
  exchangeAccessCodeForAuthTokens,
  exchangeNpssoForAccessCode,
  exchangeRefreshTokenForAuthTokens,
  getUserTitles,
  getUserTrophiesEarnedForTitle,
  getTitleTrophies,
  getProfileFromUserName,
} from "psn-api";

export class PlayStationService {
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

  async syncGames(): Promise<SyncResult<GameData[]>> {
    try {
      if (!this.accessToken) {
        return this.createErrorResult("No access token available");
      }

      // Récupérer les titres de l'utilisateur
      const userTitles = await getUserTitles(
        { accessToken: this.accessToken },
        "me"
      );
      if (!userTitles?.trophyTitles) {
        return this.createSuccessResult([]);
      }

      const games: GameData[] = userTitles.trophyTitles.map(
        (game: TrophyTitle) => {
          return {
            platformGameId: game.npCommunicationId,
            name: game.trophyTitleName,
            playtimeTotal: 0,
            playtimeRecent: undefined, // PlayStation API ne fournit pas cette info
            lastPlayed: new Date(game.lastUpdatedDateTime),
            iconUrl: game.trophyTitleIconUrl,
            coverUrl: game.trophyTitleIconUrl,
            isInstalled: false, // Information non disponible via l'API trophées
            isPs5Game: game.trophyTitlePlatform.includes("PS5"),
          };
        }
      );

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
    gameId: string,
    isPs5Game: boolean
  ): Promise<SyncResult<AchievementData[]>> {
    try {
      if (!this.accessToken) {
        return this.createErrorResult("No access token available");
      }

      const authTokens = { accessToken: this.accessToken };
      const allAchievements: AchievementData[] = [];

      try {
        // 1. Récupérer tous les trophées du jeu pour le groupe principal (default)
        const gameTrophiesData = await getTitleTrophies(
          authTokens,
          gameId,
          "all", // Commencer par le groupe principal
          {
            npServiceName: isPs5Game ? undefined : "trophy",
          }
        );

        if (!gameTrophiesData?.trophies) {
          console.log(`No trophies found for game ${gameId}`);
          return this.createSuccessResult([]);
        }

        // 2. Récupérer les trophées gagnés par l'utilisateur pour ce jeu (groupe principal)
        const userTrophiesData = await getUserTrophiesEarnedForTitle(
          authTokens,
          "me",
          gameId,
          "all",
          {
            npServiceName: isPs5Game ? undefined : "trophy",
          }
        );

        // 3. Créer un map des trophées gagnés par l'utilisateur pour un accès rapide
        const userTrophiesMap = new Map<number, UserThinTrophy>();
        if (userTrophiesData?.trophies) {
          userTrophiesData.trophies.forEach((userTrophy: UserThinTrophy) => {
            userTrophiesMap.set(userTrophy.trophyId, userTrophy);
          });
        }

        // 4. Merger les données pour le groupe principal
        const mainGroupAchievements: AchievementData[] =
          gameTrophiesData.trophies.map((gameTrophy: Trophy) => {
            const userTrophy = userTrophiesMap.get(gameTrophy.trophyId);
            return this.normalizeTrophy(
              { ...gameTrophy, ...userTrophy },
              gameId
            );
          });

        allAchievements.push(...mainGroupAchievements);

        // 5. Essayer de récupérer d'autres groupes de trophées (DLC, etc.)
        // Note: Pour l'instant, on se concentre sur le groupe principal
        // Une amélioration future pourrait parcourir tous les groupes disponibles
      } catch (trophyError) {
        console.error(
          `Error fetching trophies for game ${gameId}:`,
          trophyError
        );

        // Si l'erreur est due à un jeu sans trophées ou à des permissions, retourner une liste vide
        if (
          trophyError instanceof Error &&
          (trophyError.message.includes("404") ||
            trophyError.message.includes("not found") ||
            trophyError.message.includes("no trophies"))
        ) {
          return this.createSuccessResult([]);
        }

        // Pour d'autres erreurs, les propager
        throw trophyError;
      }

      console.log(
        `Successfully synced ${allAchievements.length} trophies for game ${gameId}`
      );
      return this.createSuccessResult(allAchievements);
    } catch (error) {
      console.error("Detailed PlayStation trophy sync error:", error);
      return this.createErrorResult(
        `Failed to sync PlayStation trophies for game ${gameId}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private normalizeTrophy(trophy: Trophy, gameid: string) {
    return {
      achievementId: `${gameid}_${trophy.trophyId}`, // ID unique avec préfixe du jeu
      name: trophy.trophyName || "Trophée inconnu", // Nom complet depuis les données du jeu
      description: trophy.trophyDetail || "", // Description depuis les données du jeu
      iconUrl: trophy.trophyIconUrl, // Icône depuis les données du jeu
      isUnlocked: trophy?.earned || false, // Statut depuis les données utilisateur
      unlockedAt: trophy?.earnedDateTime
        ? new Date(trophy.earnedDateTime)
        : undefined, // Date depuis les données utilisateur
      rarity: trophy?.trophyRare, // Rareté depuis les données utilisateur
      points: this.getTrophyPoints(trophy.trophyType), // Points basés sur le type
      earnedRate: Number(trophy.trophyEarnedRate),
    };
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

  protected createSuccessResult<T>(data: T): SyncResult<T> {
    return {
      success: true,
      data,
    };
  }

  protected createErrorResult<T>(error: string): SyncResult<T> {
    return {
      success: false,
      error,
    };
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
