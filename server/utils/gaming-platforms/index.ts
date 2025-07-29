// import type { GamingPlatform } from "@prisma/client";
// import type { PlatformService } from "./base/PlatformService";
// import { SteamService } from "./steam/SteamService";
// import { PlayStationService } from "./playstation/PlayStationService";

// const services: Map<GamingPlatform, PlatformService> = new Map();

// function createService(platform: GamingPlatform): PlatformService {
//   switch (platform) {
//     case "STEAM":
//       return new SteamService();
//     case "PLAYSTATION":
//       return new PlayStationService();
//     case "XBOX":
//       throw new Error("Xbox service not implemented yet");
//     case "NINTENDO":
//       throw new Error("Nintendo service not implemented yet");
//     case "EPIC_GAMES":
//       throw new Error("Epic Games service not implemented yet");
//     case "GOG":
//       throw new Error("GOG service not implemented yet");
//     default:
//       throw new Error(`Unsupported platform: ${platform}`);
//   }
// }

// export function getPlatformService(platform: GamingPlatform): PlatformService {
//   if (!services.has(platform)) {
//     const service = createService(platform);
//     services.set(platform, service);
//   }

//   const service = services.get(platform);
//   if (!service) {
//     throw new Error(`Service for platform ${platform} not found`);
//   }

//   return service;
// }

// export function getSupportedPlatforms(): GamingPlatform[] {
//   return ["STEAM", "PLAYSTATION"]; // Steam et PlayStation sont supportés
// }

// export function isPlatformSupported(platform: GamingPlatform): boolean {
//   return getSupportedPlatforms().includes(platform);
// }

// // Export des types et classes utiles
// // export type {
// //   UserProfile,
// //   GameData,
// //   AchievementData,
// //   PlatformCredentials,
// //   SyncResult,
// // } from "./base/types";
