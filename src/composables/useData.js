// graphdata.js
import { watch} from 'vue'
import { replaceServiceIdentifier} from '@/modules/utils';
import { useToken } from '@/composables/tokens'
import { ReactiveRdfDataset } from '@/classes/ReactiveRdfDataset';

const basePath = import.meta.env.BASE_URL || '/';

export function useData(config) {

    const defaultURL = `${basePath}dlschemas_data.ttl`
    const rdfDS = new ReactiveRdfDataset();
    const fetchedRequests = new Set()
    const { token } = useToken();

    async function getRdfData(url) {
        var getURL
        if (!url) {
            // If no url argument provided, check config
            // Config priority is:
            // - if the data_url is provided, use it and ignore use_default_data
            // - if the data_url is NOT provided, use default if use_default_data==true, else nothing
            if (config.value.data_url) {
                if (config.value.data_url.indexOf('http')>=0) {
                    getURL = config.value.data_url
                } else {
                    getURL = `${basePath}${config.value.data_url}`;
                }
            } else {
                if (config.value.use_default_data == true) {
                    getURL = defaultURL
                } else {
                    console.warn("getRdfData: No valid URL to fetch RDF data. Skipping fetch.");
                    return {
                        success: false,
                        message: "No valid data URL found and use_default_data is false.",
                        error: null,
                        url: null
                    };
                }
            }
        } else {
            getURL = url
        }
        var headers = { "Content-Type": "text/turtle" }
        if (token.value !== null && token.value !== "null") {
            headers['X-DumpThings-Token'] = token.value;
        }

        const result = await rdfDS.loadRDF(getURL, headers)

        if (!result.success) {
            return {
                success: false,
                message: result.message,
                error: result.error,
                url: getURL
            };
        }
        await rdfDS.updateSerializedGraph()
        rdfDS.triggerReactivity()
        return {
            success: true,
            url: getURL
        }
    }

    watch(rdfDS.data.graph, async () => {
        await rdfDS.updateSerializedGraph();
    }, { deep: true });

    async function fetchFromService(endpoint, arg, prefixes) {
        // endpoint: the name of the endpoint defined in the config
        // arg: the URI of the parameter to be formatted and made part of the query string

        try {
            const serviceBaseURL = config.value.service_base_url
            const serviceEndpoints = config.value.service_endpoints
            if (!(serviceBaseURL || serviceEndpoints)) {
                throw new Error("Service base URL and/or service endpoints not included in configuration.\nFetching data from an endpoint will not be possible.")
            }

            if (Object.keys(serviceEndpoints).indexOf(endpoint) < 0) {
                throw new Error(`Unknown endpoint '${endpoint}' provided; continuing without making a request to configured service`)
            }

            // Handle two possibilities:
            // - serviceBaseURL is a string (backwards compatible)
            // - serviceBaseURL is an Array (latest feature)
            const baseUrls = Array.isArray(serviceBaseURL) ? serviceBaseURL.map(entry => entry.url) : [serviceBaseURL];

            const query_string = replaceServiceIdentifier(arg, serviceEndpoints[endpoint], prefixes)

            const results = [];
            let allFailed = true;
            let anyFailed = false;

            for (const baseUrl of baseUrls) {
                const getURL = `${baseUrl}${query_string}`;
                if (fetchedRequests.has(getURL)) {
                    console.log(`Skipping request: Data previously fetched from ${getURL}`);
                    // Add result to array, then continue to next baseUrl
                    results.push({
                        success: true,
                        skipped: true,
                        url: getURL
                    });
                    continue;
                }

                fetchedRequests.add(getURL);
                const result = await getRdfData(getURL);
                if (!result.success) {
                    fetchedRequests.delete(getURL); // Allow retry
                    results.push({
                        url: getURL,
                        success: false,
                        message: result.message || "Failed to fetch RDF data."
                    });
                    anyFailed = true;
                } else {
                    results.push({
                        url: getURL,
                        success: true,
                    });
                    allFailed = false;
                }
            }
            if (anyFailed) {
                throw new Error("One or more RDF data fetch attempts failed.");
            }
            return {
                success: true,
                url: results
            };
        } catch (error) {
            return {
                success: false,
                message: error.message,
                error: error,
                url: null
            };
        }
    }

    // expose managed state as return value
    return {
        rdfDS,
        getRdfData,
        fetchFromService
    }
}
