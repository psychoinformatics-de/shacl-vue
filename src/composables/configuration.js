// composables/configuration.js
/**
 * Composable for managing the application configuration
 */


import { ref, onMounted} from 'vue'
const basePath = import.meta.env.BASE_URL || '/';

export function useConfig() {

  const configURL = `${basePath}config.json`
  const config = ref(null);
  const configFetched = ref(false);

  onMounted(async () => {
    try {
      const response = await fetch(configURL, {cache: "no-cache"});
      if (!response.ok) {
        throw new Error(`Error fetching config file: ${response.statusText}`);
      }
      config.value = await response.json();
      configFetched.value = true;
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  });
  return {
    config,
    configFetched,
  };
}
