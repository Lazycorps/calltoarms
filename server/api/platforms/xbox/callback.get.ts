/* eslint-disable @typescript-eslint/no-explicit-any */
// server/api/platforms/xbox/callback.ts
// Configuration pour PUBLIC CLIENT avec comptes personnels Microsoft uniquement

import {
  defineEventHandler,
  getQuery,
  createError,
  getCookie,
  deleteCookie,
  sendRedirect,
} from "h3";
import { serverSupabaseUser } from "#supabase/server";
import prisma from "../../../../lib/prisma";

interface MicrosoftTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

interface XboxLiveAuthResponse {
  Token: string;
  DisplayClaims: {
    xui: Array<{
      uhs: string;
      xid: string;
    }>;
  };
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();

  try {
    const query = getQuery(event);
    const { code, state, error, error_description } = query;

    if (error) {
      console.error("Erreur Microsoft OAuth:", { error, error_description });
      const redirectUrl = new URL(`${config.public.baseUrl}/profile/platforms`);
      redirectUrl.searchParams.append("xbox_linked", "false");
      redirectUrl.searchParams.append(
        "error",
        error_description || error || "Authentication failed"
      );
      return sendRedirect(event, redirectUrl.toString());
    }

    const user = await serverSupabaseUser(event);
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: "Authentification requise",
      });
    }

    const savedState = getCookie(event, "xbox_auth_state");
    if (!savedState || savedState !== state) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid state parameter",
      });
    }

    const codeVerifier = getCookie(event, "xbox_code_verifier");
    if (!codeVerifier) {
      throw createError({
        statusCode: 400,
        statusMessage: "Missing code verifier",
      });
    }

    deleteCookie(event, "xbox_auth_state");
    deleteCookie(event, "xbox_code_verifier");

    if (!code) {
      throw createError({
        statusCode: 400,
        statusMessage: "Missing authorization code",
      });
    }

    // 1. Échanger le code contre un token Microsoft
    // PUBLIC CLIENT : PAS de client_secret, seulement PKCE
    const scopes = [
      "Xboxlive.signin",
      "offline_access", // Pour le refresh token
    ];

    const tokenBody = new URLSearchParams({
      client_id: config.microsoftClientId,
      // PAS de client_secret pour public client
      code: String(code),
      grant_type: "authorization_code",
      redirect_uri: `${config.public.baseUrl}/api/platforms/xbox/callback`,
      code_verifier: codeVerifier, // PKCE obligatoire
      scope: scopes.join(" "), // Ajouter le scope dans le body
    });

    // Utiliser /consumers/ pour les comptes personnels Microsoft
    const tokenResponse = await $fetch<MicrosoftTokenResponse>(
      "https://login.microsoftonline.com/consumers/oauth2/v2.0/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Origin: `${config.baseUrl}`,
        },
        body: tokenBody.toString(),
      }
    ).catch((error) => {
      console.error("Erreur token exchange:", error.data || error);
      throw createError({
        statusCode: 400,
        statusMessage: `Token exchange failed: ${
          error.data?.error_description || error.message
        }`,
      });
    });

    // 2. Xbox Live User Token
    const xblUserTokenResponse = await $fetch<any>(
      "https://user.auth.xboxlive.com/user/authenticate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          RelyingParty: "http://auth.xboxlive.com",
          TokenType: "JWT",
          Properties: {
            AuthMethod: "RPS",
            SiteName: "user.auth.xboxlive.com",
            RpsTicket: `d=${tokenResponse.access_token}`,
          },
        },
      }
    );

    // 3. XSTS Token
    const xstsTokenResponse = await $fetch<XboxLiveAuthResponse>(
      "https://xsts.auth.xboxlive.com/xsts/authorize",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          RelyingParty: "http://xboxlive.com",
          TokenType: "JWT",
          Properties: {
            UserTokens: [xblUserTokenResponse.Token],
            SandboxId: "RETAIL",
          },
        },
      }
    ).catch((error) => {
      if (error.data?.XErr) {
        const xErr = error.data.XErr;
        let errorMessage = "Xbox Live authentication failed";

        switch (xErr) {
          case 2148916233:
            errorMessage =
              "Ce compte Microsoft n'a pas de profil Xbox. Veuillez créer un profil Xbox d'abord.";
            break;
          case 2148916235:
            errorMessage = "Xbox Live est interdit dans votre pays/région.";
            break;
          case 2148916238:
            errorMessage =
              "Ce compte est un compte enfant. L'autorisation parentale est requise.";
            break;
        }

        throw createError({
          statusCode: 403,
          statusMessage: errorMessage,
        });
      }
      throw error;
    });

    const userHash = xstsTokenResponse.DisplayClaims.xui[0].uhs;
    const xuid = xstsTokenResponse.DisplayClaims.xui[0].xid;
    const xstsToken = xstsTokenResponse.Token;

    // 4. Récupérer le profil Xbox
    const profileResponse = await $fetch<any>(
      "https://profile.xboxlive.com/users/me/profile/settings",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-xbl-contract-version": "3",
          Authorization: `XBL3.0 x=${userHash};${xstsToken}`,
        },
        query: {
          settings: "GameDisplayName,Gamertag,PublicGamerpic,Gamerscore",
        },
      }
    );

    const profileUser = profileResponse.profileUsers[0];
    const settings = profileUser.settings.reduce((acc: any, setting: any) => {
      acc[setting.id] = setting.value;
      return acc;
    }, {});

    // 5. Sauvegarder en base de données
    const accountData = {
      platformId: xuid,
      username: settings.Gamertag,
      displayName: settings.GameDisplayName || settings.Gamertag,
      avatarUrl: settings.PublicGamerpic,
      profileUrl: `https://account.xbox.com/profile?gamertag=${encodeURIComponent(
        settings.Gamertag
      )}`,
      accessToken: xstsToken,
      refreshToken: tokenResponse.refresh_token,
      isActive: true,
      lastSync: new Date(),
      metadata: {
        userHash,
        xuid,
        gamerscore: settings.Gamerscore || "0",
        msAccessToken: tokenResponse.access_token,
        xblUserToken: xblUserTokenResponse.Token,
        msTokenExpiry: new Date(
          Date.now() + tokenResponse.expires_in * 1000
        ).toISOString(),
        xstsTokenExpiry: new Date(Date.now() + 3600 * 1000).toISOString(),
      },
    };

    const existingAccount = await prisma.platformAccount.findUnique({
      where: {
        userId_platform: {
          userId: user.id,
          platform: "XBOX",
        },
      },
    });

    if (existingAccount) {
      await prisma.platformAccount.update({
        where: { id: existingAccount.id },
        data: accountData,
      });
    } else {
      await prisma.platformAccount.create({
        data: {
          userId: user.id,
          platform: "XBOX",
          ...accountData,
        },
      });
    }

    const redirectUrl = new URL(`${config.public.baseUrl}/gameslibrary`);
    redirectUrl.searchParams.append("xbox_linked", "true");
    redirectUrl.searchParams.append("status", "success");

    return sendRedirect(event, redirectUrl.toString());
  } catch (error: any) {
    console.error("Erreur:", error);
    const redirectUrl = new URL(`${config.public.baseUrl}/gameslibrary`);
    redirectUrl.searchParams.append("xbox_linked", "false");
    redirectUrl.searchParams.append(
      "error",
      error?.statusMessage || "Authentication failed"
    );
    return sendRedirect(event, redirectUrl.toString());
  }
});
