/* eslint-disable @typescript-eslint/no-explicit-any */
import type { GamingPlatform, PlatformAccount } from "@prisma/client";
import type { GameData, AchievementData, SyncResult } from "../base/types";

export class XboxService {
  readonly platform: GamingPlatform = "XBOX";
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

      const games: GameData[] = [];

      // Pour chaque jeu, récupérer les statistiques séparément
      for (const title of titleHistory.titles) {
        const isntPlayedSinceLastSyncro =
          account.lastSync &&
          (!title.titleHistory.lastTimePlayed ||
            new Date(title.titleHistory.lastTimePlayed) < account.lastSync);
        if (isntPlayedSinceLastSyncro) continue;

        const gameStats = await this.fetchGameStats(
          account.platformId,
          title.serviceConfigId,
          xstsToken,
          userHash
        );

        const playtimeTotal = this.calculatePlaytimeFromStats(gameStats);

        games.push({
          platformGameId: title.titleId.toString(),
          name: title.name,
          playtimeTotal,
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
        });
      }

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
        displayPicRaw: settings.PublicGamerpic,
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
        `https://titlehub.xboxlive.com/users/xuid(${xuid})/titles/titlehistory/decoration/detail,image,scid`,
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

  private async fetchGameStats(
    xuid: string,
    scid: string,
    xstsToken: string,
    userHash: string
  ): Promise<any | null> {
    try {
      const response = await fetch(
        `https://userstats.xboxlive.com/users/xuid(${xuid})/scids/${scid}/stats/wins,kills,kdratio,headshots,playtime,minutesPlayed,gameTime,timePlayed`,
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
        // Si l'API stats n'est pas disponible pour ce jeu, on retourne null sans erreur
        return null;
      }

      return await response.json();
    } catch {
      // Ignorer les erreurs de stats car tous les jeux n'ont pas de statistiques
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

      return await response.json();
    } catch (error) {
      console.error("Failed to fetch achievements:", error);
      return null;
    }
  }

  private calculatePlaytimeFromStats(gameStats: any): number {
    if (!gameStats || !gameStats.statlistscollection) {
      return 0;
    }

    // Parcourir les collections de statistiques
    for (const statCollection of gameStats.statlistscollection) {
      if (!statCollection.stats) continue;

      // Chercher des statistiques de temps de jeu
      for (const stat of statCollection.stats) {
        // Chercher différents types de statistiques de temps
        if (
          stat.name.includes("playtime") ||
          stat.name.includes("timePlayed") ||
          stat.name.includes("hoursPlayed") ||
          stat.name.includes("minutesPlayed") ||
          stat.name.includes("totalTime") ||
          stat.name.includes("gameTime")
        ) {
          const value = parseFloat(stat.value) || 0;

          // Convertir en minutes selon le type de statistique
          if (stat.name.includes("hours")) {
            return Math.round(value * 60); // Heures vers minutes
          } else {
            return Math.round(value); // Déjà en minutes
          }
        }
      }
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
