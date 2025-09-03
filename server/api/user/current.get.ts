import { serverSupabaseUser } from "#supabase/server";
import prisma from "~~/lib/prisma";

export default defineEventHandler(async (event) => {
  const userConnected = await serverSupabaseUser(event);
  if (userConnected == null) return;

  const user = await prisma.user.findFirst({
    where: { id: userConnected.id },
    select: {
      id: true,
      name: true,
      admin: true,
      steamID: true,
      riotID: true,
      epicID: true,
      bnetID: true,
      avatarUrl: true,
    },
  });
  return {
    ...user,
    email: userConnected.email,
  };
});
