// https://nuxt.com/docs/api/configuration/nuxt-config
import vuetify, { transformAssetUrls } from "vite-plugin-vuetify";

export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  ssr: false,
  devtools: { enabled: true },
  build: {
    transpile: ["vuetify"],
  },
  modules: [
    "@nuxt/eslint",
    "@nuxtjs/supabase",
    (_options, nuxt) => {
      nuxt.hooks.hook("vite:extendConfig", (config) => {
        // @ts-expect-error not work if not
        config.plugins.push(vuetify({ autoImport: true }));
      });
    },
    "@prisma/nuxt",
    "@pinia/nuxt",
    "@vueuse/nuxt",
  ],
  vite: {
    vue: {
      template: {
        transformAssetUrls,
      },
    },
    resolve: {
      alias: {
        ".prisma/client/index-browser":
          "./node_modules/.prisma/client/index-browser.js",
      },
    },
  },
  runtimeConfig: {
    apiKey: "",
    supabaseUrl: process.env.SUPABASE_URL,
    databaseUrl: process.env.DATABASE_URL,
    directUrl: process.env.DIRECT_URL,
    twitchToken: process.env.TWITCH_TOKEN,
    twitchSecret: process.env.TWITCH_SECRET,
    twitchClientId: process.env.TWITCH_CLIENT_ID,
    //shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,

    // Steam API configuration
    steamApiKey: process.env.STEAM_API_KEY,

    // Firebase Admin SDK configuration (server-side)
    firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
    firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    firebasePrivateKey: process.env.FIREBASE_PRIVATE_KEY,

    public: {
      // Firebase Web SDK configuration (client-side)
      firebaseApiKey: process.env.FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.FIREBASE_APP_ID,
      firebaseVapidKey: process.env.FIREBASE_VAPID_KEY,
    },
  },
  // pinia: {
  //   storesDirs: ["./stores/**"],
  // },
  supabase: {
    redirect: false,
  },
});
