import { defineEventHandler, readBody, createError } from "h3";
import { serverSupabaseUser } from "#supabase/server";
import { getPlatformService } from "../../../utils/gaming-platforms";
import type { GamingPlatform } from "@prisma/client";
import prisma from "../../../../lib/prisma";

interface AuthRequest {
  credentials: Record<string, string | number | boolean>;
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

    // Récupérer la plateforme depuis l'URL
    const platform = getRouterParam(
      event,
      "platform"
    )?.toUpperCase() as GamingPlatform;
    if (!platform) {
      throw createError({
        statusCode: 400,
        statusMessage: "Plateforme non spécifiée",
      });
    }

    // Lire les données de la requête
    const body = await readBody<AuthRequest>(event);
    if (!body.credentials) {
      throw createError({
        statusCode: 400,
        statusMessage: "Identifiants manquants",
      });
    }

    // Obtenir le service de la plateforme
    const platformService = getPlatformService(platform);

    // Authentifier avec la plateforme
    const authResult = await platformService.authenticate(body.credentials);
    if (!authResult.success || !authResult.data) {
      throw createError({
        statusCode: 400,
        statusMessage: authResult.error || "Échec de l'authentification",
      });
    }

    // Vérifier si le compte existe déjà
    const existingAccount = await prisma.platformAccount.findUnique({
      where: {
        userId_platform: {
          userId: user.id,
          platform,
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
      console.log(authResult);
      platformAccount = await prisma.platformAccount.create({
        data: {
          userId: user.id,
          platform,
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
    console.error("Erreur lors de l'authentification de la plateforme:", error);

    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Erreur interne du serveur",
    });
  }
});
