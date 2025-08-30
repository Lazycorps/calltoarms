import { defineEventHandler, readBody, createError } from "h3";
import { serverSupabaseUser } from "#supabase/server";
import { RiotService } from "~~/server/services/library/RiotService";
import prisma from "~~/lib/prisma";
import type { RiotCredentials } from "~~/server/types/library/riotSync";

interface AuthRequest {
  riotId: string;
  region?: string;
}

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

    // Lire les données de la requête
    const body = await readBody<AuthRequest>(event);
    if (!body.riotId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Riot ID requis (format: GameName#TagLine)",
      });
    }

    // Valider le format Riot ID
    if (!/^.+#.+$/.test(body.riotId)) {
      throw createError({
        statusCode: 400,
        statusMessage:
          "Format Riot ID invalide. Utilisez le format: GameName#TagLine",
      });
    }

    // Créer les credentials
    const credentials: RiotCredentials = {
      riotId: body.riotId,
      region: body.region || "americas", // Région par défaut
    };

    // Créer une instance du service Riot
    const riotService = new RiotService();

    // Authentifier et récupérer le profil utilisateur
    const authResult = await riotService.authenticate(credentials);
    if (!authResult.success || !authResult.data) {
      throw createError({
        statusCode: 400,
        statusMessage:
          authResult.error || "Échec de l'authentification Riot Games",
      });
    }

    const profile = authResult.data;

    // Vérifier si un compte Riot existe déjà
    const existingAccount = await prisma.platformAccount.findUnique({
      where: {
        userId_platform: {
          userId: user.id,
          platform: "RIOT",
        },
      },
    });

    if (existingAccount) {
      // Mettre à jour le compte existant
      const updatedAccount = await prisma.platformAccount.update({
        where: { id: existingAccount.id },
        data: {
          platformId: profile.platformId,
          displayName: profile.displayName,
          username: profile.username,
          avatarUrl: profile.avatarUrl,
          profileUrl: profile.profileUrl,
          metadata: credentials,
          isActive: true,
        },
      });

      return {
        success: true,
        account: updatedAccount,
        message: "Compte Riot Games mis à jour avec succès",
      };
    } else {
      // Créer un nouveau compte
      const newAccount = await prisma.platformAccount.create({
        data: {
          userId: user.id,
          platform: "RIOT",
          platformId: profile.platformId,
          displayName: profile.displayName,
          username: profile.username,
          avatarUrl: profile.avatarUrl,
          profileUrl: profile.profileUrl,
          metadata: credentials,
          isActive: true,
        },
      });

      return {
        success: true,
        account: newAccount,
        message: "Compte Riot Games connecté avec succès",
      };
    }
  } catch (error) {
    console.error("Erreur lors de l'authentification Riot Games:", error);

    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage:
        "Erreur interne du serveur lors de l'authentification Riot Games",
    });
  }
});
