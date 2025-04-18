import { defineCustomElement, createApp, h } from 'vue';
import ShaclVue from '@/components/ShaclVue.ce.vue'; // Your main Vue component
import { createVuetify } from 'vuetify';
import 'vuetify/styles'; // Vuetify core CSS
import '@mdi/font/css/materialdesignicons.css'; // Material Design Icons
import { aliases, mdi } from 'vuetify/iconsets/mdi';

// Create the Vuetify instance
const vuetify = createVuetify({
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  },
});

// Define the wrapper as a custom element
const ShaclVueElement = defineCustomElement({
  props: {
        configUrl: {
          type: String,
          default: '', // Default value for configUrl
        },
      },
  setup(_, { expose }) {
    // Create the app instance
    const app = createApp({
      render: () => h(ShaclVue, { configUrl: "" }), // Render your main component
    });

    // Install Vuetify
    app.use(vuetify);

    // Mount the app to a root element for the custom element
    const root = document.createElement('div');
    app.mount(root);

    // Expose lifecycle hooks if needed (optional)
    expose();

    return () => h(root); // Render the mounted root
  },
});

// Register the custom element
customElements.define('shacl-vue', ShaclVueElement);



// import { defineCustomElement, createApp, h } from 'vue';
// import ShaclVue from '@/components/ShaclVue.vue'; // Your Vue component
// import { createVuetify } from 'vuetify';
// import 'vuetify/styles'; // Vuetify core CSS
// import '@mdi/font/css/materialdesignicons.css'; // Material Design Icons
// import { aliases, mdi } from 'vuetify/iconsets/mdi';

// // Create the Vuetify instance
// const vuetify = createVuetify({
//   icons: {
//     defaultSet: 'mdi',
//     aliases,
//     sets: {
//       mdi,
//     },
//   },
// });

// // Define the custom element
// const ShaclVueElement = defineCustomElement({
//   props: {
//     configUrl: {
//       type: String,
//       default: '', // Default value for configUrl
//     },
//   },

//   setup(props) {
//     // Create the Vue app and pass the configUrl as a prop
//     const app = createApp({
//       render: () => h(ShaclVue, { configUrl: props.configUrl }), // Pass configUrl to the Vue component
//     });

//     // Install Vuetify
//     app.use(vuetify);

//     // Mount the app to a new div element
//     const root = document.createElement('div');
//     app.mount(root);

//     return () => h(root); // Render the mounted root
//   },

//   // Watch for changes in the `configUrl` attribute (if needed)
//   observedAttributes: ['configUrl'],
//   attributeChangedCallback(name, oldValue, newValue) {
//     if (name === 'configUrl' && oldValue !== newValue) {
//       // Ensure __vueApp__ is defined before updating the prop
//       if (this.__vueApp__) {
//         this.__vueApp__.setupProps.configUrl = newValue;
//         this.__vueApp__.update(); // Optionally trigger an update if needed
//       }
//     }
//   },
  
// });

// // Register the custom element
// customElements.define('shacl-vue', ShaclVueElement);

