import { defineEventHandler, getQuery, createError } from "h3";
import type { GamingPlatform } from "@prisma/client";
import type {
  LibraryResponseDTO,
  PlatformGameCardDTO,
} from "~~/shared/types/library";
import { getGames } from "~~/server/services/libraryService";

export default defineEventHandler(
  async (event): Promise<LibraryResponseDTO<PlatformGameCardDTO[]>> => {
    try {
      const currentUserId = event.context.user.id;

      // Récupérer les paramètres de la requête
      const query = getQuery(event);
      const platform = query.platform as GamingPlatform | undefined;
      const search = query.search as string | undefined;
      const sortBy = (query.sortBy as string) || "name";
      const sortOrder = (query.sortOrder as "asc" | "desc") || "asc";
      const limit = query.limit ? parseInt(query.limit as string) : 100;
      const offset = query.offset ? parseInt(query.offset as string) : 0;

      // Utiliser le service pour récupérer les jeux
      return await getGames({
        userId: currentUserId,
        platform,
        search,
        sortBy,
        sortOrder,
        limit,
        offset,
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des jeux:", error);

      if (error && typeof error === "object" && "statusCode" in error) {
        throw error;
      }

      throw createError({
        statusCode: 500,
        statusMessage: "Erreur interne du serveur",
      });
    }
  }
);
