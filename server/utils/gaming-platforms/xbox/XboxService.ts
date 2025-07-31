import type { GamingPlatform, PlatformAccount } from "@prisma/client";
import type {
  UserProfile,
  GameData,
  AchievementData,
  PlatformCredentials,
  SyncResult,
} from "../base/types";
import type { XboxCredentials } from "./xbox-types";
import { authenticate } from "@xboxreplay/xboxlive-auth";

export class XboxService {
  readonly platform: GamingPlatform = "XBOX";

  async authenticate(
    credentials: PlatformCredentials
  ): Promise<SyncResult<UserProfile>> {
    try {
      if (!this.validateCredentials(credentials)) {
        return this.createErrorResult("Invalid Xbox credentials");
      }

      const xboxCredentials = credentials as unknown as XboxCredentials;

      // Utiliser @xboxreplay/xboxlive-auth pour l'authentification
      const xboxLiveAuth = await authenticate(
        xboxCredentials.email as `${string}@${string}.${string}`,
        xboxCredentials.password,
        {
          XSTSRelyingParty: "http://xboxlive.com",
          raw: false,
        }
      );

      if (!xboxLiveAuth) {
        return this.createErrorResult("Failed to authenticate with Xbox Live");
      }

      // Récupérer le profil utilisateur
      const profile = await this.fetchUserProfile(
        xboxLiveAuth.xsts_token,
        xboxLiveAuth.user_hash
      );

      if (!profile) {
        return this.createErrorResult("Failed to get user profile");
      }

      const userProfile: UserProfile = {
        platformId: profile.xuid,
        username: profile.gamertag,
        displayName: profile.displayName || profile.gamertag,
        avatarUrl: profile.displayPicRaw,
        profileUrl: `https://account.xbox.com/en-us/profile?gamertag=${profile.gamertag}`,
      };

      return this.createSuccessResult(userProfile);
    } catch (error) {
      return this.createErrorResult(
        `Xbox authentication failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async refreshToken(
    account: PlatformAccount
  ): Promise<SyncResult<PlatformAccount>> {
    try {
      // Pour Xbox, nous pourrions implémenter le rafraîchissement des tokens
      // mais pour l'instant, nous retournons le compte tel quel
      return this.createSuccessResult(account);
    } catch (error) {
      return this.createErrorResult(
        `Failed to refresh Xbox token: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async syncGames(account: PlatformAccount): Promise<SyncResult<GameData[]>> {
    try {
      // Récupérer le token XSTS depuis les données du compte
      const xstsToken = account.accessToken;
      const userHash = account.refreshToken; // Nous stockons le userHash dans refreshToken

      if (!xstsToken || !userHash) {
        return this.createErrorResult(
          "No access tokens found for Xbox account"
        );
      }

      // Appel à l'API Xbox Live pour récupérer l'historique des titres
      const titleHistory = await this.fetchTitleHistory(
        account.platformId,
        xstsToken,
        userHash
      );

      if (!titleHistory || !titleHistory.titles) {
        return this.createErrorResult("Failed to fetch Xbox title history");
      }

      const games: GameData[] = titleHistory.titles.map((title: any) => ({
        platformGameId: title.titleId.toString(),
        name: title.name,
        playtimeTotal: this.calculatePlaytime(title.stats),
        playtimeRecent: undefined, // Xbox API ne fournit pas cette info directement
        lastPlayed: title.titleHistory?.lastTimePlayed
          ? new Date(title.titleHistory.lastTimePlayed)
          : undefined,
        iconUrl:
          title.displayImage ||
          title.images?.find((img: any) => img.imageType === "Logo")?.url,
        coverUrl:
          title.displayImage ||
          title.images?.find((img: any) => img.imageType === "Poster")?.url,
        isInstalled: false, // Information non disponible via l'API
      }));

      return this.createSuccessResult(games);
    } catch (error) {
      return this.createErrorResult(
        `Failed to sync Xbox games: ${
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
      const xstsToken = account.accessToken;
      const userHash = account.refreshToken;

      if (!xstsToken || !userHash) {
        return this.createErrorResult(
          "No access tokens found for Xbox account"
        );
      }

      // Appel à l'API Xbox Live pour récupérer les succès
      const achievementsData = await this.fetchAchievements(
        account.platformId,
        gameId,
        xstsToken,
        userHash
      );

      if (!achievementsData || !achievementsData.achievements) {
        return this.createErrorResult("Failed to fetch Xbox achievements");
      }

      const achievements: AchievementData[] = achievementsData.achievements.map(
        (achievement: any) => ({
          achievementId: achievement.id,
          name: achievement.name,
          description: achievement.description || achievement.lockedDescription,
          iconUrl: achievement.mediaAssets?.find(
            (asset: any) => asset.type === "Icon"
          )?.url,
          isUnlocked: achievement.progressState === "Achieved",
          unlockedAt: achievement.progression?.timeUnlocked
            ? new Date(achievement.progression.timeUnlocked)
            : undefined,
          rarity: achievement.rarity?.currentPercentage,
          points: parseInt(
            achievement.rewards?.find(
              (reward: any) => reward.type === "Gamerscore"
            )?.value || "0"
          ),
        })
      );

      return this.createSuccessResult(achievements);
    } catch (error) {
      return this.createErrorResult(
        `Failed to sync Xbox achievements: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async getUserProfile(
    account: PlatformAccount
  ): Promise<SyncResult<UserProfile>> {
    try {
      const xstsToken = account.accessToken;
      const userHash = account.refreshToken;

      if (!xstsToken || !userHash) {
        // Retourner le profil basé sur les données du compte
        const profile: UserProfile = {
          platformId: account.platformId,
          username: account.username || account.platformId,
          displayName:
            account.displayName || account.username || account.platformId,
          avatarUrl: account.avatarUrl || undefined,
          profileUrl:
            account.profileUrl ||
            `https://account.xbox.com/en-us/profile?gamertag=${account.username}`,
        };
        return this.createSuccessResult(profile);
      }

      // Récupérer le profil à jour depuis Xbox Live
      const profileData = await this.fetchUserProfile(xstsToken, userHash);
      if (!profileData) {
        return this.createErrorResult("Failed to fetch updated Xbox profile");
      }

      const profile: UserProfile = {
        platformId: profileData.xuid,
        username: profileData.gamertag,
        displayName: profileData.displayName || profileData.gamertag,
        avatarUrl: profileData.displayPicRaw,
        profileUrl: `https://account.xbox.com/en-us/profile?gamertag=${profileData.gamertag}`,
      };

      return this.createSuccessResult(profile);
    } catch (error) {
      return this.createErrorResult(
        `Failed to fetch Xbox profile: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  validateCredentials(credentials: PlatformCredentials): boolean {
    const xboxCredentials = credentials as unknown as XboxCredentials;
    return !!(
      xboxCredentials.email &&
      xboxCredentials.password &&
      typeof xboxCredentials.email === "string" &&
      typeof xboxCredentials.password === "string" &&
      xboxCredentials.email.includes("@") &&
      xboxCredentials.password.length > 0
    );
  }

  // Méthodes privées pour les appels API Xbox Live
  private async fetchUserProfile(
    xstsToken: string,
    userHash: string
  ): Promise<any | null> {
    try {
      const response = await fetch(
        `https://profile.xboxlive.com/users/me/profile/settings?settings=GameDisplayName,AppDisplayName,AppDisplayPicRaw,Gamerscore,Gamertag,PublicGamerpic,XboxOneRep,PreferredColor,RealName,Bio,Location`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-xbl-contract-version": "3",
            Authorization: `XBL3.0 x=${userHash};${xstsToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to fetch Xbox profile:", errorText);
        return null;
      }

      const data = await response.json();
      const profileUser = data.profileUsers[0];

      // Transformer les données du profil Xbox en format utilisable
      const settings = profileUser.settings.reduce((acc: any, setting: any) => {
        acc[setting.id] = setting.value;
        return acc;
      }, {});

      return {
        xuid: profileUser.id,
        gamertag: settings.Gamertag,
        displayName: settings.GameDisplayName || settings.Gamertag,
        displayPicRaw: settings.AppDisplayPicRaw || settings.PublicGamerpic,
        gamerscore: settings.Gamerscore,
        realName: settings.RealName,
        bio: settings.Bio,
        location: settings.Location,
      };
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      return null;
    }
  }

  private async fetchTitleHistory(
    xuid: string,
    xstsToken: string,
    userHash: string
  ): Promise<any | null> {
    try {
      const response = await fetch(
        `https://titlehub.xboxlive.com/users/xuid(${xuid})/titles/titlehistory/decoration/detail,image,stats,scid`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-xbl-contract-version": "2",
            "Accept-Language": "fr-FR",
            Authorization: `XBL3.0 x=${userHash};${xstsToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to fetch title history:", errorText);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to fetch title history:", error);
      return null;
    }
  }

  private async fetchAchievements(
    xuid: string,
    titleId: string,
    xstsToken: string,
    userHash: string
  ): Promise<any | null> {
    try {
      const response = await fetch(
        `https://achievements.xboxlive.com/users/xuid(${xuid})/achievements?titleId=${titleId}&maxItems=1000`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-xbl-contract-version": "2",
            "Accept-Language": "fr-FR",
            Authorization: `XBL3.0 x=${userHash};${xstsToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to fetch achievements:", errorText);
        return null;
      }
      console.log(await response.json());
      return;
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch achievements:", error);
      return null;
    }
  }

  private calculatePlaytime(stats: any): number {
    if (!stats || !Array.isArray(stats)) {
      return 0;
    }

    // Chercher une statistique de temps de jeu
    const playtimeStat = stats.find(
      (stat: any) =>
        stat.name &&
        (stat.name.toLowerCase().includes("playtime") ||
          stat.name.toLowerCase().includes("time") ||
          stat.name.toLowerCase().includes("hours"))
    );

    if (playtimeStat && playtimeStat.value) {
      // Convertir en minutes si nécessaire
      const value = parseInt(playtimeStat.value) || 0;
      // Supposer que la valeur est en heures et convertir en minutes
      return value * 60;
    }

    return 0;
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
