// composables/configuration.js
/**
 * Composable for managing the application configuration
 */

import { isObject, snakeToCamel } from '@/modules/utils';
import { ref, onMounted, reactive } from 'vue';
const basePath = import.meta.env.BASE_URL || '/';

const mainVarsToLoad = {
    app_name: 'shacl-vue',
    page_title: 'shacl-vue',
    show_shapes_wo_id: true,
    show_classes: [],
    show_classes_with_prefix: [],
    hide_classes: [],
    hide_classes_with_prefix: [],
    no_edit_classes: [],
    allow_edit_instances: [],
    allow_copy_record_urls: true,
    editor_selection: {},
    component_config: {
        W3CISO8601YearEditor: {
            yearStart: 1925,
            yearEnd: 2077
        },
        W3CISO8601YearMonthEditor: {
            yearStart: 1925,
            yearEnd: 2077
        },
        W3CISO8601DateTimeEditor: {
            yearStart: 1925,
            yearEnd: 2077
        },
        InstancesSelectEditor: {
            fetchingsRecordsText: "Fetching records...",
        },
        PropertyShapeEditor: {
            recordNumberStepSize: 5,
        },
        NodeShapeViewer: {
            recordNumberStepSize: 5,
        },
    },
    content: {},
    display_name_autogenerate: {},
    display_name_autogenerate_placeholder: {
        default: "[?]"
    },
    id_iri: "",
    id_autogenerate: {},
    prefixes: {},
    class_icons: {},
    documentation_url: 'https://psychoinformatics-de.github.io/shacl-vue/docs/',
    source_code_url: 'https://github.com/psychoinformatics-de/shacl-vue',
    app_theme: {
        link_color: '#41b883',
        hover_color: '#1565C0',
        active_color: '#D32F2F',
        panel_color: '#41b883',
        visited_color: '#41b882',
        logo: 'shacl_vue_logo.svg',
    },
    front_page_content: "",
    id_resolves_externally: [],
    use_token: false,
    token_info: '',
    token_info_url: '',
    use_service: false,
    service_constrained_search: {
        min_characters: 4,
        typing_debounce: 800,
    },
    class_name_display: 'name',
    footer_links: [],
    gitannex_p2phttp_config: {},
};

export function useConfig(url) {
    const defaultURL = `${basePath}config.json`;
    var configURL;
    if (url) {
        if (url.indexOf('http')) {
            configURL = url;
        } else {
            configURL = `${basePath}${url}`;
        }
    } else {
        configURL = defaultURL;
    }
    const config = ref(null);
    const configFetched = ref(false);
    const configError = ref(false);
    const configVarsMain = reactive({});
    for (const [key, value] of Object.entries(mainVarsToLoad)) {
        configVarsMain[snakeToCamel(key)] = value;
    }

    onMounted(async () => {
        try {
            const response = await fetch(configURL, { cache: 'no-cache' });
            if (!response.ok) {
                configError.value = true;
                throw new Error(
                    `Error fetching config file: ${response.statusText}`
                );
            }
            config.value = await response.json();
            configFetched.value = true;
        } catch (error) {
            console.error('Fetch error:', error);
            configError.value = true;
            throw error;
        }
    });

    async function loadTextContent(url) {
        if (!url) {
            return null
        }
        try {
            const response = await fetch(url, { cache: 'no-cache' });
            if (!response.ok) {
                console.error(`Error fetching content: ${response.statusText}`)
                return null
            }
            return await response.text();
        } catch (error) {
            console.error('Error fetching content:', error);
            return null
        }
    }

    function loadConfigVars() {
        // only supports one level of recursion into objects
        for (const [key, val] of Object.entries(mainVarsToLoad)) {
            if (config.value.hasOwnProperty(key)) {
                if (isObject(config.value[key])) {
                    configVarsMain[snakeToCamel(key)] = val;
                    for (const [k, v] of Object.entries(config.value[key])) {
                        if (v) configVarsMain[snakeToCamel(key)][k] = v;
                    }
                } else {
                    configVarsMain[snakeToCamel(key)] = config.value[key];
                }
            }
        }
    }

    async function loadAllContent() {
        if (configVarsMain.content && Object.keys(configVarsMain.content).length > 0) {
            for (const src of Object.keys(configVarsMain.content)) {
                configVarsMain.content[src].value = await loadTextContent(configVarsMain.content[src].url)
            }
        }
    }

    return {
        config,
        configFetched,
        configError,
        configVarsMain,
        loadConfigVars,
        loadTextContent,
        loadAllContent,
    };
}
