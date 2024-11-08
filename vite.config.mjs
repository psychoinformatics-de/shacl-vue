// Plugins
import Components from 'unplugin-vue-components/vite'
import Vue from '@vitejs/plugin-vue'
import Vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'
import ViteFonts from 'unplugin-fonts/vite'

// Utilities
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

// Polyfill stuff
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    Vue({
      template: { transformAssetUrls }
    }),
    // https://github.com/vuetifyjs/vuetify-loader/tree/master/packages/vite-plugin#readme
    Vuetify(),
    Components(),
    ViteFonts({
      google: {
        families: [{
          name: 'Roboto',
          styles: 'wght@100;300;400;500;700;900',
        }],
      },
    }),
    nodePolyfills(),
  ],
  define: {
    'process.env': {}, 
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'readable-stream': path.resolve(__dirname, 'node_modules/readable-stream'),
    },
    extensions: [
      '.js',
      '.json',
      '.jsx',
      '.mjs',
      '.ts',
      '.tsx',
      '.vue',
    ],
  },
  optimizeDeps: {
    include: ['rdf-object', 'readable-stream'],
  },
  build: {
    rollupOptions: {
      plugins: [
        nodePolyfills(),
      ]
    }
  },
  server: {
    port: 3000,
    mimeTypes: {
      '.vue': 'application/javascript',
    },
  },
  base: '/shacl-vue/',
})
