import { defineEventHandler, readBody, createError } from "h3";
import { serverSupabaseUser } from "#supabase/server";
import { SteamService } from "@@/server/utils/gaming-platforms/steam/SteamService";
import prisma from "~~/lib/prisma";

interface SteamAuthRequest {
  steamId: string;
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
    const body = await readBody<SteamAuthRequest>(event);
    if (!body.steamId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Steam ID manquant",
      });
    }

    // Valider le Steam ID (doit être 17 chiffres)
    if (!/^\d{17}$/.test(body.steamId)) {
      throw createError({
        statusCode: 400,
        statusMessage: "Steam ID invalide. Doit contenir 17 chiffres.",
      });
    }

    // Créer une instance du service Steam
    const steamService = new SteamService();

    // Authentifier avec Steam
    const authResult = await steamService.authenticate({
      steamId: body.steamId,
    });
    if (!authResult.success || !authResult.data) {
      throw createError({
        statusCode: 400,
        statusMessage: authResult.error || "Utilisateur Steam introuvable",
      });
    }

    // Vérifier si le compte existe déjà
    const existingAccount = await prisma.platformAccount.findUnique({
      where: {
        userId_platform: {
          userId: user.id,
          platform: "STEAM",
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
          isActive: true,
          lastSync: new Date(),
        },
      });
    } else {
      // Créer un nouveau compte
      platformAccount = await prisma.platformAccount.create({
        data: {
          userId: user.id,
          platform: "STEAM",
          platformId: authResult.data.platformId,
          username: authResult.data.username,
          displayName: authResult.data.displayName,
          avatarUrl: authResult.data.avatarUrl,
          profileUrl: authResult.data.profileUrl,
          isActive: true,
          lastSync: new Date(),
        },
      });
    }

    return {
      success: true,
      account: platformAccount,
    };
  } catch (error) {
    console.error("Erreur lors de l'authentification Steam:", error);

    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Erreur interne du serveur",
    });
  }
});
