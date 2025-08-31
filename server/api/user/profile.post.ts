import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  const userId = event.context.user.id;

  const body = await readBody(event);

  const { username, steamID, riotID, epicID, bnetID } = body;

  if (!username) {
    throw createError({
      statusCode: 400,
      statusMessage: "Username is required",
    });
  }

  try {
    // Vérifier si un profil existe déjà pour cet utilisateur
    const existingProfile = await prisma.profile.findUnique({
      where: { userId: userId },
    });

    let profile;

    if (existingProfile) {
      // Mettre à jour le profil existant
      profile = await prisma.profile.update({
        where: { userId: userId },
        data: {
          username,
          steamID: steamID || "",
          riotID: riotID || "",
          epicID: epicID || "",
          bnetID: bnetID || "",
        },
      });
    } else {
      // Créer un nouveau profil
      profile = await prisma.profile.create({
        data: {
          userId: userId,
          username,
          steamID: steamID || "",
          riotID: riotID || "",
          epicID: epicID || "",
          bnetID: bnetID || "",
        },
      });
    }

    return profile;
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "Error saving profile",
    });
  } finally {
    await prisma.$disconnect();
  }
});
