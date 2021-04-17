import Vue from 'vue';
import App from './App.vue';
import './registerServiceWorker';
import router from './router';
import store from './store';
import vuetify from './plugins/vuetify';
import Vue2TouchEvents from 'vue2-touch-events';
import VueGtag from 'vue-gtag';

Vue.config.productionTip = false;

new Vue({
  router,
  store,
  vuetify,
  render: (h) => h(App)
}).$mount('#app');

Vue.use(Vue2TouchEvents);
Vue.use(
  VueGtag,
  {
    config: { id: 'G-K266ZXP2YZ' },
    globalObjectName: 'gtag'
  },
  router
);
