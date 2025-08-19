// server/api/library/platforms/xbox/init.get.ts
import { defineEventHandler, sendRedirect, setCookie, createError } from "h3";
import { serverSupabaseUser } from "#supabase/server";
import { randomBytes, createHash } from "crypto";

// Fonction pour générer un code_verifier aléatoire
function generateCodeVerifier(): string {
  return randomBytes(32).toString("base64url");
}

// Fonction pour générer le code_challenge depuis le code_verifier
function generateCodeChallenge(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

export default defineEventHandler(async (event) => {
  // Vérifier l'authentification
  const user = await serverSupabaseUser(event);
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Authentification requise",
    });
  }

  const config = useRuntimeConfig();

  // Générer un state pour la sécurité CSRF
  const state = randomBytes(16).toString("hex");

  // Générer PKCE code_verifier et code_challenge
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  // Stocker le state et le code_verifier en cookies sécurisés
  setCookie(event, "xbox_auth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10, // 10 minutes
  });

  setCookie(event, "xbox_code_verifier", codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10, // 10 minutes
  });

  // Scopes nécessaires pour Xbox Live
  const scopes = [
    "Xboxlive.signin",
    "offline_access", // Pour le refresh token
  ];

  // Construire l'URL d'autorisation Microsoft avec PKCE
  // Utiliser /consumers/ pour les comptes personnels Microsoft uniquement
  const authUrl = new URL(
    "https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize"
  );
  authUrl.searchParams.append("client_id", config.microsoftClientId);
  authUrl.searchParams.append("response_type", "code");
  authUrl.searchParams.append(
    "redirect_uri",
    `${config.public.baseUrl}/api/library/platforms/xbox/callback`
  );
  authUrl.searchParams.append("scope", scopes.join(" "));
  authUrl.searchParams.append("state", state);
  authUrl.searchParams.append("response_mode", "query");
  authUrl.searchParams.append("prompt", "select_account");

  // Ajouter les paramètres PKCE
  authUrl.searchParams.append("code_challenge", codeChallenge);
  authUrl.searchParams.append("code_challenge_method", "S256");

  // Rediriger vers Microsoft
  return sendRedirect(event, authUrl.toString());
});
