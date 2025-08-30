/* eslint-disable @typescript-eslint/no-explicit-any */
// riot-types.ts - Types complets pour l'API Riot Games

export interface RiotCredentials {
  riotId: string; // Format: GameName#TagLine
  region?: string; // Région du serveur (na1, euw1, kr, etc.)
}

export interface RiotApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Account API Types
export interface RiotAccount {
  puuid: string;
  gameName: string;
  tagLine: string;
}

// League of Legends Types
export interface RiotSummoner {
  id: string;
  accountId: string;
  puuid: string;
  name: string;
  profileIconId: number;
  revisionDate: number;
  summonerLevel: number;
}

export interface RiotMatch {
  metadata: {
    dataVersion: string;
    matchId: string;
    participants: string[];
  };
  info: {
    gameCreation: number;
    gameDuration: number;
    gameEndTimestamp?: number;
    gameId: number;
    gameMode: string;
    gameName: string;
    gameStartTimestamp: number;
    gameType: string;
    gameVersion: string;
    mapId: number;
    participants: RiotParticipant[];
    platformId: string;
    queueId: number;
    teams: RiotTeam[];
    tournamentCode?: string;
  };
}

export interface RiotParticipant {
  puuid: string;
  assists: number;
  baronKills: number;
  bountyLevel: number;
  champExperience: number;
  champLevel: number;
  championId: number;
  championName: string;
  championTransform: number;
  consumablesPurchased: number;
  damageDealtToBuildings: number;
  damageDealtToObjectives: number;
  damageDealtToTurrets: number;
  damageSelfMitigated: number;
  deaths: number;
  detectorWardsPlaced: number;
  doubleKills: number;
  dragonKills: number;
  firstBloodAssist: boolean;
  firstBloodKill: boolean;
  firstTowerAssist: boolean;
  firstTowerKill: boolean;
  gameEndedInEarlySurrender: boolean;
  gameEndedInSurrender: boolean;
  goldEarned: number;
  goldSpent: number;
  individualPosition: string;
  inhibitorKills: number;
  inhibitorTakedowns: number;
  inhibitorsLost: number;
  item0: number;
  item1: number;
  item2: number;
  item3: number;
  item4: number;
  item5: number;
  item6: number;
  itemsPurchased: number;
  killingSprees: number;
  kills: number;
  lane: string;
  largestCriticalStrike: number;
  largestKillingSpree: number;
  largestMultiKill: number;
  longestTimeSpentLiving: number;
  magicDamageDealt: number;
  magicDamageDealtToChampions: number;
  magicDamageTaken: number;
  neutralMinionsKilled: number;
  nexusKills: number;
  nexusLost: number;
  nexusTakedowns: number;
  objectivesStolen: number;
  objectivesStolenAssists: number;
  participantId: number;
  pentaKills: number;
  perks: {
    statPerks: {
      defense: number;
      flex: number;
      offense: number;
    };
    styles: Array<{
      description: string;
      selections: Array<{
        perk: number;
        var1: number;
        var2: number;
        var3: number;
      }>;
      style: number;
    }>;
  };
  physicalDamageDealt: number;
  physicalDamageDealtToChampions: number;
  physicalDamageTaken: number;
  profileIcon: number;
  quadraKills: number;
  riotIdName: string;
  riotIdTagline: string;
  role: string;
  sightWardsBoughtInGame: number;
  spell1Casts: number;
  spell2Casts: number;
  spell3Casts: number;
  spell4Casts: number;
  summoner1Casts: number;
  summoner1Id: number;
  summoner2Casts: number;
  summoner2Id: number;
  summonerId: string;
  summonerLevel: number;
  summonerName: string;
  teamEarlySurrendered: boolean;
  teamId: number;
  teamPosition: string;
  timeCCingOthers: number;
  timePlayed: number;
  totalDamageDealt: number;
  totalDamageDealtToChampions: number;
  totalDamageShieldedOnTeammates: number;
  totalDamageTaken: number;
  totalHeal: number;
  totalHealsOnTeammates: number;
  totalMinionsKilled: number;
  totalTimeCCDealt: number;
  totalTimeSpentDead: number;
  totalUnitsHealed: number;
  tripleKills: number;
  trueDamageDealt: number;
  trueDamageDealtToChampions: number;
  trueDamageTaken: number;
  turretKills: number;
  turretTakedowns: number;
  turretsLost: number;
  unrealKills: number;
  visionScore: number;
  visionWardsBoughtInGame: number;
  wardsKilled: number;
  wardsPlaced: number;
  win: boolean;
}

export interface RiotTeam {
  bans: Array<{
    championId: number;
    pickTurn: number;
  }>;
  objectives: {
    baron: {
      first: boolean;
      kills: number;
    };
    champion: {
      first: boolean;
      kills: number;
    };
    dragon: {
      first: boolean;
      kills: number;
    };
    inhibitor: {
      first: boolean;
      kills: number;
    };
    riftHerald: {
      first: boolean;
      kills: number;
    };
    tower: {
      first: boolean;
      kills: number;
    };
  };
  teamId: number;
  win: boolean;
}

// Teamfight Tactics Types
export interface TftMatch {
  metadata: {
    data_version: string;
    match_id: string;
    participants: string[];
  };
  info: {
    game_datetime: number;
    game_length: number;
    game_version: string;
    participants: TftParticipant[];
    queue_id: number;
    tft_game_type: string;
    tft_set_core_name: string;
    tft_set_number: number;
  };
}

export interface TftParticipant {
  puuid: string;
  augments: string[];
  companion: {
    content_ID: string;
    item_ID: number;
    skin_ID: number;
    species: string;
  };
  gold_left: number;
  last_round: number;
  level: number;
  placement: number;
  players_eliminated: number;
  time_eliminated: number;
  total_damage_to_players: number;
  traits: Array<{
    name: string;
    num_units: number;
    style: number;
    tier_current: number;
    tier_total: number;
  }>;
  units: Array<{
    character_id: string;
    itemNames: string[];
    items: number[];
    name: string;
    rarity: number;
    tier: number;
  }>;
}

// VALORANT Types
export interface ValorantMatch {
  matchInfo: {
    matchId: string;
    mapId: string;
    gamePodId: string;
    gameLoopZone: string;
    gameServerAddress: string;
    gameVersion: string;
    gameLengthMillis: number;
    gameStartMillis: number;
    provisioningFlowID: string;
    isCompleted: boolean;
    customGameName: string;
    forcePostProcessing: boolean;
    queueID: string;
    gameMode: string;
    isRanked: boolean;
    isMatchSampled: boolean;
    seasonId: string;
    completionState: string;
    platformType: string;
    partyRRPenalties: Record<string, number>;
    shouldMatchDisablePenalties: boolean;
  };
  players: ValorantPlayer[];
  teams: ValorantTeam[];
  roundResults: ValorantRoundResult[];
}

export interface ValorantPlayer {
  puuid: string;
  gameName: string;
  tagLine: string;
  teamId: string;
  partyId: string;
  characterId: string;
  stats: {
    score: number;
    roundsPlayed: number;
    kills: number;
    deaths: number;
    assists: number;
    playtimeMillis: number;
    abilityCasts: {
      grenadeCasts: number;
      ability1Casts: number;
      ability2Casts: number;
      ultimateCasts: number;
    };
  };
  roundDamage: Array<{
    round: number;
    damage: number;
  }>;
  competitiveTier: number;
  isObserver: boolean;
  playerCard: string;
  playerTitle: string;
  preferredLevelBorder: string;
  accountLevel: number;
  sessionPlaytimeMinutes: number;
  behaviorFactors: {
    afkRounds: number;
    collisions: number;
    commsRatingRecovery: number;
    damageParticipation: number;
    friendlyFire: number;
    mouseMovement: number;
    selfDamage: number;
    stayedInSpawn: number;
  };
  newPlayerExperienceDetails: {
    basicGunSkillChallenges: any[];
    basicMovement: boolean;
    adaptiveBots: boolean;
    ability: boolean;
    bombPlant: boolean;
    defendBombSite: boolean;
    settingStatus: string;
    version: number;
  };
}

export interface ValorantTeam {
  teamId: string;
  won: boolean;
  roundsPlayed: number;
  roundsWon: number;
  numPoints: number;
}

export interface ValorantRoundResult {
  roundNum: number;
  roundResult: string;
  roundCeremony: string;
  winningTeam: string;
  bombPlanter?: string;
  bombDefuser?: string;
  plantRoundTime?: number;
  plantPlayerLocations?: any[];
  plantLocation?: {
    x: number;
    y: number;
  };
  plantSite?: string;
  defuseRoundTime?: number;
  defusePlayerLocations?: any[];
  defuseLocation?: {
    x: number;
    y: number;
  };
  playerStats: Array<{
    puuid: string;
    kills: any[];
    damage: any[];
    score: number;
    economy: {
      loadoutValue: number;
      weapon: string;
      armor: string;
      remaining: number;
      spent: number;
    };
    ability: {
      grenadeEffects: any;
      ability1Effects: any;
      ability2Effects: any;
      ultimateEffects: any;
    };
    wasAfk: boolean;
    wasPenalized: boolean;
    stayedInSpawn: boolean;
  }>;
}

// Legends of Runeterra Types
export interface LoRMatch {
  metadata: {
    data_version: string;
    match_id: string;
    participants: string[];
  };
  info: {
    game_mode: string;
    game_type: string;
    game_start_time_utc: string;
    game_version: string;
    players: LoRPlayer[];
    total_turn_count: number;
  };
}

export interface LoRPlayer {
  puuid: string;
  deck_id: string;
  deck_code: string;
  factions: string[];
  game_outcome: string;
  order_of_play: number;
}

// Ranked Types
export interface LeagueEntry {
  leagueId: string;
  summonerId: string;
  summonerName: string;
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  hotStreak: boolean;
  veteran: boolean;
  freshBlood: boolean;
  inactive: boolean;
  miniSeries?: {
    target: number;
    wins: number;
    losses: number;
    progress: string;
  };
}

// Champion Mastery Types
export interface ChampionMastery {
  puuid: string;
  championPointsUntilNextLevel: number;
  chestGranted: boolean;
  championId: number;
  lastPlayTime: number;
  championLevel: number;
  summonerId: string;
  championPoints: number;
  championPointsSinceLastLevel: number;
  tokensEarned: number;
}

// Game Data Types for our application
export interface RiotGameData {
  gameId: string;
  gameName: string;
  totalPlaytime: number; // in minutes
  lastPlayed?: Date;
  rank?: {
    tier: string;
    rank: string;
    leaguePoints: number;
  };
  level?: number;
  iconUrl?: string;
  coverUrl?: string;
}

// Error Types
export interface RiotApiError {
  status: {
    message: string;
    status_code: number;
  };
}

// Rate Limit Types
export interface RateLimitInfo {
  appRateLimit: string;
  appRateLimitCount: string;
  methodRateLimit?: string;
  methodRateLimitCount?: string;
  retryAfter?: number;
}

// RSO (Riot Sign On) Types
export interface RSOTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  id_token: string;
  sub_sid: string;
}

export interface RSOUserInfo {
  sub: string;
  email?: string;
  email_verified?: boolean;
  username: string;
  preferred_username: string;
  picture?: string;
}

// Live Client Data API Types (pour les jeux en cours)
export interface LiveClientData {
  activePlayer: {
    abilities: Record<string, any>;
    championStats: {
      abilityPower: number;
      armor: number;
      armorPenetrationFlat: number;
      armorPenetrationPercent: number;
      attackDamage: number;
      attackRange: number;
      attackSpeed: number;
      bonusArmorPenetrationPercent: number;
      bonusMagicPenetrationPercent: number;
      cooldownReduction: number;
      critChance: number;
      critDamage: number;
      currentHealth: number;
      healthRegenRate: number;
      lifeSteal: number;
      magicLethality: number;
      magicPenetrationFlat: number;
      magicPenetrationPercent: number;
      magicResist: number;
      maxHealth: number;
      moveSpeed: number;
      physicalLethality: number;
      resourceMax: number;
      resourceRegenRate: number;
      resourceType: string;
      resourceValue: number;
      spellVamp: number;
      tenacity: number;
    };
    currentGold: number;
    fullRunes: {
      generalRunes: any[];
      keystone: {
        displayName: string;
        id: number;
        rawDescription: string;
        rawDisplayName: string;
      };
      primaryRuneTree: {
        displayName: string;
        id: number;
        rawDescription: string;
        rawDisplayName: string;
      };
      secondaryRuneTree: {
        displayName: string;
        id: number;
        rawDescription: string;
        rawDisplayName: string;
      };
      statRunes: any[];
    };
    level: number;
    summonerName: string;
  };
  allPlayers: Array<{
    championName: string;
    isBot: boolean;
    isDead: boolean;
    items: Array<{
      canUse: boolean;
      consumable: boolean;
      count: number;
      displayName: string;
      itemID: number;
      price: number;
      rawDescription: string;
      rawDisplayName: string;
      slot: number;
    }>;
    level: number;
    position: string;
    rawChampionName: string;
    respawnTimer: number;
    runes: {
      keystone: {
        displayName: string;
        id: number;
        rawDescription: string;
        rawDisplayName: string;
      };
      primaryRuneTree: {
        displayName: string;
        id: number;
        rawDescription: string;
        rawDisplayName: string;
      };
      secondaryRuneTree: {
        displayName: string;
        id: number;
        rawDescription: string;
        rawDisplayName: string;
      };
    };
    scores: {
      assists: number;
      creepScore: number;
      deaths: number;
      kills: number;
      wardScore: number;
    };
    skinID: number;
    summonerName: string;
    summonerSpells: {
      summonerSpellOne: {
        displayName: string;
        rawDescription: string;
        rawDisplayName: string;
      };
      summonerSpellTwo: {
        displayName: string;
        rawDescription: string;
        rawDisplayName: string;
      };
    };
    team: string;
  }>;
  events: {
    Events: Array<{
      EventID: number;
      EventName: string;
      EventTime: number;
      Assisters?: string[];
      KillerName?: string;
      VictimName?: string;
    }>;
  };
  gameData: {
    gameMode: string;
    gameTime: number;
    mapName: string;
    mapNumber: number;
    mapTerrain: string;
  };
}

// Constantes utiles
export const RIOT_REGIONS = {
  PLATFORM: {
    BR1: "br1",
    EUN1: "eun1",
    EUW1: "euw1",
    JP1: "jp1",
    KR: "kr",
    LA1: "la1",
    LA2: "la2",
    NA1: "na1",
    OC1: "oc1",
    PH2: "ph2",
    RU: "ru",
    SG2: "sg2",
    TH2: "th2",
    TR1: "tr1",
    TW2: "tw2",
    VN2: "vn2",
  },
  CONTINENTAL: {
    AMERICAS: "americas",
    ASIA: "asia",
    EUROPE: "europe",
    SEA: "sea", // Note: SEA utilise 'asia' dans l'API
  },
  VALORANT: {
    AP: "ap",
    BR: "br",
    EU: "eu",
    KR: "kr",
    LATAM: "latam",
    NA: "na",
  },
} as const;

export const RIOT_GAMES = {
  LOL: "league-of-legends",
  TFT: "teamfight-tactics",
  VAL: "valorant",
  LOR: "legends-of-runeterra",
  WR: "wild-rift", // Note: Pas d'API publique
} as const;

export const QUEUE_TYPES = {
  LOL: {
    RANKED_SOLO_5x5: "RANKED_SOLO_5x5",
    RANKED_FLEX_SR: "RANKED_FLEX_SR",
    RANKED_FLEX_TT: "RANKED_FLEX_TT",
  },
  TFT: {
    RANKED_TFT: "RANKED_TFT",
    RANKED_TFT_TURBO: "RANKED_TFT_TURBO",
    RANKED_TFT_DOUBLE_UP: "RANKED_TFT_DOUBLE_UP",
  },
} as const;

export const TIERS = {
  IRON: "IRON",
  BRONZE: "BRONZE",
  SILVER: "SILVER",
  GOLD: "GOLD",
  PLATINUM: "PLATINUM",
  EMERALD: "EMERALD",
  DIAMOND: "DIAMOND",
  MASTER: "MASTER",
  GRANDMASTER: "GRANDMASTER",
  CHALLENGER: "CHALLENGER",
} as const;

export const RANKS = {
  I: "I",
  II: "II",
  III: "III",
  IV: "IV",
} as const;
