import { defineEventHandler, getQuery, sendRedirect, createError } from "h3";
import { serverSupabaseUser } from "#supabase/server";
import { EpicService } from "@@/server/utils/gaming-platforms/epic/EpicService";
import { z } from "zod";
import prisma from "~~/lib/prisma";

// Schéma de validation pour la réponse Epic Games OAuth
const epicCallbackSchema = z.object({
  code: z.string(),
  state: z.string(),
});

export default defineEventHandler(async (event) => {
  try {
    // Vérifier l'authentification utilisateur
    const user = await serverSupabaseUser(event);
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: "Authentification requise",
      });
    }

    const query = getQuery(event);
    const config = useRuntimeConfig();
    const baseUrl = config.public.baseUrl || "http://localhost:3000";

    // Vérifier s'il y a une erreur dans la réponse
    if (query.error) {
      const errorDescription =
        query.error_description || "Erreur d'authentification Epic Games";
      throw createError({
        statusCode: 400,
        statusMessage: decodeURIComponent(errorDescription as string),
      });
    }

    // Valider les paramètres de callback
    const validatedData = epicCallbackSchema.parse(query);

    // Vérifier le paramètre state pour éviter les attaques CSRF
    if (validatedData.state !== user.id) {
      throw createError({
        statusCode: 400,
        statusMessage: "Paramètre state invalide",
      });
    }

    // Créer une instance du service Epic Games et échanger le code contre les tokens
    const epicService = new EpicService();

    // Échanger le code contre les tokens directement
    const tokenResult = await epicService.exchangeCodeForToken(
      validatedData.code
    );
    if (!tokenResult.success || !tokenResult.data) {
      throw createError({
        statusCode: 400,
        statusMessage:
          tokenResult.error || "Impossible d'échanger le code Epic Games",
      });
    }

    // Extraire les informations du token
    const accountId = tokenResult.data.account_id;
    const accessToken = tokenResult.data.access_token;
    const refreshToken = tokenResult.data.refresh_token;
    const displayName = tokenResult.data.displayName || accountId;

    if (!accountId || !accessToken) {
      throw createError({
        statusCode: 400,
        statusMessage: "Réponse Epic Games incomplète - tokens manquants",
      });
    }

    // Vérifier si le compte existe déjà
    const existingAccount = await prisma.platformAccount.findUnique({
      where: {
        userId_platform: {
          userId: user.id,
          platform: "EPIC_GAMES",
        },
      },
    });

    console.log("Token data before saving:", {
      platformId: accountId,
      username: displayName,
      has_access_token: !!accessToken,
      has_refresh_token: !!refreshToken,
      access_token_length: accessToken ? accessToken.length : 0,
      refresh_token_length: refreshToken ? refreshToken.length : 0,
    });

    let platformAccount;

    if (existingAccount) {
      // Mettre à jour le compte existant
      platformAccount = await prisma.platformAccount.update({
        where: { id: existingAccount.id },
        data: {
          platformId: accountId,
          username: displayName,
          displayName: displayName,
          avatarUrl: undefined,
          profileUrl: undefined,
          accessToken: accessToken,
          refreshToken: refreshToken,
          isActive: true,
          lastSync: new Date(),
        },
      });
    } else {
      // Créer un nouveau compte
      platformAccount = await prisma.platformAccount.create({
        data: {
          userId: user.id,
          platform: "EPIC_GAMES",
          platformId: accountId,
          username: displayName,
          displayName: displayName,
          avatarUrl: undefined,
          profileUrl: undefined,
          accessToken: accessToken,
          refreshToken: refreshToken,
          isActive: true,
          lastSync: new Date(),
        },
      });
    }

    console.log("Epic Games account saved:", {
      id: platformAccount.id,
      platformId: platformAccount.platformId,
      has_access_token: !!platformAccount.accessToken,
      has_refresh_token: !!platformAccount.refreshToken,
    });

    // Rediriger vers la page de bibliothèque avec un message de succès
    await sendRedirect(event, `${baseUrl}/library?epic_connected=true`);
  } catch (error) {
    console.error("Erreur lors du callback Epic Games:", error);

    const config = useRuntimeConfig();
    const baseUrl = config.public.baseUrl || "http://localhost:3000";

    if (error && typeof error === "object" && "statusCode" in error) {
      // Rediriger avec le message d'erreur
      await sendRedirect(
        event,
        `${baseUrl}/library?epic_error=${encodeURIComponent(
          error.statusMessage || "Erreur d'authentification Epic Games"
        )}`
      );
      return;
    }

    // Rediriger avec une erreur générique
    await sendRedirect(
      event,
      `${baseUrl}/library?epic_error=${encodeURIComponent(
        "Erreur interne du serveur"
      )}`
    );
  }
});
