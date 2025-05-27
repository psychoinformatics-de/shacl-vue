// Plugins
import Components from 'unplugin-vue-components/vite'
import Vue from '@vitejs/plugin-vue'
import Vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'
import ViteFonts from 'unplugin-fonts/vite'

// Utilities
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

// Git repo version
import { execSync } from 'child_process'
const commitHash = execSync('git rev-parse HEAD').toString().trim()
const commitHashShort = execSync('git rev-parse --short HEAD').toString().trim()
const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim()

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
  ],
  define: {
    'process.env': {},
    __COMMIT_HASH__: JSON.stringify(commitHash),
    __COMMIT_HASH_SHORT__: JSON.stringify(commitHashShort),
    __BRANCH__: JSON.stringify(branch),
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
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
  build: {
    outDir: 'dist/app',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: 'index.html',
    },
  },
  server: {
    port: 3000,
    mimeTypes: {
      '.vue': 'application/javascript',
    },
  },
  base: './',
})
