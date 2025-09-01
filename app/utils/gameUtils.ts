import type { GamingPlatform } from "@prisma/client";

export function getPlatformIcon(platform: GamingPlatform): string {
  const icons: Record<GamingPlatform, string> = {
    STEAM: "mdi-steam",
    PLAYSTATION: "mdi-sony-playstation",
    XBOX: "mdi-microsoft-xbox",
    NINTENDO: "mdi-nintendo-switch",
    GOG: "mdi-gamepad-variant",
    RIOT: "mdi-sword-cross",
  };
  return icons[platform] || "mdi-gamepad-variant";
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatPlaytimeInDays(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}min`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours > 0 ? `${days}j ${remainingHours}h` : `${days}j`;
}

export function formatPlaytimeInHours(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}min`;
  }
  const hours = Math.floor(minutes / 60);
  return `${hours}h`;
}
