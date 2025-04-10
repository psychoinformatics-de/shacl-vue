// Plugins
import Components from 'unplugin-vue-components/vite'
import Vue from '@vitejs/plugin-vue'
import Vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'
import ViteFonts from 'unplugin-fonts/vite'

// Utilities
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import { dirname, resolve} from 'node:path'

// https://vitejs.dev/config/
export default defineConfig(
  {
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
      lib: {
        entry: {
          'shacl-vue': './index.js',
        },
        name: 'ShaclVue',
        fileName: (format, entryName) => `${entryName}.${format}.js`,
      },
      outDir: 'dist/lib',
      emptyOutDir: true,
      rollupOptions: {
        external: ['vue'],
        output: {
          globals: {
            vue: 'vue',
          }
        }
      },
    },
    server: {
      port: 3000,
      mimeTypes: {
        '.vue': 'application/javascript',
      },
    },
    base: './',
    test: {
      globals: true,
      environment: 'happy-dom',
      pool: "vmThreads",
    }
  }
)
