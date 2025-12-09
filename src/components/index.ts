import { App } from 'vue';
import Breadcrumb from './breadcrumb/index.vue';
import LoadingSpinner from './loading-spinner/index.vue';

export default {
  install(Vue: App) {
    Vue.component('Breadcrumb', Breadcrumb);
    Vue.component('LoadingSpinner', LoadingSpinner);
  },
};

export { Breadcrumb, LoadingSpinner };
