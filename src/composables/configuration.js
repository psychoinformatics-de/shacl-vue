// composables/configuration.js
/**
 * Composable for managing the application configuration
 */

import { isObject, snakeToCamel } from '@/modules/utils';
import { ref, onMounted, reactive } from 'vue'
const basePath = import.meta.env.BASE_URL || '/';

const mainVarsToLoad = {
    "show_shapes_wo_id": true,
    "hide_classes": [],
    "id_autogenerate": {},
    "prefixes": {},
    "class_icons": {},
    "app_name": "shacl-vue",
    "documentation_url": "https://psychoinformatics-de.github.io/shacl-vue/docs/",
    "source_code_url": "https://github.com/psychoinformatics-de/shacl-vue",
    "app_theme": {
        "link_color": "#41b883",
        "hover_color": "#1565C0",
        "active_color": "#D32F2F",
        "panel_color": "#41b883",
        "logo": "shacl_vue_logo.svg",
    },
    "use_token": false,
    "token_info": "",
    "token_info_url": "",
    "use_service": false,
    "class_name_display": "name"
}

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
    const configVarsMain = reactive({});
    for (const [key, value] of Object.entries(mainVarsToLoad)) {
        configVarsMain[snakeToCamel(key)] = value
    }

    onMounted(async () => {
        try {
            const response = await fetch(configURL, {cache: "no-cache"});
            if (!response.ok) {
                configError.value = true;
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

    function loadConfigVars () {
        // only supports one level of recursion into objects
        for (const [key, val] of Object.entries(mainVarsToLoad)) {
            if (config.value.hasOwnProperty(key)) {
                if (isObject(config.value[key])) {
                    configVarsMain[snakeToCamel(key)] = val
                    for (const [k, v] of Object.entries(config.value[key])) {
                        if (v) configVarsMain[snakeToCamel(key)][k] = v
                    }
                } else {
                    configVarsMain[snakeToCamel(key)] = config.value[key]
                }
            }
        }
    }
    return {
        config,
        configFetched,
        configError,
        configVarsMain,
        loadConfigVars,
    };
}