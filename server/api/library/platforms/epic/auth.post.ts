import { defineEventHandler, sendRedirect, createError } from "h3";
import { serverSupabaseUser } from "#supabase/server";

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

    // Rediriger vers le flow OAuth Epic Games
    const config = useRuntimeConfig();
    const baseUrl = config.public.baseUrl || "http://localhost:3000";

    await sendRedirect(event, `${baseUrl}/api/library/platforms/epic/login`);
  } catch (error) {
    console.error("Erreur lors de la redirection Epic Games OAuth:", error);

    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Erreur interne du serveur",
    });
  }
});
