// Entry point for Vue-based usage
import ShaclVue from '@/components/ShaclVue.vue';

// Default export for manual global registration
export default {
  install(app) {
    app.component('ShaclVue', ShaclVue);
  },
};