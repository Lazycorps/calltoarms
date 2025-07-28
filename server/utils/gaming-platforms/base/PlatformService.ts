import type { GamingPlatform, PlatformAccount } from "@prisma/client";
import type {
  UserProfile,
  GameData,
  AchievementData,
  PlatformCredentials,
  SyncResult,
} from "./types";

export abstract class PlatformService {
  abstract readonly platform: GamingPlatform;

  // Authentification
  abstract authenticate(
    credentials: PlatformCredentials
  ): Promise<SyncResult<UserProfile>>;

  abstract refreshToken(
    account: PlatformAccount
  ): Promise<SyncResult<PlatformAccount>>;

  // Synchronisation des données
  abstract syncGames(account: PlatformAccount): Promise<SyncResult<GameData[]>>;

  abstract syncAchievements(
    account: PlatformAccount,
    gameId: string
  ): Promise<SyncResult<AchievementData[]>>;

  // Informations utilisateur
  abstract getUserProfile(
    account: PlatformAccount
  ): Promise<SyncResult<UserProfile>>;

  // Validation
  abstract validateCredentials(credentials: PlatformCredentials): boolean;

  // Méthodes utilitaires communes
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
