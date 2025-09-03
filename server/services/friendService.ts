import prisma from "~~/lib/prisma";
import { createError } from "h3";
import type { Friend } from "@prisma/client";

export interface FriendshipInfo {
  friendship: Friend;
  friendInfo: {
    id: string;
    name: string;
    slug: string;
  };
}

/**
 * Vérifie si deux utilisateurs sont amis
 */
export async function checkFriendship(
  currentUserId: string,
  targetUserId: string
): Promise<boolean> {
  if (currentUserId === targetUserId) {
    return true; // Un utilisateur est toujours "ami" avec lui-même
  }

  const friendship = await prisma.friend.findFirst({
    where: {
      OR: [
        {
          userId: currentUserId,
          friendId: targetUserId,
          status: "ACCEPTED",
        },
        {
          userId: targetUserId,
          friendId: currentUserId,
          status: "ACCEPTED",
        },
      ],
    },
  });

  return friendship !== null;
}

/**
 * Vérifie si deux utilisateurs sont amis et lance une erreur si ce n'est pas le cas
 */
export async function requireFriendship(
  currentUserId: string,
  targetUserId: string,
  errorMessage: string = "Vous n'êtes pas ami avec cet utilisateur"
): Promise<void> {
  const isFriend = await checkFriendship(currentUserId, targetUserId);
  
  if (!isFriend) {
    throw createError({
      statusCode: 403,
      statusMessage: errorMessage,
    });
  }
}

/**
 * Récupère les informations de l'amitié entre deux utilisateurs
 */
export async function getFriendshipInfo(
  currentUserId: string,
  targetUserId: string
): Promise<FriendshipInfo | null> {
  if (currentUserId === targetUserId) {
    // Si c'est le même utilisateur, on peut retourner ses propres infos
    const user = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { id: true, name: true, slug: true },
    });

    if (!user) return null;

    // Créer un objet "friendship" fictif pour la cohérence
    return {
      friendship: {
        id: 0,
        userId: currentUserId,
        friendId: currentUserId,
        status: "ACCEPTED",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Friend,
      friendInfo: user,
    };
  }

  const friendship = await prisma.friend.findFirst({
    where: {
      OR: [
        {
          userId: currentUserId,
          friendId: targetUserId,
          status: "ACCEPTED",
        },
        {
          userId: targetUserId,
          friendId: currentUserId,
          status: "ACCEPTED",
        },
      ],
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      friend: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  if (!friendship) return null;

  // Déterminer qui est l'ami (pas l'utilisateur connecté)
  const friendInfo =
    friendship.userId === targetUserId ? friendship.user : friendship.friend;

  return {
    friendship,
    friendInfo,
  };
}

/**
 * Récupère les informations de l'amitié et lance une erreur si elle n'existe pas
 */
export async function requireFriendshipInfo(
  currentUserId: string,
  targetUserId: string,
  errorMessage: string = "Vous n'êtes pas ami avec cet utilisateur"
): Promise<FriendshipInfo> {
  const friendshipInfo = await getFriendshipInfo(currentUserId, targetUserId);
  
  if (!friendshipInfo) {
    throw createError({
      statusCode: 403,
      statusMessage: errorMessage,
    });
  }

  return friendshipInfo;
}

/**
 * Valide qu'un utilisateur existe
 */
export async function validateUserExists(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: "Utilisateur non trouvé",
    });
  }
}