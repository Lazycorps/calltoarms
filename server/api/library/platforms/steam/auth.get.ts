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

    // Générer l'URL de connexion Steam OpenID
    const params = {
      "openid.ns": "http://specs.openid.net/auth/2.0",
      "openid.mode": "checkid_setup",
      "openid.return_to": `${baseUrl}/api/library/platforms/steam/callback`,
      "openid.realm": baseUrl,
      "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
      "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
    };

    const paramString = new URLSearchParams(params).toString();
    const steamLoginUrl = `https://steamcommunity.com/openid/login?${paramString}`;

    // Rediriger vers Steam pour l'authentification
    await sendRedirect(event, steamLoginUrl);
  } catch (error) {
    console.error(
      "Erreur lors de l'initiation de l'authentification Steam:",
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
