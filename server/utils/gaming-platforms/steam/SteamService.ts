import type { GamingPlatform, PlatformAccount } from "@prisma/client";
import type {
  UserProfile,
  GameData,
  AchievementData,
  PlatformCredentials,
  SyncResult,
} from "../base/types";
import type {
  SteamCredentials,
  SteamApiResponse,
  SteamPlayersResponse,
  SteamGamesResponse,
  SteamAchievementsResponse,
  SteamGameSchemaResponse,
  SteamUserProfile,
  SteamGame,
  SteamAchievement,
} from "./steam-types";

export class SteamService {
  readonly platform: GamingPlatform = "STEAM";
  private readonly baseUrl = "https://api.steampowered.com";
  private readonly apiKey: string;

  constructor() {
    const config = useRuntimeConfig();
    this.apiKey = config.steamApiKey;

    if (!this.apiKey) {
      throw new Error("Steam API key is required");
    }
  }

  async authenticate(
    credentials: PlatformCredentials
  ): Promise<SyncResult<UserProfile>> {
    try {
      if (!this.validateCredentials(credentials)) {
        return this.createErrorResult("Invalid Steam credentials");
      }

      const steamCredentials = credentials as unknown as SteamCredentials;
      const profileResult = await this.fetchUserProfile(
        steamCredentials.steamId
      );

      if (!profileResult.success || !profileResult.data) {
        return this.createErrorResult(
          profileResult.error || "Failed to fetch Steam profile"
        );
      }
      const profile: UserProfile = {
        platformId: profileResult.data.steamid,
        username: profileResult.data.personaname,
        displayName: profileResult.data.personaname,
        avatarUrl: profileResult.data.avatarfull,
        profileUrl: profileResult.data.profileurl,
      };

      return this.createSuccessResult(profile);
    } catch (error) {
      return this.createErrorResult(
        `Steam authentication failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async refreshToken(
    account: PlatformAccount
  ): Promise<SyncResult<PlatformAccount>> {
    // Steam n'utilise pas de tokens d'actualisation, on retourne le compte tel quel
    return this.createSuccessResult(account);
  }

  async syncGames(account: PlatformAccount): Promise<SyncResult<GameData[]>> {
    try {
      const url = `${this.baseUrl}/IPlayerService/GetOwnedGames/v0001/?key=${this.apiKey}&steamid=${account.platformId}&format=json&include_appinfo=true&include_played_free_games=true`;

      const response = await fetch(url);
      if (!response.ok) {
        return this.createErrorResult(
          `Steam API error: ${response.statusText}`
        );
      }

      const data: SteamApiResponse<SteamGamesResponse> = await response.json();

      if (!data.response.games) {
        return this.createSuccessResult([]);
      }

      const syncDate = new Date();
      const games: GameData[] = data.response.games.map((game: SteamGame) => {
        let lastPlayed = game.rtime_last_played
          ? new Date(game.rtime_last_played * 1000)
          : undefined;

        // Si pas de lastPlayed mais que le jeu a été joué dans les 2 dernières semaines
        if (!lastPlayed && game.playtime_2weeks && game.playtime_2weeks > 0) {
          lastPlayed = syncDate;
        }

        return {
          platformGameId: game.appid.toString(),
          name: game.name,
          playtimeTotal: game.playtime_forever,
          playtimeRecent: game.playtime_2weeks,
          lastPlayed,
          iconUrl: game.img_icon_url
            ? `https://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_icon_url}.jpg`
            : undefined,
          coverUrl: `https://steamcdn-a.akamaihd.net/steam/apps/${game.appid}/header.jpg`,
          isInstalled: false, // Steam API ne fournit pas cette information
        };
      });

      return this.createSuccessResult(games);
    } catch (error) {
      return this.createErrorResult(
        `Failed to sync Steam games: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
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
      // D'abord, récupérer le schéma du jeu pour obtenir les informations des succès
      const schemaUrl = `${this.baseUrl}/ISteamUserStats/GetSchemaForGame/v2/?key=${this.apiKey}&appid=${gameId}`;
      const schemaResponse = await fetch(schemaUrl);

      if (!schemaResponse.ok) {
        return this.createErrorResult(
          `Steam schema API error: ${schemaResponse.statusText}`
        );
      }

      const schemaData: SteamGameSchemaResponse = await schemaResponse.json();

      if (!schemaData.game?.availableGameStats?.achievements) {
        return this.createSuccessResult({
          achievements: [],
          mostRecentUnlock: undefined,
        });
      }

      // Ensuite, récupérer les succès du joueur
      const achievementsUrl = `${this.baseUrl}/ISteamUserStats/GetPlayerAchievements/v0001/?appid=${gameId}&key=${this.apiKey}&steamid=${account.platformId}`;
      const achievementsResponse = await fetch(achievementsUrl);

      if (!achievementsResponse.ok) {
        return this.createErrorResult(
          `Steam achievements API error: ${achievementsResponse.statusText}`
        );
      }

      const achievementsData: SteamAchievementsResponse =
        await achievementsResponse.json();

      if (
        !achievementsData.playerstats?.success ||
        !achievementsData.playerstats.achievements
      ) {
        return this.createSuccessResult({
          achievements: [],
          mostRecentUnlock: undefined,
        });
      }

      // Combiner les données du schéma avec les données du joueur
      const achievements: AchievementData[] =
        achievementsData.playerstats.achievements.map(
          (achievement: SteamAchievement) => {
            const schemaAchievement =
              schemaData.game.availableGameStats.achievements.find(
                (a) => a.name === achievement.apiname
              );

            return {
              achievementId: achievement.apiname,
              name:
                schemaAchievement?.displayName ||
                achievement.name ||
                achievement.apiname,
              description:
                schemaAchievement?.description || achievement.description,
              iconUrl: schemaAchievement?.icon,
              isUnlocked: achievement.achieved === 1,
              unlockedAt:
                achievement.achieved === 1 && achievement.unlocktime > 0
                  ? new Date(achievement.unlocktime * 1000)
                  : undefined,
              rarity: undefined, // Steam ne fournit pas directement la rareté
              points: undefined, // Steam ne fournit pas de points pour les succès
            };
          }
        );

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

      return this.createSuccessResult({ achievements, mostRecentUnlock });
    } catch (error) {
      return this.createErrorResult(
        `Failed to sync Steam achievements: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async getUserProfile(
    account: PlatformAccount
  ): Promise<SyncResult<UserProfile>> {
    const result = await this.fetchUserProfile(account.platformId);

    if (!result.success || !result.data) {
      return this.createErrorResult(
        result.error || "Failed to fetch user profile"
      );
    }

    const profile: UserProfile = {
      platformId: result.data.steamid,
      username: result.data.personaname,
      displayName: result.data.personaname,
      avatarUrl: result.data.avatarfull,
      profileUrl: result.data.profileurl,
    };

    return this.createSuccessResult(profile);
  }

  validateCredentials(credentials: PlatformCredentials): boolean {
    const steamCredentials = credentials as unknown as SteamCredentials;
    return !!(
      steamCredentials.steamId &&
      typeof steamCredentials.steamId === "string" &&
      /^\d{17}$/.test(steamCredentials.steamId)
    );
  }

  private async fetchUserProfile(
    steamId: string
  ): Promise<SyncResult<SteamUserProfile>> {
    try {
      const url = `${this.baseUrl}/ISteamUser/GetPlayerSummaries/v0002/?key=${this.apiKey}&steamids=${steamId}`;

      const response = await fetch(url);
      if (!response.ok) {
        return this.createErrorResult(
          `Steam API error: ${response.statusText}`
        );
      }

      const data: SteamApiResponse<SteamPlayersResponse> =
        await response.json();

      if (!data.response.players || data.response.players.length === 0) {
        return this.createErrorResult("Steam user not found");
      }

      const player = data.response.players[0];
      // Retourner directement les données de l'API Steam
      const profile: SteamUserProfile = player;

      return this.createSuccessResult(profile);
    } catch (error) {
      return this.createErrorResult(
        `Failed to fetch Steam profile: ${
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
