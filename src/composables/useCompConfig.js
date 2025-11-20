// src/composables/useCompConfig.js
import { getCurrentInstance, toRaw} from 'vue';

export function useCompConfig(config) {
    const componentName = getCurrentInstance().type.name;
    let componentConfig = undefined;
    if (config) {
        componentConfig = config.componentConfig?.[componentName] ?? {}
    }
    if (componentConfig) {
        componentConfig = toRaw(componentConfig)
    }
    return { componentName, componentConfig};
}
