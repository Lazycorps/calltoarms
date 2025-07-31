/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineEventHandler, readBody, createError } from "h3";
import { serverSupabaseUser } from "#supabase/server";
import prisma from "../../../../lib/prisma";
import { authenticate } from "@xboxreplay/xboxlive-auth";
interface XboxAuthRequest {
  credentials: {
    email: string;
    password: string;
  };
}

export default defineEventHandler(async (event) => {
  try {
    // Vérifier l'authentification
    const user = await serverSupabaseUser(event);
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: "Authentification requise",
      });
    }

    // Lire les données de la requête
    const body = await readBody<XboxAuthRequest>(event);
    if (
      !body.credentials ||
      !body.credentials.email ||
      !body.credentials.password
    ) {
      throw createError({
        statusCode: 400,
        statusMessage: "Email et mot de passe Xbox requis",
      });
    }

    // Valider l'email
    if (!body.credentials.email.includes("@")) {
      throw createError({
        statusCode: 400,
        statusMessage: "Email Xbox invalide",
      });
    }

    // Authentifier avec Xbox Live et récupérer les tokens

    const xboxLiveAuth = await authenticate(
      body.credentials.email as `${string}@${string}.${string}`,
      body.credentials.password,
      {
        XSTSRelyingParty: "http://xboxlive.com",
        raw: false,
      }
    );

    if (!xboxLiveAuth) {
      throw createError({
        statusCode: 400,
        statusMessage: "Échec de l'authentification Xbox Live",
      });
    }

    // Récupérer le profil utilisateur avec les tokens
    const profileResponse = await fetch(
      `https://profile.xboxlive.com/users/me/profile/settings?settings=GameDisplayName,AppDisplayName,AppDisplayPicRaw,Gamerscore,Gamertag,PublicGamerpic`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-xbl-contract-version": "3",
          Authorization: `XBL3.0 x=${xboxLiveAuth.user_hash};${xboxLiveAuth.xsts_token}`,
        },
      }
    );
    if (!profileResponse.ok) {
      throw createError({
        statusCode: 400,
        statusMessage: "Impossible de récupérer le profil Xbox",
      });
    }

    const profileData = await profileResponse.json();
    console.log(profileData.profileUsers[0]);
    console.log(profileData.profileUsers[1]);
    const profileUser = profileData.profileUsers[0];
    const settings = profileUser.settings.reduce((acc: any, setting: any) => {
      acc[setting.id] = setting.value;
      return acc;
    }, {});

    // Vérifier si le compte existe déjà
    const existingAccount = await prisma.platformAccount.findUnique({
      where: {
        userId_platform: {
          userId: user.id,
          platform: "XBOX",
        },
      },
    });

    let platformAccount;

    if (existingAccount) {
      // Mettre à jour le compte existant
      platformAccount = await prisma.platformAccount.update({
        where: { id: existingAccount.id },
        data: {
          platformId: profileUser.id,
          username: settings.Gamertag,
          displayName: settings.GameDisplayName || settings.Gamertag,
          avatarUrl: settings.PublicGamerpic,
          profileUrl: `https://account.xbox.com/en-us/profile?gamertag=${settings.Gamertag}`,
          accessToken: xboxLiveAuth.xsts_token, // Stocker le token XSTS
          refreshToken: xboxLiveAuth.user_hash, // Stocker le user hash
          isActive: true,
          lastSync: new Date(),
        },
      });
    } else {
      // Créer un nouveau compte
      platformAccount = await prisma.platformAccount.create({
        data: {
          userId: user.id,
          platform: "XBOX",
          platformId: profileUser.id,
          username: settings.Gamertag,
          displayName: settings.GameDisplayName || settings.Gamertag,
          avatarUrl: settings.AppDisplayPicRaw || settings.PublicGamerpic,
          profileUrl: `https://account.xbox.com/en-us/profile?gamertag=${settings.Gamertag}`,
          accessToken: xboxLiveAuth.xsts_token, // Stocker le token XSTS
          refreshToken: xboxLiveAuth.user_hash, // Stocker le user hash
          isActive: true,
          lastSync: new Date(),
        },
      });
    }

    return {
      success: true,
      account: platformAccount,
    };
  } catch (error) {
    console.error("Erreur lors de l'authentification Xbox:", error);

    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Erreur interne du serveur",
    });
  }
});
