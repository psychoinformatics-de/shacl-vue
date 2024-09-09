// composables/configuration.js
/**
 * Composable for managing the application configuration
 */


import { ref, onMounted} from 'vue'
export function useConfig() {

  const configURL = new URL("@/assets/config.json", import.meta.url).href
  const config = ref(null);
  const configFetched = ref(false);

  onMounted(async () => {
    try {
      const response = await fetch(configURL);
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
