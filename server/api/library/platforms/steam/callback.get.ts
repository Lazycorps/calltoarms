import { defineEventHandler, getQuery, sendRedirect, createError } from "h3";
import { serverSupabaseUser } from "#supabase/server";
import { SteamService } from "~~/server/services/library/SteamService";
import { z } from "zod";
import prisma from "~~/lib/prisma";

// Schéma de validation pour la réponse Steam OpenID
const steamResponseSchema = z.object({
  "openid.ns": z.string(),
  "openid.mode": z.string(),
  "openid.op_endpoint": z.string(),
  "openid.claimed_id": z.string(),
  "openid.identity": z.string(),
  "openid.return_to": z.string(),
  "openid.response_nonce": z.string(),
  "openid.assoc_handle": z.string(),
  "openid.signed": z.string(),
  "openid.sig": z.string(),
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

    // Valider les données de la réponse Steam
    const validatedData = steamResponseSchema.parse(query);

    // Vérifier la signature avec Steam (étape critique de sécurité)
    const verificationParams = {
      ...validatedData,
      "openid.mode": "check_authentication",
    };

    const verificationResponse = await fetch(
      "https://steamcommunity.com/openid/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Origin: "https://steamcommunity.com",
          Referer: "https://steamcommunity.com/",
        },
        body: new URLSearchParams(verificationParams),
      }
    );

    const verificationText = await verificationResponse.text();

    if (!verificationText.includes("is_valid:true")) {
      throw createError({
        statusCode: 401,
        statusMessage: "Authentification Steam invalide",
      });
    }

    // Extraire le Steam ID de l'identité
    const steamId = validatedData["openid.claimed_id"].split("/").pop();
    if (!steamId || !/^\d{17}$/.test(steamId)) {
      throw createError({
        statusCode: 400,
        statusMessage: "Steam ID invalide",
      });
    }

    // Créer une instance du service Steam et authentifier
    const steamService = new SteamService();
    const authResult = await steamService.authenticate({
      steamId: steamId,
    });

    if (!authResult.success || !authResult.data) {
      throw createError({
        statusCode: 400,
        statusMessage:
          authResult.error || "Impossible de récupérer le profil Steam",
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

    if (existingAccount) {
      // Mettre à jour le compte existant
      await prisma.platformAccount.update({
        where: { id: existingAccount.id },
        data: {
          platformId: authResult.data.platformId,
          username: authResult.data.username,
          displayName: authResult.data.displayName,
          avatarUrl: authResult.data.avatarUrl,
          profileUrl: authResult.data.profileUrl,
          isActive: true,
        },
      });
    } else {
      // Créer un nouveau compte
      await prisma.platformAccount.create({
        data: {
          userId: user.id,
          platform: "STEAM",
          platformId: authResult.data.platformId,
          username: authResult.data.username,
          displayName: authResult.data.displayName,
          avatarUrl: authResult.data.avatarUrl,
          profileUrl: authResult.data.profileUrl,
          isActive: true,
          lastSync: null,
        },
      });
    }

    // Rediriger vers la page de bibliothèque avec un message de succès
    await sendRedirect(event, `${baseUrl}/library?steam_connected=true`);
  } catch (error) {
    console.error("Erreur lors du callback Steam:", error);

    const config = useRuntimeConfig();
    const baseUrl = config.public.baseUrl || "http://localhost:3000";

    if (
      error &&
      typeof error === "object" &&
      "statusCode" in error &&
      "statusMessage" in error
    ) {
      // Rediriger avec le message d'erreur
      const errorWithMessage = error as {
        statusCode: number;
        statusMessage: string;
      };
      await sendRedirect(
        event,
        `${baseUrl}/library?steam_error=${encodeURIComponent(
          errorWithMessage.statusMessage || "Erreur d'authentification Steam"
        )}`
      );
    }

    // Rediriger avec une erreur générique
    await sendRedirect(
      event,
      `${baseUrl}/library?steam_error=${encodeURIComponent(
        "Erreur interne du serveur"
      )}`
    );
  }
});
