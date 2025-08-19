import { defineEventHandler, readBody, createError } from "h3";
import { serverSupabaseUser } from "#supabase/server";
import prisma from "~~/lib/prisma";

interface PlayStationAuthRequest {
  username: string;
  npsso: string;
}

export default defineEventHandler(async (event) => {
  try {
    // Vérifier l'authentification
    const user = await serverSupabaseUser(event);
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: "Authentification requise",
      });
    }

    // Lire les données de la requête
    const body = await readBody<PlayStationAuthRequest>(event);
    if (!body.npsso) {
      throw createError({
        statusCode: 400,
        statusMessage: "NPSSO token manquant",
      });
    }

    // Créer une instance du service PlayStation
    const playStationService = new PlayStationService();

    // Authentifier avec PlayStation
    const authResult = await playStationService.authenticate({
      npsso: body.npsso,
      username: body.username,
    });
    if (!authResult.success || !authResult.data) {
      throw createError({
        statusCode: 400,
        statusMessage:
          authResult.error || "Échec de l'authentification PlayStation",
      });
    }

    // Vérifier si le compte existe déjà
    const existingAccount = await prisma.platformAccount.findUnique({
      where: {
        userId_platform: {
          userId: user.id,
          platform: "PLAYSTATION",
        },
      },
    });

    let platformAccount;

    if (existingAccount) {
      // Mettre à jour le compte existant
      platformAccount = await prisma.platformAccount.update({
        where: { id: existingAccount.id },
        data: {
          platformId: authResult.data.platformId,
          username: authResult.data.username,
          displayName: authResult.data.displayName,
          avatarUrl: authResult.data.avatarUrl,
          profileUrl: authResult.data.profileUrl,
          accessToken: body.npsso, // Stocker le NPSSO pour réutilisation
          isActive: true,
        },
      });
    } else {
      // Créer un nouveau compte
      platformAccount = await prisma.platformAccount.create({
        data: {
          userId: user.id,
          platform: "PLAYSTATION",
          platformId: authResult.data.platformId,
          username: authResult.data.username,
          displayName: authResult.data.displayName,
          avatarUrl: authResult.data.avatarUrl,
          profileUrl: authResult.data.profileUrl,
          accessToken: body.npsso, // Stocker le NPSSO pour réutilisation
          isActive: true,
          lastSync: null,
        },
      });
    }

    return {
      success: true,
      account: {
        id: platformAccount.id,
        platformId: platformAccount.platformId,
        username: platformAccount.username,
        displayName: platformAccount.displayName,
        avatarUrl: platformAccount.avatarUrl,
        profileUrl: platformAccount.profileUrl,
      },
    };
  } catch (error) {
    console.error("Erreur lors de l'authentification PlayStation:", error);

    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Erreur interne du serveur",
    });
  }
});
