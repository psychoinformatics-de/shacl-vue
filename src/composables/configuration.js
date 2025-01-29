// composables/configuration.js
/**
 * Composable for managing the application configuration
 */

import { ref, onMounted } from 'vue'
const basePath = import.meta.env.BASE_URL || '/';

export function useConfig(url) {
    const defaultURL = `${basePath}config.json`
    var configURL
    if (url) {
        if (url.indexOf('http')) {
            configURL = url
        } else {
            configURL = `${basePath}${url}`;
        }
    } else {
        configURL = defaultURL
    }
    const config = ref(null);
    const configFetched = ref(false);
    const configError = ref(false);

    onMounted(async () => {
        try {
            const response = await fetch(configURL, {cache: "no-cache"});
            if (!response.ok) {
                configError.value = true;
                console.log(`Provided config file path: ${configURL}`)
                throw new Error(`Error fetching config file: ${response.statusText}`);
            }
            config.value = await response.json();
            configFetched.value = true;

        } catch (error) {
            console.error('Fetch error:', error);
            configError.value = true;
            throw error;
        }
    });

    return {
        config,
        configFetched,
        configError,
    };
}