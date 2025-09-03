import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  const userId = event.context.user.id;

  const body = await readBody(event);

  const { username, steamID, riotID, epicID, bnetID, avatarUrl } = body;

  if (!username) {
    throw createError({
      statusCode: 400,
      statusMessage: "Username is required",
    });
  }

  try {
    // Mettre à jour les données utilisateur
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name: username,
        steamID: steamID || "",
        riotID: riotID || "",
        epicID: epicID || "",
        bnetID: bnetID || "",
        avatarUrl: avatarUrl || null,
        slug: slugify(username)
      },
      select: {
        name: true,
        steamID: true,
        riotID: true,
        epicID: true,
        bnetID: true,
        avatarUrl: true,
      }
    });

    return {
      username: user.name,
      steamID: user.steamID,
      riotID: user.riotID,
      epicID: user.epicID,
      bnetID: user.bnetID,
      avatarUrl: user.avatarUrl,
    };
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "Error saving profile",
    });
  } finally {
    await prisma.$disconnect();
  }
});

const slugify = (str: string) => {
  str = str.replace(/^\s+|\s+$/g, ""); // trim leading/trailing white space
  str = str.toLowerCase(); // convert string to lowercase
  str = str
    .replace(/[^a-z0-9 -]/g, "") // remove any non-alphanumeric characters
    .replace(/\s+/g, "_") // replace spaces with hyphens
    .replace(/-+/g, "_"); // remove consecutive hyphens
  return str;
};
