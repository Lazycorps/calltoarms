import { PrismaClient } from "@prisma/client";
import { defineEventHandler, getQuery } from "h3";

const prisma = new PrismaClient();

interface GameFilters {
  search?: string;
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event) as GameFilters;
  console.log(query);
  const { search } = query;

  const filters: {
    OR?: {
      title?: {
        contains: string;
        mode: "insensitive";
      };
      description?: {
        contains: string;
        mode: "insensitive";
      };
    }[];
  } = {};

  if (search) {
    filters.OR = [
      {
        title: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        description: {
          contains: search,
          mode: "insensitive",
        },
      },
    ];
  }

  const games = await prisma.game.findMany({
    where: filters,
  });

  return games;
});
