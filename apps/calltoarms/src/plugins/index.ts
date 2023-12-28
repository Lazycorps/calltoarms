/**
 * plugins/index.ts
 *
 * Automatically included in `./src/main.ts`
 */

// Plugins
import vuetify from "./vuetify";
import pinia from "../store";
import router from "../router";
import { VueFire, VueFireAuth } from "vuefire";
import { firebaseApp } from "./firebase";
// Types
import type { App } from "vue";

export function registerPlugins(app: App) {
  app
    .use(vuetify)
    .use(router)
    .use(pinia)
    .use(VueFire, {
      firebaseApp,
      modules: [
        // ... other modules
        VueFireAuth(),
      ],
    });
}
