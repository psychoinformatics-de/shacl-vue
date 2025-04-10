// classdata.js
import { reactive } from 'vue'
import { ClassDataset } from 'shacl-tulip' 

const basePath = import.meta.env.BASE_URL || '/';

export function useClasses(config) {
    const defaultURL = `${basePath}dlschemas_owl.ttl`;
    const classDS = new ClassDataset(reactive({}));

    async function getClassData(url) {
        var getURL
        if (!url) {
            // If no url argument provided, check config
            // Config priority is:
            // - if the class_url is provided, use it and ignore use_default_classes
            // - if the class_url is NOT provided, use default if use_default_classes==true, else nothing
            if (config.value.class_url) {
                console.log("- specified via config")
                if (config.value.class_url.indexOf('http') >= 0) {
                    console.log("- contains http")
                    getURL = config.value.class_url
                } else {
                    console.log("- does not contain http")
                    getURL = `${basePath}${config.value.class_url}`;
                }
            } else {
                if (config.value.use_default_classes == true) {
                    getURL = defaultURL
                } else {
                    console.log("getClassData -> no url provided via argument or config, and config specifies not to use default; not fetching")
                    return
                }
            }
        } else {
            getURL = url
        }
        await classDS.loadRDF(getURL)
    }
    // expose managed state as return value
    return {
        classDS,
        getClassData,
    }
}
