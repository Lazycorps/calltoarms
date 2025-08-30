import type { GamingPlatform, PlatformAccount } from "@prisma/client";
import type {
  UserProfile,
  GameData,
  PlatformCredentials,
  SyncResult,
} from "~~/server/types/library/base";
import type {
  RiotCredentials,
  RiotAccount,
  RiotSummoner,
  RiotMatch,
  RiotParticipant,
  TftMatch,
  TftParticipant,
  ValorantMatch,
  ValorantPlayer,
  LoRMatch,
} from "~~/server/types/library/riotSync";

export class RiotService {
  readonly platform: GamingPlatform = "RIOT";
  private readonly apiKey: string;
  private requestCount = 0;
  private lastRequestTime = 0;

  // URLs de base pour les différentes régions
  private readonly baseUrls = {
    // Account API (continental routing)
    account: {
      americas: "https://americas.api.riotgames.com",
      asia: "https://asia.api.riotgames.com",
      europe: "https://europe.api.riotgames.com",
      esports: "https://esports.api.riotgames.com",
    } as Record<string, string>,
    // League of Legends API (platform routing)
    lol: {
      br1: "https://br1.api.riotgames.com",
      eun1: "https://eun1.api.riotgames.com",
      europe: "https://euw1.api.riotgames.com",
      jp1: "https://jp1.api.riotgames.com",
      kr: "https://kr.api.riotgames.com",
      la1: "https://la1.api.riotgames.com",
      la2: "https://la2.api.riotgames.com",
      na1: "https://na1.api.riotgames.com",
      oc1: "https://oc1.api.riotgames.com",
      ph2: "https://ph2.api.riotgames.com",
      sg2: "https://sg2.api.riotgames.com",
      th2: "https://th2.api.riotgames.com",
      tr1: "https://tr1.api.riotgames.com",
      tw2: "https://tw2.api.riotgames.com",
      vn2: "https://vn2.api.riotgames.com",
      ru: "https://ru.api.riotgames.com",
    } as Record<string, string>,
    // VALORANT API
    valorant: {
      ap: "https://ap.api.riotgames.com",
      br: "https://br.api.riotgames.com",
      eu: "https://eu.api.riotgames.com",
      kr: "https://kr.api.riotgames.com",
      latam: "https://latam.api.riotgames.com",
      na: "https://na.api.riotgames.com",
    } as Record<string, string>,
  };

  // Mapping platform -> continental pour League of Legends
  private readonly platformToContinental: Record<string, string> = {
    br1: "americas",
    na1: "americas",
    la1: "americas",
    la2: "americas",
    euw1: "europe",
    eun1: "europe",
    tr1: "europe",
    ru: "europe",
    kr: "asia",
    jp1: "asia",
    oc1: "sea",
    ph2: "sea",
    sg2: "sea",
    th2: "sea",
    tw2: "sea",
    vn2: "sea",
  };

  constructor() {
    const config = useRuntimeConfig();
    this.apiKey = config.riotApiKey;

    if (!this.apiKey) {
      throw new Error("Riot API key is required");
    }
  }

  async authenticate(
    credentials: PlatformCredentials
  ): Promise<SyncResult<UserProfile>> {
    try {
      if (!this.validateCredentials(credentials)) {
        return this.createErrorResult(
          "Invalid Riot credentials format. Use: GameName#TagLine"
        );
      }

      const riotCredentials = credentials as unknown as RiotCredentials;
      const accountResult = await this.fetchRiotAccount(riotCredentials);

      if (!accountResult.success || !accountResult.data) {
        return this.createErrorResult(
          accountResult.error || "Failed to fetch Riot account"
        );
      }

      const profile: UserProfile = {
        platformId: accountResult.data.puuid,
        username: `${accountResult.data.gameName}#${accountResult.data.tagLine}`,
        displayName: accountResult.data.gameName,
      };

      return this.createSuccessResult(profile);
    } catch (error) {
      return this.createErrorResult(
        `Riot authentication failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async refreshToken(
    account: PlatformAccount
  ): Promise<SyncResult<PlatformAccount>> {
    // Riot utilise des clés API fixes, pas de tokens à rafraîchir
    return this.createSuccessResult(account);
  }

  async syncGames(account: PlatformAccount): Promise<SyncResult<GameData[]>> {
    try {
      const games: GameData[] = [];

      // Synchroniser League of Legends
      console.log("[Riot] Syncing League of Legends...");
      const lolData = await this.syncLeagueOfLegends(account);
      if (lolData.success && lolData.data) {
        games.push(lolData.data);
      } else {
        console.warn("[Riot] LoL sync failed:", lolData.error);
      }

      // Synchroniser Teamfight Tactics
      console.log("[Riot] Syncing Teamfight Tactics...");
      const tftData = await this.syncTeamfightTactics(account);
      if (tftData.success && tftData.data) {
        games.push(tftData.data);
      } else {
        console.warn("[Riot] TFT sync failed:", tftData.error);
      }

      // Synchroniser VALORANT (nécessite clé de production)
      console.log("[Riot] Syncing VALORANT...");
      const valorantData = await this.syncValorant(account);
      if (valorantData.success && valorantData.data) {
        games.push(valorantData.data);
      } else {
        console.warn("[Riot] VALORANT sync failed:", valorantData.error);
      }

      // Synchroniser Legends of Runeterra
      console.log("[Riot] Syncing Legends of Runeterra...");
      const lorData = await this.syncLegendsOfRuneterra(account);
      if (lorData.success && lorData.data) {
        games.push(lorData.data);
      } else {
        console.warn("[Riot] LoR sync failed:", lorData.error);
      }

      return this.createSuccessResult(games);
    } catch (error) {
      return this.createErrorResult(
        `Failed to sync Riot games: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async getUserProfile(
    account: PlatformAccount
  ): Promise<SyncResult<UserProfile>> {
    try {
      const credentials = account.metadata as unknown as RiotCredentials;
      const region = this.getContinentalRegion(credentials?.region || "na1");

      const accountUrl = `${this.baseUrls.account[region]}/riot/account/v1/accounts/by-puuid/${account.platformId}`;

      const response = await this.makeApiRequest(accountUrl);
      if (!response.success || !response.data) {
        return this.createErrorResult(
          response.error || "Failed to fetch user profile"
        );
      }

      const accountData = response.data as RiotAccount;

      const profile: UserProfile = {
        platformId: accountData.puuid,
        username: `${accountData.gameName}#${accountData.tagLine}`,
        displayName: accountData.gameName,
      };

      return this.createSuccessResult(profile);
    } catch (error) {
      return this.createErrorResult(
        `Failed to get Riot profile: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  validateCredentials(credentials: PlatformCredentials): boolean {
    const riotCredentials = credentials as unknown as RiotCredentials;
    return !!(
      (
        riotCredentials.riotId &&
        typeof riotCredentials.riotId === "string" &&
        /^.+#.+$/.test(riotCredentials.riotId)
      ) // Format: GameName#TagLine
    );
  }

  private async fetchRiotAccount(
    credentials: RiotCredentials
  ): Promise<SyncResult<RiotAccount>> {
    try {
      const [gameName, tagLine] = credentials.riotId.split("#");
      if (!gameName || !tagLine) {
        return this.createErrorResult(
          "Invalid Riot ID format. Use: GameName#TagLine"
        );
      }

      // Déterminer la région continentale basée sur la région du serveur
      const continentalRegion = this.getContinentalRegion(
        credentials.region || "na1"
      );

      const url = `${
        this.baseUrls.account[continentalRegion]
      }/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(
        gameName
      )}/${encodeURIComponent(tagLine)}`;

      console.log(
        `[Riot] Fetching account: ${gameName}#${tagLine} from ${continentalRegion}`
      );

      const response = await this.makeApiRequest(url);
      if (!response.success || !response.data) {
        return this.createErrorResult(
          response.error || "Riot account not found"
        );
      }

      // Sauvegarder la région dans les metadata si elle n'existe pas
      if (!credentials.region && response.data) {
        credentials.region = credentials.region || "na1";
      }

      return this.createSuccessResult(response.data as RiotAccount);
    } catch (error) {
      return this.createErrorResult(
        `Failed to fetch Riot account: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private async syncLeagueOfLegends(
    account: PlatformAccount
  ): Promise<SyncResult<GameData>> {
    try {
      const credentials = account.metadata as unknown as RiotCredentials;
      const platformRegion = credentials?.region || "na1";

      // Récupérer les informations du summoner
      const summonerUrl = `${this.baseUrls.lol[platformRegion]}/lol/summoner/v4/summoners/by-puuid/${account.platformId}`;
      const summonerResponse = await this.makeApiRequest(summonerUrl);

      if (!summonerResponse.success) {
        // Le joueur n'a peut-être jamais joué à LoL
        return this.createErrorResult(
          "No League of Legends data found for this account"
        );
      }

      const summoner = summonerResponse.data as RiotSummoner;

      // Récupérer l'historique des matchs (utilise les URLs continentales)
      const matchListUrl = `${this.baseUrls.account[platformRegion]}/lol/match/v5/matches/by-puuid/${account.platformId}/ids?start=0&count=20`;
      const matchListResponse = await this.makeApiRequest(matchListUrl);

      if (!matchListResponse.success || !matchListResponse.data) {
        // Pas de matchs trouvés
        const gameData: GameData = {
          platformGameId: "league-of-legends",
          name: "League of Legends",
          playtimeTotal: 0,
          lastPlayed: undefined,
          iconUrl: `https://ddragon.leagueoflegends.com/cdn/14.1.1/img/profileicon/${summoner.profileIconId}.png`,
          coverUrl:
            "https://gaming-cdn.com/images/products/9456/orig/league-of-legends-pc-jeu-cover.jpg",
          isInstalled: false,
        };
        return this.createSuccessResult(gameData);
      }

      const matchIds = matchListResponse.data as string[];

      let totalPlaytime = 0;
      let lastPlayed: Date | undefined;
      let matchesAnalyzed = 0;

      // Analyser les matchs récents pour calculer le temps de jeu
      for (const matchId of matchIds.slice(0, 10)) {
        // Limiter pour éviter les rate limits
        await this.enforceRateLimit();

        const matchUrl = `${this.baseUrls.account[platformRegion]}/lol/match/v5/matches/${matchId}`;
        const matchResponse = await this.makeApiRequest(matchUrl);

        if (matchResponse.success && matchResponse.data) {
          const match = matchResponse.data as RiotMatch;

          // Trouver le participant
          const participant = match.info?.participants?.find(
            (p: RiotParticipant) => p.puuid === account.platformId
          );

          if (participant && match.info) {
            // Calculer la durée en minutes
            let duration = 0;
            if (match.info.gameDuration) {
              // Pour les matchs récents, gameDuration est en secondes
              duration =
                match.info.gameDuration < 10000
                  ? Math.round(match.info.gameDuration / 60) // Si < 10000, c'est déjà en secondes
                  : Math.round(match.info.gameDuration / 1000 / 60); // Sinon c'est en millisecondes
            } else if (match.info.gameEndTimestamp && match.info.gameCreation) {
              // Calculer depuis les timestamps
              duration = Math.round(
                (match.info.gameEndTimestamp - match.info.gameCreation) /
                  1000 /
                  60
              );
            }

            totalPlaytime += duration;
            matchesAnalyzed++;

            // Déterminer la date du match
            const matchDate = new Date(
              match.info.gameEndTimestamp || match.info.gameCreation
            );
            if (!lastPlayed || matchDate > lastPlayed) {
              lastPlayed = matchDate;
            }
          }
        }
      }

      // Estimer le temps total basé sur l'échantillon
      if (matchesAnalyzed > 0 && matchIds.length > matchesAnalyzed) {
        const averageMatchDuration = totalPlaytime / matchesAnalyzed;
        totalPlaytime = Math.round(averageMatchDuration * matchIds.length);
      }

      const gameData: GameData = {
        platformGameId: "league-of-legends",
        name: "League of Legends",
        playtimeTotal: this.estimateFromLevel(summoner.summonerLevel),
        lastPlayed,
        iconUrl: `https://ddragon.leagueoflegends.com/cdn/14.1.1/img/profileicon/${summoner.profileIconId}.png`,
        coverUrl:
          "https://gaming-cdn.com/images/products/9456/orig/league-of-legends-pc-jeu-cover.jpg",
        isInstalled: false,
      };

      return this.createSuccessResult(gameData);
    } catch (error) {
      return this.createErrorResult(
        `Failed to sync League of Legends: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private estimateFromLevel(level: number): number {
    // Formule basée sur l'XP requis et le temps moyen pour gagner de l'XP
    // Un joueur gagne environ 100-200 XP par partie
    // Temps approximatif pour atteindre chaque niveau

    let totalMinutes = 0;
    const XP_PER_GAME = 150; // Moyenne
    const MINUTES_PER_GAME = 27; // Moyenne

    const XP_PER_LEVEL = [
      0,
      144,
      288,
      432,
      576,
      720,
      864,
      1008,
      1152,
      1296, // 1-10
      1440,
      1584,
      1728,
      1872,
      2016,
      2160,
      2304,
      2448,
      2592,
      2736, // 11-20
      2880,
      3024,
      3168,
      3312,
      3456,
      3600,
      3744,
      3888,
      4032,
      4176, // 21-30
    ];

    // Calculer le total d'XP requis pour atteindre ce niveau
    let totalXP = 0;
    for (let i = 1; i < Math.min(level, 30); i++) {
      totalXP += XP_PER_LEVEL[i] || 4320; // XP par niveau après 30
    }

    // Après niveau 30, progression linéaire
    if (level > 30) {
      totalXP += (level - 30) * 4320;
    }

    // Calculer le nombre de parties nécessaires
    const gamesNeeded = totalXP / XP_PER_GAME;
    totalMinutes = Math.round(gamesNeeded * MINUTES_PER_GAME);

    // Ajuster pour les bonus XP (first win, events, etc.)
    totalMinutes = Math.round(totalMinutes * 0.85); // Réduction de 15% pour les bonus

    return totalMinutes;
  }

  private async syncTeamfightTactics(
    account: PlatformAccount
  ): Promise<SyncResult<GameData>> {
    try {
      const credentials = account.metadata as unknown as RiotCredentials;
      const platformRegion = credentials?.region || "na1";

      // Récupérer l'historique des matchs TFT
      const matchListUrl = `${this.baseUrls.account[platformRegion]}/tft/match/v1/matches/by-puuid/${account.platformId}/ids?count=20`;
      const matchListResponse = await this.makeApiRequest(matchListUrl);

      if (!matchListResponse.success || !matchListResponse.data) {
        return this.createErrorResult("No Teamfight Tactics data found");
      }

      const matchIds = matchListResponse.data as string[];

      if (matchIds.length === 0) {
        const gameData: GameData = {
          platformGameId: "teamfight-tactics",
          name: "Teamfight Tactics",
          playtimeTotal: 0,
          lastPlayed: undefined,
          iconUrl:
            "https://cdn.communitydragon.org/latest/game/assets/loadouts/summoner-icons/profileicon4649.png",
          coverUrl:
            "https://cmsassets.rgpub.io/sanity/images/dsfx7636/news_live/fc9a0cca66f8acd38c08dfd0f5aed45a1440f9d0-1280x720.jpg?auto=format&fit=fill&q=80&w=1082",
          isInstalled: false,
        };
        return this.createSuccessResult(gameData);
      }

      let totalPlaytime = 0;
      let lastPlayed: Date | undefined;
      let matchesAnalyzed = 0;

      // Analyser chaque match TFT
      for (const matchId of matchIds.slice(0, 10)) {
        await this.enforceRateLimit();

        const matchUrl = `${this.baseUrls.account[platformRegion]}/tft/match/v1/matches/${matchId}`;
        const matchResponse = await this.makeApiRequest(matchUrl);

        if (matchResponse.success && matchResponse.data) {
          const match = matchResponse.data as TftMatch;
          const participant = match.info?.participants?.find(
            (p: TftParticipant) => p.puuid === account.platformId
          );

          if (participant && match.info) {
            // TFT game_length est en secondes
            const duration = Math.round(match.info.game_length / 60);
            totalPlaytime += duration;
            matchesAnalyzed++;

            const matchDate = new Date(match.info.game_datetime);
            if (!lastPlayed || matchDate > lastPlayed) {
              lastPlayed = matchDate;
            }
          }
        }
      }

      // Estimer le temps total
      if (matchesAnalyzed > 0 && matchIds.length > matchesAnalyzed) {
        const averageMatchDuration = totalPlaytime / matchesAnalyzed;
        totalPlaytime = Math.round(averageMatchDuration * matchIds.length);
      }

      const gameData: GameData = {
        platformGameId: "teamfight-tactics",
        name: "Teamfight Tactics",
        playtimeTotal: totalPlaytime,
        lastPlayed,
        iconUrl:
          "https://cdn.mobygames.com/covers/8929208-teamfight-tactics-android-front-cover.png",
        coverUrl:
          "https://cmsassets.rgpub.io/sanity/images/dsfx7636/news_live/fc9a0cca66f8acd38c08dfd0f5aed45a1440f9d0-1280x720.jpg?auto=format&fit=fill&q=80&w=1082",
        isInstalled: false,
      };

      return this.createSuccessResult(gameData);
    } catch (error) {
      return this.createErrorResult(
        `Failed to sync Teamfight Tactics: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private async syncValorant(
    account: PlatformAccount
  ): Promise<SyncResult<GameData>> {
    try {
      const credentials = account.metadata as unknown as RiotCredentials;
      const platformRegion = credentials?.region || "na1";
      const valorantRegion = this.getValorantRegionFromPlatform(platformRegion);

      console.log(
        "[Riot] Attempting VALORANT sync for region:",
        valorantRegion
      );

      // Note: VALORANT API nécessite une clé de production
      // Cette implémentation fonctionnera uniquement avec une clé de production approuvée

      // Récupérer l'historique des matchs VALORANT
      const matchListUrl = `${this.baseUrls.valorant[valorantRegion]}/val/match/v1/matchlists/by-puuid/${account.platformId}`;
      const matchListResponse = await this.makeApiRequest(matchListUrl);

      if (!matchListResponse.success) {
        // Si erreur 403, c'est probablement une clé de développement
        if (matchListResponse.error?.includes("403")) {
          console.warn("[Riot] VALORANT API requires production key");
          return this.createErrorResult(
            "VALORANT API requires a production key. Please use a production API key to sync VALORANT data."
          );
        }
        return this.createErrorResult(
          "No VALORANT data found for this account"
        );
      }

      const matchList = matchListResponse.data as {
        history: Array<{
          matchId: string;
          gameStartTimeMillis: number;
          queueId: string;
        }>;
      };

      if (!matchList.history || matchList.history.length === 0) {
        const gameData: GameData = {
          platformGameId: "valorant",
          name: "VALORANT",
          playtimeTotal: 0,
          lastPlayed: undefined,
          iconUrl:
            "https://media.valorant-api.com/agents/dade69b4-4f5a-8528-247b-219e5a1facd6/displayicon.png",
          coverUrl:
            "https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/bltfe573c42c5b3cb85/65f9db0cbcf86e14f97a9d5c/EP8_Act_2_Homepage_Keyart_final.jpg",
          isInstalled: false,
        };
        return this.createSuccessResult(gameData);
      }

      let totalPlaytime = 0;
      let lastPlayed: Date | undefined;
      let matchesAnalyzed = 0;

      // Analyser les matchs récents pour calculer le temps de jeu
      for (const matchInfo of matchList.history.slice(0, 10)) {
        await this.enforceRateLimit();

        const matchUrl = `${this.baseUrls.valorant[valorantRegion]}/val/match/v1/matches/${matchInfo.matchId}`;
        const matchResponse = await this.makeApiRequest(matchUrl);

        if (matchResponse.success && matchResponse.data) {
          const match = matchResponse.data as ValorantMatch;

          // Structure de l'API VALORANT
          if (match.matchInfo) {
            // La durée du match est en millisecondes
            const duration = Math.round(
              (match.matchInfo.gameLengthMillis || 0) / 1000 / 60
            );
            totalPlaytime += duration;
            matchesAnalyzed++;

            const matchDate = new Date(matchInfo.gameStartTimeMillis);
            if (!lastPlayed || matchDate > lastPlayed) {
              lastPlayed = matchDate;
            }
          } else if (match.players) {
            // Format alternatif de l'API
            const player = match.players.find(
              (p: ValorantPlayer) => p.puuid === account.platformId
            );
            if (player && player.stats) {
              const duration = Math.round(
                (player.stats.playtimeMillis || 0) / 1000 / 60
              );
              totalPlaytime += duration;
              matchesAnalyzed++;
            }
          }
        }
      }

      // Estimer le temps total basé sur l'échantillon
      if (matchesAnalyzed > 0 && matchList.history.length > matchesAnalyzed) {
        const averageMatchDuration = totalPlaytime / matchesAnalyzed;
        totalPlaytime = Math.round(
          averageMatchDuration * matchList.history.length
        );
      }

      const gameData: GameData = {
        platformGameId: "valorant",
        name: "VALORANT",
        playtimeTotal: totalPlaytime,
        lastPlayed,
        iconUrl:
          "https://media.valorant-api.com/agents/dade69b4-4f5a-8528-247b-219e5a1facd6/displayicon.png",
        coverUrl:
          "https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/bltfe573c42c5b3cb85/65f9db0cbcf86e14f97a9d5c/EP8_Act_2_Homepage_Keyart_final.jpg",
        isInstalled: false,
      };

      return this.createSuccessResult(gameData);
    } catch (error) {
      console.error("[Riot] VALORANT sync error:", error);
      return this.createErrorResult(
        `Failed to sync VALORANT: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private getValorantRegionFromPlatform(platformRegion: string): string {
    // Mapper les régions de platform vers les régions VALORANT
    const mapping: Record<string, string> = {
      // Americas
      na1: "na",
      br1: "br",
      la1: "latam",
      la2: "latam",
      // Europe
      euw1: "eu",
      eun1: "eu",
      tr1: "eu",
      ru: "eu",
      // Asia Pacific
      kr: "kr",
      jp1: "ap",
      oc1: "ap",
      ph2: "ap",
      sg2: "ap",
      th2: "ap",
      tw2: "ap",
      vn2: "ap",
    };
    return mapping[platformRegion] || "na";
  }

  private async syncLegendsOfRuneterra(
    account: PlatformAccount
  ): Promise<SyncResult<GameData>> {
    try {
      const credentials = account.metadata as unknown as RiotCredentials;
      const platformRegion = credentials?.region || "na1";
      const continentalRegion = this.getContinentalRegion(platformRegion);

      // Récupérer l'historique des matchs LoR
      const matchListUrl = `${this.baseUrls.account[continentalRegion]}/lor/match/v1/matches/by-puuid/${account.platformId}/ids`;
      const matchListResponse = await this.makeApiRequest(matchListUrl);

      if (!matchListResponse.success || !matchListResponse.data) {
        return this.createErrorResult("No Legends of Runeterra data found");
      }

      const matchIds = matchListResponse.data as string[];

      if (matchIds.length === 0) {
        const gameData: GameData = {
          platformGameId: "legends-of-runeterra",
          name: "Legends of Runeterra",
          playtimeTotal: 0,
          lastPlayed: undefined,
          iconUrl:
            "https://dd.b.pvp.net/latest/core/en_us/img/global/favicon.png",
          coverUrl:
            "https://cdn1.epicgames.com/offer/4fb89e9f47fe48258314c366649c398e/EGS_LegendsofRuneterra_RiotGames_S1_2560x1440-53b4135a798b686f67f2a95de625858f",
          isInstalled: false,
        };
        return this.createSuccessResult(gameData);
      }

      let lastPlayed: Date | undefined;
      const matchCount = matchIds.length;

      // Récupérer les détails du match le plus récent pour la date
      if (matchIds.length > 0) {
        await this.enforceRateLimit();
        const recentMatchUrl = `${this.baseUrls.account[continentalRegion]}/lor/match/v1/matches/${matchIds[0]}`;
        const recentMatchResponse = await this.makeApiRequest(recentMatchUrl);

        if (recentMatchResponse.success && recentMatchResponse.data) {
          const match = recentMatchResponse.data as LoRMatch;
          if (match.info?.game_start_time_utc) {
            lastPlayed = new Date(match.info.game_start_time_utc);
          }
        }
      }

      // Estimer le temps de jeu (LoR n'a pas de durée de match dans l'API)
      // Moyenne d'environ 10 minutes par match
      const estimatedPlaytime = matchCount * 10;

      const gameData: GameData = {
        platformGameId: "legends-of-runeterra",
        name: "Legends of Runeterra",
        playtimeTotal: estimatedPlaytime,
        lastPlayed,
        iconUrl:
          "https://dd.b.pvp.net/latest/core/en_us/img/global/favicon.png",
        coverUrl:
          "https://www.riotgames.com/darkroom/1440/87834e5021e1e2d7e67423a697e1ff1c:3768e4c59e58de2e016b16bb2797fb1f/lor-console.jpg",
        isInstalled: false,
      };

      return this.createSuccessResult(gameData);
    } catch (error) {
      return this.createErrorResult(
        `Failed to sync Legends of Runeterra: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private async makeApiRequest(url: string): Promise<SyncResult<unknown>> {
    try {
      console.log(`[Riot API] Request: ${url}`);

      const response = await fetch(url, {
        headers: {
          "X-Riot-Token": this.apiKey,
          Accept: "application/json",
          "Accept-Language": "en-US,en;q=0.9",
          "Accept-Charset": "application/x-www-form-urlencoded; charset=UTF-8",
          Origin: "https://developer.riotgames.com",
        },
      });

      // Log des headers de rate limit pour debug
      const rateLimitHeaders = {
        "X-App-Rate-Limit": response.headers.get("X-App-Rate-Limit"),
        "X-App-Rate-Limit-Count": response.headers.get(
          "X-App-Rate-Limit-Count"
        ),
        "X-Method-Rate-Limit": response.headers.get("X-Method-Rate-Limit"),
        "X-Method-Rate-Limit-Count": response.headers.get(
          "X-Method-Rate-Limit-Count"
        ),
      };

      if (rateLimitHeaders["X-App-Rate-Limit-Count"]) {
        console.log("[Riot API] Rate Limit Status:", rateLimitHeaders);
      }

      if (response.status === 429) {
        // Rate limit dépassé
        const retryAfter = response.headers.get("Retry-After") || "10";
        console.warn(
          `[Riot API] Rate limit exceeded. Retry after: ${retryAfter}s`
        );
        return this.createErrorResult(
          `Rate limit exceeded. Please wait ${retryAfter} seconds before retrying.`
        );
      }

      if (response.status === 404) {
        // Ressource non trouvée (normal si le joueur n'a pas joué au jeu)
        return this.createErrorResult("Resource not found");
      }

      if (response.status === 403) {
        // Clé API invalide ou expirée
        return this.createErrorResult(
          "API key is invalid or expired. Please check your Riot API key."
        );
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Riot API] Error ${response.status}:`, errorText);
        return this.createErrorResult(
          `Riot API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      return this.createSuccessResult(data);
    } catch (error) {
      console.error("[Riot API] Request failed:", error);
      return this.createErrorResult(
        `API request failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private getContinentalRegion(
    platformRegion: string
  ): "americas" | "asia" | "europe" {
    const continental = this.platformToContinental[platformRegion];
    if (continental === "sea") {
      return "asia";
    }
    return (continental as "americas" | "asia" | "europe") || "americas";
  }

  private async enforceRateLimit(): Promise<void> {
    // Simple rate limiting: max 20 requêtes par seconde
    const now = Date.now();
    if (this.lastRequestTime && now - this.lastRequestTime < 50) {
      // Attendre au moins 50ms entre les requêtes
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    this.lastRequestTime = Date.now();
    this.requestCount++;

    // Reset le compteur toutes les secondes
    if (this.requestCount >= 20) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      this.requestCount = 0;
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
