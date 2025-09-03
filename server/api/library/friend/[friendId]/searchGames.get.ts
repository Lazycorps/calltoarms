import { defineEventHandler, getRouterParam, getQuery, createError } from "h3";
import { serverSupabaseUser } from "#supabase/server";
import prisma from "~~/lib/prisma";
import type { GamingPlatform } from "@prisma/client";
import type {
  LibraryResponseDTO,
  PlatformGameCardDTO,
} from "~~/shared/types/library";
import { getFriendGames } from "~~/server/services/libraryService";
import { requireFriendship } from "~~/server/services/friendService";

export default defineEventHandler(
  async (event): Promise<LibraryResponseDTO<PlatformGameCardDTO[]>> => {
    try {
      // Vérifier l'authentification
      const user = await serverSupabaseUser(event);
      if (!user) {
        throw createError({
          statusCode: 401,
          statusMessage: "Authentification requise",
        });
      }

      // Récupérer l'ID de l'ami depuis l'URL
      const friendId = getRouterParam(event, "friendId");
      if (!friendId) {
        throw createError({
          statusCode: 400,
          statusMessage: "ID de l'ami manquant",
        });
      }

      // Vérifier que l'utilisateur et l'ami sont bien amis
      await requireFriendship(
        user.id,
        friendId,
        "Vous n'êtes pas ami avec cet utilisateur"
      );

      // Récupérer les paramètres de la requête
      const query = getQuery(event);
      const platform = query.platform as GamingPlatform | undefined;
      const search = query.search as string | undefined;
      const sortBy = (query.sortBy as string) || "name";
      const sortOrder = (query.sortOrder as "asc" | "desc") || "asc";
      const limit = query.limit ? parseInt(query.limit as string) : 100;
      const offset = query.offset ? parseInt(query.offset as string) : 0;

      // Utiliser le service pour récupérer les jeux de l'ami
      return await getFriendGames({
        userId: friendId,
        platform,
        search,
        sortBy,
        sortOrder,
        limit,
        offset,
      });
    } catch (error) {
      console.error("Erreur lors de la recherche des jeux de l'ami:", error);

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