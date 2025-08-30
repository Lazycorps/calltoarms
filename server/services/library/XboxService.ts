/* eslint-disable @typescript-eslint/no-explicit-any */
import type { GamingPlatform, PlatformAccount } from "@prisma/client";
import type {
  GameData,
  AchievementData,
  SyncResult,
} from "@@/server/types/library/base";
import prisma from "~~/lib/prisma";
interface XboxTokens {
  userHash: string;
  xuid: string;
  xstsToken: string;
  xstsTokenExpiry: string;
  msAccessToken: string;
  msTokenExpiry: string;
  refreshToken: string;
}

export class XboxService {
  readonly platform: GamingPlatform = "XBOX";
  async syncGames(
    account: PlatformAccount,
    tokens: XboxTokens
  ): Promise<SyncResult<GameData[]>> {
    try {
      if (!tokens.xstsToken || !tokens.userHash) {
        return this.createErrorResult(
          "No access tokens found for Xbox account"
        );
      }

      // Appel à l'API Xbox Live pour récupérer l'historique des titres
      const titleHistory = await this.fetchTitleHistory(
        account.platformId,
        tokens.xstsToken,
        tokens.userHash
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

        const skipNonXboxGame = title.devices[0] == "Win32";
        if (isntPlayedSinceLastSyncro || skipNonXboxGame) continue;
        const gameStats = await this.fetchGameStats(
          account.platformId,
          title.serviceConfigId,
          tokens.xstsToken,
          tokens.userHash
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
    tokens: XboxTokens,
    gameId: string
  ): Promise<SyncResult<AchievementData[]>> {
    try {
      if (!tokens.xstsToken || !tokens.userHash) {
        return this.createErrorResult(
          "No access tokens found for Xbox account"
        );
      }

      // Appel à l'API Xbox Live pour récupérer les succès
      const achievementsData = await this.fetchAchievements(
        account.platformId,
        gameId,
        tokens.xstsToken,
        tokens.userHash
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
    const config = useRuntimeConfig();

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
            Origin: config.baseUrl,
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
      const config = useRuntimeConfig();

      const response = await fetch(
        `https://achievements.xboxlive.com/users/xuid(${xuid})/achievements?titleId=${titleId}&maxItems=1000`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-xbl-contract-version": "2",
            "Accept-Language": "fr-FR",
            Authorization: `XBL3.0 x=${userHash};${xstsToken}`,
            Origin: config.baseUrl,
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

  public async refreshXboxTokens(
    tokens: XboxTokens,
    accountId: number
  ): Promise<XboxTokens> {
    const config = useRuntimeConfig();

    try {
      // Vérifier que nous avons bien un refresh token
      if (!tokens.refreshToken) {
        throw createError({
          statusCode: 400,
          statusMessage: "Refresh token manquant",
        });
      }

      // 1. Préparer le body pour le refresh token
      const msTokenBody = {
        client_id: config.microsoftClientId,
        // PAS de client_secret pour public client
        refresh_token: tokens.refreshToken,
        grant_type: "refresh_token",
        scope: "XboxLive.signin offline_access",
      };

      // Convertir en URLSearchParams
      const bodyParams = new URLSearchParams(msTokenBody);
      // Faire la requête avec gestion d'erreur détaillée
      const msTokenResponse = await fetch(
        "https://login.microsoftonline.com/consumers/oauth2/v2.0/token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
            Origin: config.baseUrl,
          },
          body: bodyParams.toString(),
        }
      );

      // Lire la réponse
      const responseText = await msTokenResponse.text();

      if (!msTokenResponse.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { error: "unknown", error_description: responseText };
        }

        // Analyser le type d'erreur
        if (errorData.error === "invalid_grant") {
          // Le refresh token est expiré ou invalide
          throw createError({
            statusCode: 401,
            statusMessage:
              "Session expirée. Le refresh token n'est plus valide. Veuillez vous reconnecter.",
          });
        } else if (errorData.error === "invalid_request") {
          // Problème avec les paramètres
          throw createError({
            statusCode: 400,
            statusMessage: `Erreur de requête: ${
              errorData.error_description || "Paramètres invalides"
            }`,
          });
        } else if (errorData.error === "invalid_client") {
          // Problème avec le client_id
          throw createError({
            statusCode: 400,
            statusMessage:
              "Configuration client invalide. Vérifiez le client_id.",
          });
        }

        throw createError({
          statusCode: msTokenResponse.status,
          statusMessage:
            errorData.error_description || "Erreur lors du refresh token",
        });
      }

      // Parser la réponse JSON
      const tokenData = JSON.parse(responseText);

      // 2. Obtenir un nouveau token Xbox Live User
      const xblUserTokenResponse = await $fetch<any>(
        "https://user.auth.xboxlive.com/user/authenticate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Origin: config.baseUrl,
          },
          body: {
            RelyingParty: "http://auth.xboxlive.com",
            TokenType: "JWT",
            Properties: {
              AuthMethod: "RPS",
              SiteName: "user.auth.xboxlive.com",
              RpsTicket: `d=${tokenData.access_token}`,
            },
          },
        }
      ).catch((error) => {
        console.error("Erreur Xbox Live User Token:", error.data || error);
        throw error;
      });

      // 3. Obtenir un nouveau token XSTS
      const xstsTokenResponse = await $fetch<any>(
        "https://xsts.auth.xboxlive.com/xsts/authorize",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Origin: config.baseUrl,
          },
          body: {
            RelyingParty: "http://xboxlive.com",
            TokenType: "JWT",
            Properties: {
              UserTokens: [xblUserTokenResponse.Token],
              SandboxId: "RETAIL",
            },
          },
        }
      ).catch((error) => {
        console.error("Erreur XSTS Token:", error.data || error);
        throw error;
      });

      // Construire les nouveaux tokens
      const newTokens: XboxTokens = {
        userHash: xstsTokenResponse.DisplayClaims.xui[0].uhs,
        xuid: xstsTokenResponse.DisplayClaims.xui[0].xid,
        xstsToken: xstsTokenResponse.Token,
        xstsTokenExpiry: new Date(Date.now() + 3600 * 1000).toISOString(),
        msAccessToken: tokenData.access_token,
        msTokenExpiry: new Date(
          Date.now() + tokenData.expires_in * 1000
        ).toISOString(),
        // Microsoft peut ou non retourner un nouveau refresh token
        refreshToken: tokenData.refresh_token || tokens.refreshToken,
      };

      // 4. Mettre à jour les tokens en base de données
      await prisma.platformAccount.update({
        where: { id: accountId },
        data: {
          accessToken: newTokens.xstsToken,
          refreshToken: newTokens.refreshToken,
          lastSync: new Date(),
          metadata: {
            userHash: newTokens.userHash,
            xuid: newTokens.xuid,
            msAccessToken: newTokens.msAccessToken,
            xblUserToken: xblUserTokenResponse.Token,
            msTokenExpiry: newTokens.msTokenExpiry,
            xstsTokenExpiry: newTokens.xstsTokenExpiry,
            lastTokenRefresh: new Date().toISOString(),
          },
        },
      });

      return newTokens;
    } catch (error: any) {
      console.error("=== ERREUR REFRESH TOKENS ===");
      console.error("Erreur complète:", error);
      // Relancer l'erreur
      throw error;
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
