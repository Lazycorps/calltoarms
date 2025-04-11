import { serverSupabaseClient } from "#supabase/server";

export default defineEventHandler(async (event) => {
  // Vérifiez si la route nécessite une authentification
  if (event.path.startsWith("/api/user")) {
    const client = await serverSupabaseClient(event);
    const {
      data: { user },
    } = await client.auth.getUser();

    if (!user) {
      throw createError({
        statusCode: 401,
        message: "Authentification requise",
      });
    }

    // Ajouter l'utilisateur à l'événement pour y accéder dans les gestionnaires
    event.context.user = user;
  }
});
