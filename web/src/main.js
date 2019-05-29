// Vue modules
import Vue from 'vue';
import App from './App.vue';
import router from './router';

// utils
import decoder from './utils/decoder';
import parser from './utils/parser';

Vue.mixin(decoder);
Vue.mixin(parser);
Vue.config.productionTip = false;

new Vue({
  router,
  render: h => h(App),
}).$mount('#app');
