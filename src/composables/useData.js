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
        return new Promise( async (resolve, reject) => {
            // Get graph data from url, provided either as argument (highest priority),
            // via config (mid priority), or base default (lowest priority), or get no data
            // if specified via config
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
                        console.log("getGraphData -> no url provided via argument or config, and config specifies not to use default; not fetching")
                        await rdfDS.updateSerializedGraph();
                        rdfDS.triggerReactivity();
                        resolve();
                        return
                    }
                }
            } else {
                getURL = url
            }

            var headers = { "Content-Type": "text/turtle" }
            if (token.value !== null && token.value !== "null") {
                headers['X-DumpThings-Token'] = token.value;
            }
            await rdfDS.loadRDF(getURL, headers)
            resolve();
        })
    }

    watch(rdfDS.data.graph, async () => {
        await rdfDS.updateSerializedGraph();
    }, { deep: true });


    async function fetchFromService(endpoint, arg, prefixes) {
        // endpoint: the name of the endpoint defined in the config
        // arg: the URI of the parameter to be formatted and made part of the query string
        const serviceBaseURL = config.value.service_base_url
        const serviceEndpoints = config.value.service_endpoints
        if (!(serviceBaseURL || serviceEndpoints)) {
            console.error("Service base URL and/or service endpoints not included in configuration.\nFetching data from an endpoint will not be possible.")
            return
        }

        if (Object.keys(serviceEndpoints).indexOf(endpoint) < 0) {
            console.log(`Unknown endpoint '${endpoint}' provided; continuing without making a request to configured service`)
            return
        }
        const query_string = replaceServiceIdentifier(arg, serviceEndpoints[endpoint], prefixes)
        console.log(query_string)
        var getURL = `${serviceBaseURL}${query_string}`
        if (fetchedRequests.has(getURL)) {
            console.log(`Skipping request: Data previously fetched from ${getURL}`);
            return 'skipped';
        }

        fetchedRequests.add(getURL);

        return new Promise((resolve, reject) => {
            getRdfData(getURL)
                .then(() => {
                    resolve();  // Resolve the promise when getGraphData is done
                })
                .catch(error => {
                    console.error(error);
                    fetchedRequests.delete(getURL);
                    reject(error);
                });
        });
    }

    // expose managed state as return value
    return {
        rdfDS,
        getRdfData,
        fetchFromService
    }
}
