/**
 * main.js
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Plugins
import { registerPlugins } from '@/plugins'

// Components
import App2 from './App2.vue'

// Composables
import { createApp } from 'vue'

const app = createApp(App2)

registerPlugins(app)

app.mount('#app');