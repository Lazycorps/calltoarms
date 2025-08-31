import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  const userId = event.context.user.id;

  try {
    const profile = await prisma.profile.findUnique({ where: { userId } });

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
