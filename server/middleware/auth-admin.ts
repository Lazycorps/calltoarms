import { serverSupabaseUser } from "#supabase/server";
import prisma from "~~/lib/prisma";

export default defineEventHandler(async (event) => {
  // Vérifiez si la route nécessite des droits admin
  if (event.path.startsWith("/api/admin")) {
    const user = await serverSupabaseUser(event);

    if (!user) {
      throw createError({
        statusCode: 401,
        message: "Authentification requise",
      });
    }

    // Vérifier si l'utilisateur existe dans la base et a les droits admin
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { admin: true },
    });

    if (!dbUser || !dbUser.admin) {
      throw createError({
        statusCode: 403,
        message: "Accès administrateur requis",
      });
    }

    // Ajouter l'utilisateur à l'événement pour y accéder dans les gestionnaires
    event.context.user = user;
    event.context.isAdmin = true;
  }
});
