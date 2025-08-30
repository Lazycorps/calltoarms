import { defineEventHandler, getQuery } from "h3";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const username = query.username as string;
  const currentUserId = event.context.user.id;

  if (!username) {
    return {
      status: 400,
      body: { message: "Username is required" },
    };
  }

  try {
    // Search for users by name or slug
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: username, mode: "insensitive" } },
          { slug: { contains: username, mode: "insensitive" } },
        ],
        // Exclude the current user
        NOT: { id: currentUserId },
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
      take: 10, // Limit results
    });

    return users;
  } catch (error) {
    console.error(error);
    return { status: 500, body: { message: "Internal Server Error" } };
  }
});
