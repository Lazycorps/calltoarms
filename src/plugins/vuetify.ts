import Vue from 'vue';
import Vuetify from "vuetify/lib";
import colors from 'vuetify/lib/util/colors'

Vue.use(Vuetify);

export default new Vuetify({
  theme: {
    dark: true,
    themes: {
      dark: {
        primary: colors.red.darken2,
        secondary: colors.red.lighten4,
        accent: colors.indigo.base,
      },
    },
  }
});
