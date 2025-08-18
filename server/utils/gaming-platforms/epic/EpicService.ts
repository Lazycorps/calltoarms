import type { GamingPlatform, PlatformAccount } from "@prisma/client";
import type {
  UserProfile,
  GameData,
  AchievementData,
  PlatformCredentials,
  SyncResult,
} from "../base/types";
import type {
  EpicCredentials,
  EpicAuthTokenResponse,
  EpicUserResponse,
  EpicLibraryResponse,
  EpicLibraryItem,
  EpicAuthResult,
} from "./epic-types";

export class EpicService {
  readonly platform: GamingPlatform = "EPIC_GAMES";
  private readonly baseUrl = "https://api.epicgames.dev";
  private readonly authUrl = "https://api.epicgames.dev/epic/oauth/v1";
  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor() {
    const config = useRuntimeConfig();
    this.clientId = config.epicClientId;
    this.clientSecret = config.epicClientSecret;

    if (!this.clientId || !this.clientSecret) {
      throw new Error("Epic Games client ID and secret are required");
    }
  }

  async authenticate(
    credentials: PlatformCredentials
  ): Promise<SyncResult<UserProfile>> {
    try {
      if (!this.validateCredentials(credentials)) {
        return this.createErrorResult("Invalid Epic Games credentials");
      }

      const epicCredentials = credentials as unknown as EpicCredentials;

      // Si on a un code d'autorisation, l'échanger contre un token
      if (epicCredentials.code) {
        const tokenResult = await this.exchangeCodeForToken(
          epicCredentials.code
        );
        if (!tokenResult.success || !tokenResult.data) {
          return this.createErrorResult(
            tokenResult.error || "Failed to exchange authorization code"
          );
        }

        // Epic Games inclut l'account ID dans la réponse du token
        const accountId = tokenResult.data.account_id;

        if (!accountId) {
          return this.createErrorResult(
            "Epic Games token response missing account_id"
          );
        }

        // Utiliser les informations du token comme fallback
        let username = tokenResult.data.displayName || accountId;
        let displayName = tokenResult.data.displayName || accountId;

        // Essayer de récupérer plus d'infos du profil si possible
        const profileResult = await this.fetchUserProfile(
          tokenResult.data.access_token
        );
        if (profileResult.success && profileResult.data) {
          username =
            profileResult.data.displayName ||
            profileResult.data.name ||
            username;
          displayName =
            profileResult.data.displayName ||
            profileResult.data.name ||
            displayName;
        }

        const profile: UserProfile = {
          platformId: accountId,
          username,
          displayName,
          avatarUrl: undefined, // Epic Games n'expose pas d'API publique pour les avatars
          profileUrl: undefined,
        };

        return this.createSuccessResult(profile);
      }

      // Si on a déjà un access token, valider et récupérer le profil
      if (epicCredentials.accessToken) {
        const profileResult = await this.fetchUserProfile(
          epicCredentials.accessToken
        );
        if (!profileResult.success || !profileResult.data) {
          return this.createErrorResult(
            profileResult.error || "Failed to fetch Epic Games profile"
          );
        }

        const profile: UserProfile = {
          platformId: profileResult.data.accountId,
          username: profileResult.data.displayName,
          displayName: profileResult.data.displayName,
          avatarUrl: undefined,
          profileUrl: undefined,
        };

        return this.createSuccessResult(profile);
      }

      return this.createErrorResult("No valid Epic Games credentials provided");
    } catch (error) {
      return this.createErrorResult(
        `Epic Games authentication failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async authenticateWithTokens(
    credentials: PlatformCredentials
  ): Promise<SyncResult<EpicAuthResult>> {
    try {
      if (!this.validateCredentials(credentials)) {
        return this.createErrorResult("Invalid Epic Games credentials");
      }

      const epicCredentials = credentials as unknown as EpicCredentials;

      // Si on a un code d'autorisation, l'échanger contre un token
      if (epicCredentials.code) {
        const tokenResult = await this.exchangeCodeForToken(
          epicCredentials.code
        );
        if (!tokenResult.success || !tokenResult.data) {
          return this.createErrorResult(
            tokenResult.error || "Failed to exchange authorization code"
          );
        }

        // Epic Games inclut l'account ID dans la réponse du token
        const accountId = tokenResult.data.account_id;

        if (!accountId) {
          return this.createErrorResult(
            "Epic Games token response missing account_id"
          );
        }

        console.log("Token data received from Epic:", {
          account_id: tokenResult.data.account_id,
          access_token: tokenResult.data.access_token ? "PRESENT" : "MISSING",
          refresh_token: tokenResult.data.refresh_token ? "PRESENT" : "MISSING",
          displayName: tokenResult.data.displayName,
          expires_in: tokenResult.data.expires_in,
        });

        // Essayer de récupérer le profil, mais ne pas échouer si cela ne fonctionne pas
        let username = tokenResult.data.displayName || accountId;
        let displayName = tokenResult.data.displayName || accountId;

        const profileResult = await this.fetchUserProfile(
          tokenResult.data.access_token
        );
        if (profileResult.success && profileResult.data) {
          username =
            profileResult.data.displayName ||
            profileResult.data.name ||
            username;
          displayName =
            profileResult.data.displayName ||
            profileResult.data.name ||
            displayName;
        }

        const authResult: EpicAuthResult = {
          platformId: accountId,
          username,
          displayName,
          avatarUrl: undefined,
          profileUrl: undefined,
          accessToken: tokenResult.data.access_token,
          refreshToken: tokenResult.data.refresh_token,
        };

        console.log("Epic Games auth result created:", {
          platformId: authResult.platformId,
          username: authResult.username,
          has_access_token: !!authResult.accessToken,
          has_refresh_token: !!authResult.refreshToken,
        });

        return this.createSuccessResult(authResult);
      }

      return this.createErrorResult("No valid Epic Games credentials provided");
    } catch (error) {
      return this.createErrorResult(
        `Epic Games authentication failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async refreshToken(
    account: PlatformAccount
  ): Promise<SyncResult<PlatformAccount>> {
    try {
      if (!account.refreshToken) {
        return this.createErrorResult("No refresh token available");
      }

      const response = await fetch(`${this.authUrl}/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(
            `${this.clientId}:${this.clientSecret}`
          ).toString("base64")}`,
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: account.refreshToken,
        }),
      });

      if (!response.ok) {
        return this.createErrorResult(
          `Epic Games token refresh error: ${response.statusText}`
        );
      }

      const tokenData: EpicAuthTokenResponse = await response.json();

      // Mettre à jour le compte avec les nouveaux tokens
      const updatedAccount = {
        ...account,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || account.refreshToken,
      };

      return this.createSuccessResult(updatedAccount);
    } catch (error) {
      return this.createErrorResult(
        `Failed to refresh Epic Games token: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async syncGames(account: PlatformAccount): Promise<SyncResult<GameData[]>> {
    try {
      if (!account.accessToken) {
        return this.createErrorResult("No access token available");
      }

      // Epic Games utilise une API différente pour les entitlements (jeux possédés)
      // Cette API nécessite des permissions spéciales que vous devez avoir configurées
      const libraryUrl = `https://api.epicgames.dev/epic/ecom/v1/platforms/EPIC/identities/${account.platformId}/entitlements`;

      const response = await fetch(libraryUrl, {
        headers: {
          Authorization: `Bearer ${account.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.warn(
          `Epic Games entitlements API error: ${response.status} ${response.statusText}`
        );
        // Fallback vers l'API alternative si la première ne fonctionne pas
        return await this.syncGamesAlternative(account);
      }

      const libraryData: EpicLibraryResponse = await response.json();

      if (!libraryData.records || libraryData.records.length === 0) {
        return this.createSuccessResult([]);
      }

      const syncDate = new Date();
      const games: GameData[] = await Promise.all(
        libraryData.records.map(async (item: EpicLibraryItem) => {
          // Récupérer les détails du jeu pour avoir les images
          const gameDetails = await this.getGameDetails(
            item.catalogItemId,
            account.accessToken!
          );

          // Convertir le temps de jeu (Epic fournit en minutes)
          const playtimeTotal = item.totalPlayTime || 0;

          // Déterminer lastPlayed
          let lastPlayed: Date | undefined;
          if (item.lastPlayedTime) {
            lastPlayed = new Date(item.lastPlayedTime);
          } else if (playtimeTotal > 0) {
            // Si pas de lastPlayed mais du temps de jeu, utiliser la date de sync
            lastPlayed = syncDate;
          }

          return {
            platformGameId: item.catalogItemId,
            name: item.displayName || item.appName,
            playtimeTotal,
            playtimeRecent: undefined, // Epic Games n'expose pas le temps récent
            lastPlayed,
            iconUrl: gameDetails?.iconUrl,
            coverUrl: gameDetails?.coverUrl,
            isInstalled:
              item.installStatus === "Installed" ||
              item.isCompleteInstall === true,
          };
        })
      );

      return this.createSuccessResult(games);
    } catch (error) {
      return this.createErrorResult(
        `Failed to sync Epic Games: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private async syncGamesAlternative(
    account: PlatformAccount
  ): Promise<SyncResult<GameData[]>> {
    try {
      console.warn(
        "Epic Games library API not available - Epic Games requires special permissions for library access"
      );
      console.warn(
        "Your Epic Games developer application may need additional approvals to access user libraries"
      );

      // Pour l'instant, retourner une liste vide avec un message informatif
      // L'utilisateur pourra toujours s'authentifier mais n'aura pas de synchronisation de jeux
      return this.createSuccessResult([]);

      /*
      // Code pour quand l'API sera disponible avec les bonnes permissions
      const libraryUrl = `https://api.epicgames.dev/epic/ecom/v1/platforms/EPIC/identities/${account.platformId}/ownership`;
      
      const response = await fetch(libraryUrl, {
        headers: {
          "Authorization": `Bearer ${account.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        return this.createErrorResult(
          `Epic Games library API error: ${response.statusText}`
        );
      }

      const ownershipData = await response.json();
      // Traitement des données...
      */
    } catch (error) {
      return this.createErrorResult(
        `Failed to sync Epic Games (alternative): ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private async getGameDetails(
    catalogItemId: string,
    accessToken: string
  ): Promise<{ name?: string; iconUrl?: string; coverUrl?: string } | null> {
    try {
      const detailsUrl = `${this.baseUrl}/epic/catalog/v1/items/${catalogItemId}`;

      const response = await fetch(detailsUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        return null;
      }

      const gameData = await response.json();

      let iconUrl: string | undefined;
      let coverUrl: string | undefined;

      // Extraire les images des keyImages
      if (gameData.keyImages && Array.isArray(gameData.keyImages)) {
        const iconImage = gameData.keyImages.find(
          (img: any) =>
            img.type === "Thumbnail" || img.type === "OfferImageWide"
        );
        const coverImage = gameData.keyImages.find(
          (img: any) =>
            img.type === "DieselStoreFrontWide" || img.type === "OfferImageWide"
        );

        iconUrl = iconImage?.url;
        coverUrl = coverImage?.url;
      }

      return {
        name: gameData.title,
        iconUrl,
        coverUrl,
      };
    } catch (error) {
      console.warn(`Failed to fetch game details for ${catalogItemId}:`, error);
      return null;
    }
  }

  async syncAchievements(
    account: PlatformAccount,
    gameId: string,
    existingAchievements?: Set<string>
  ): Promise<
    SyncResult<{ achievements: AchievementData[]; mostRecentUnlock?: Date }>
  > {
    try {
      if (!account.accessToken) {
        return this.createErrorResult("No access token available");
      }

      // Récupérer les achievements du jeu avec l'API Epic Games
      const achievementsUrl = `${this.baseUrl}/epic/achievements/v1/platforms/epic/sandbox/${gameId}/accounts/${account.platformId}/achievements`;

      const response = await fetch(achievementsUrl, {
        headers: {
          Authorization: `Bearer ${account.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        // Si l'API ne fonctionne pas, essayer l'API alternative
        return await this.syncAchievementsAlternative(
          account,
          gameId,
          existingAchievements
        );
      }

      const achievementsData: EpicAchievementsResponse = await response.json();

      if (
        !achievementsData.playerAchievements ||
        achievementsData.playerAchievements.length === 0
      ) {
        return this.createSuccessResult({
          achievements: [],
          mostRecentUnlock: undefined,
        });
      }

      // Mapper les achievements Epic Games vers notre format
      const achievements: AchievementData[] =
        achievementsData.playerAchievements.map((epicAch: EpicAchievement) => {
          const isUnlocked = !!epicAch.progress?.playerAward;
          const unlockedAt =
            isUnlocked && epicAch.progress.playerAward.awardedAt
              ? new Date(epicAch.progress.playerAward.awardedAt)
              : undefined;

          return {
            achievementId: epicAch.achievementName,
            name: epicAch.achievementName.replace(/([A-Z])/g, " $1").trim(), // Convertir camelCase en phrase
            description: undefined, // Epic ne fournit pas de description dans cette API
            iconUrl: undefined, // Nécessiterait une requête supplémentaire
            isUnlocked,
            unlockedAt,
            rarity: undefined,
            points: epicAch.XP || undefined,
          };
        });

      // Trouver le succès le plus récent parmi les nouveaux
      let mostRecentUnlock: Date | undefined;
      if (existingAchievements) {
        const newAchievements = achievements.filter(
          (ach) =>
            ach.isUnlocked && !existingAchievements.has(ach.achievementId)
        );

        if (newAchievements.length > 0) {
          mostRecentUnlock = newAchievements
            .filter((ach) => ach.unlockedAt)
            .reduce((latest, current) => {
              if (!latest || !current.unlockedAt)
                return latest || current.unlockedAt;
              return current.unlockedAt! > latest
                ? current.unlockedAt!
                : latest;
            }, undefined as Date | undefined);
        }
      }

      return this.createSuccessResult({
        achievements,
        mostRecentUnlock,
      });
    } catch (error) {
      return this.createErrorResult(
        `Failed to sync Epic Games achievements: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private async syncAchievementsAlternative(
    account: PlatformAccount,
    gameId: string,
    existingAchievements?: Set<string>
  ): Promise<
    SyncResult<{ achievements: AchievementData[]; mostRecentUnlock?: Date }>
  > {
    try {
      // API alternative pour les achievements Epic Games
      const achievementsUrl = `${this.baseUrl}/epic/stats/v1/stats/${account.platformId}/${gameId}/achievements`;

      const response = await fetch(achievementsUrl, {
        headers: {
          Authorization: `Bearer ${account.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.warn(
          `Epic Games achievements API not available for game ${gameId}: ${response.statusText}`
        );
        return this.createSuccessResult({
          achievements: [],
          mostRecentUnlock: undefined,
        });
      }

      const achievementsData = await response.json();
      const achievements: AchievementData[] = [];

      // Traiter les données selon le format de l'API alternative
      if (achievementsData && Array.isArray(achievementsData.achievements)) {
        for (const achievement of achievementsData.achievements) {
          achievements.push({
            achievementId: achievement.name || achievement.id,
            name: achievement.displayName || achievement.name,
            description: achievement.description,
            iconUrl: achievement.iconUrl,
            isUnlocked: achievement.unlocked || false,
            unlockedAt: achievement.unlockTime
              ? new Date(achievement.unlockTime)
              : undefined,
            rarity: achievement.rarity,
            points: achievement.gamerscore || achievement.xp,
          });
        }
      }

      // Trouver le succès le plus récent parmi les nouveaux
      let mostRecentUnlock: Date | undefined;
      if (existingAchievements) {
        const newAchievements = achievements.filter(
          (ach) =>
            ach.isUnlocked && !existingAchievements.has(ach.achievementId)
        );

        if (newAchievements.length > 0) {
          mostRecentUnlock = newAchievements
            .filter((ach) => ach.unlockedAt)
            .reduce((latest, current) => {
              if (!latest || !current.unlockedAt)
                return latest || current.unlockedAt;
              return current.unlockedAt! > latest
                ? current.unlockedAt!
                : latest;
            }, undefined as Date | undefined);
        }
      }

      return this.createSuccessResult({
        achievements,
        mostRecentUnlock,
      });
    } catch (error) {
      console.warn(
        `Failed to sync Epic Games achievements (alternative) for game ${gameId}:`,
        error
      );
      return this.createSuccessResult({
        achievements: [],
        mostRecentUnlock: undefined,
      });
    }
  }

  async getUserProfile(
    account: PlatformAccount
  ): Promise<SyncResult<UserProfile>> {
    if (!account.accessToken) {
      return this.createErrorResult("No access token available");
    }

    const result = await this.fetchUserProfile(account.accessToken);

    if (!result.success || !result.data) {
      return this.createErrorResult(
        result.error || "Failed to fetch user profile"
      );
    }

    const profile: UserProfile = {
      platformId: result.data.accountId,
      username: result.data.displayName,
      displayName: result.data.displayName,
      avatarUrl: undefined,
      profileUrl: undefined,
    };

    return this.createSuccessResult(profile);
  }

  validateCredentials(credentials: PlatformCredentials): boolean {
    const epicCredentials = credentials as unknown as EpicCredentials;
    return !!(epicCredentials.accessToken || epicCredentials.code);
  }

  async exchangeCodeForToken(
    code: string
  ): Promise<SyncResult<EpicAuthTokenResponse>> {
    try {
      const response = await fetch(`${this.authUrl}/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(
            `${this.clientId}:${this.clientSecret}`
          ).toString("base64")}`,
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: code,
          redirect_uri: `${
            useRuntimeConfig().public.baseUrl || "http://localhost:3000"
          }/api/user/library/platforms/epic/callback`,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return this.createErrorResult(
          `Epic Games token exchange error: ${response.statusText} - ${errorText}`
        );
      }

      const tokenData: EpicAuthTokenResponse = await response.json();
      console.log("Epic Games token exchange successful:", {
        has_access_token: !!tokenData.access_token,
        has_refresh_token: !!tokenData.refresh_token,
        has_account_id: !!tokenData.account_id,
        expires_in: tokenData.expires_in,
      });
      return this.createSuccessResult(tokenData);
    } catch (error) {
      return this.createErrorResult(
        `Failed to exchange Epic Games authorization code: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private async fetchUserProfile(
    accessToken: string
  ): Promise<SyncResult<EpicUserResponse>> {
    try {
      // Essayer d'abord l'API utilisateur standard
      let response = await fetch(
        `https://api.epicgames.dev/epic/id/v1/accounts`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Si l'API standard ne fonctionne pas, essayer l'API alternative
      if (!response.ok) {
        response = await fetch(
          `https://account-public-service-prod.ol.epicgames.com/account/api/public/account/me`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );
      }

      if (!response.ok) {
        console.warn(`Epic Games profile API error: ${response.statusText}`);
        return this.createErrorResult(
          `Epic Games profile API error: ${response.statusText}`
        );
      }

      const userData: EpicUserResponse = await response.json();

      // Si l'API retourne un tableau (comme certaines APIs Epic Games), prendre le premier élément
      if (Array.isArray(userData) && userData.length > 0) {
        return this.createSuccessResult(userData[0]);
      }

      return this.createSuccessResult(userData);
    } catch (error) {
      console.warn(
        `Failed to fetch Epic Games profile: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      return this.createErrorResult(
        `Failed to fetch Epic Games profile: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
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
}
