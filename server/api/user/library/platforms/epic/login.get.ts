import { defineEventHandler, sendRedirect, createError } from "h3";
import { serverSupabaseUser } from "#supabase/server";

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

    const config = useRuntimeConfig();
    const baseUrl = config.public.baseUrl || "http://localhost:3000";
    const clientId = config.epicClientId;

    if (!clientId) {
      throw createError({
        statusCode: 500,
        statusMessage: "Epic Games client ID non configuré",
      });
    }

    // Générer l'URL de connexion Epic Games OAuth
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: `${baseUrl}/api/user/library/platforms/epic/callback`,
      response_type: "code",
      scope: "basic_profile",
      state: user.id, // Utiliser l'ID utilisateur comme state pour la validation
    });

    const epicLoginUrl = `https://www.epicgames.com/id/authorize?${params.toString()}`;

    // Rediriger vers Epic Games pour l'authentification
    await sendRedirect(event, epicLoginUrl);
  } catch (error) {
    console.error(
      "Erreur lors de l'initiation de l'authentification Epic Games:",
      error
    );

    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Erreur interne du serveur",
    });
  }
});
