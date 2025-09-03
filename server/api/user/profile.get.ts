import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  const userId = event.context.user.id;

  try {
    const user = await prisma.user.findUnique({ 
      where: { id: userId },
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
      username: user?.name || "",
      steamID: user?.steamID || "",
      riotID: user?.riotID || "",
      epicID: user?.epicID || "",
      bnetID: user?.bnetID || "",
      avatarUrl: user?.avatarUrl || null,
    };
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "Error fetching profile",
    });
  } finally {
    await prisma.$disconnect();
  }
});
