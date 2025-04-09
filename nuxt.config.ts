// https://nuxt.com/docs/api/configuration/nuxt-config
import vuetify, { transformAssetUrls } from "vite-plugin-vuetify";

export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
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
  },
  // pinia: {
  //   storesDirs: ["./stores/**"],
  // },
  // supabase: {
  //   redirect: false,
  // },
});
