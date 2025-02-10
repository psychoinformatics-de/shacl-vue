// graphdata.js
import { reactive, ref, inject, watch} from 'vue'
import { readRDF } from '@/modules/io'
import rdf from 'rdf-ext';
import { SHACL , RDF} from '../modules/namespaces'
import formatsPretty from '@rdfjs/formats/pretty.js'
import { downloadTSV, toCURIE, toIRI, replaceServiceIdentifier} from '@/modules/utils';
import { useToken } from '@/composables/tokens'

const basePath = import.meta.env.BASE_URL || '/';

export function useGraphData(config) {

    const defaultURL = `${basePath}dlschemas_data.ttl`
    const graphData = createReactiveDataset();
    const serializedGraphData = ref('');
    const graphTriples = ref([]);
    var graphPrefixes = reactive({});
        var prefixArray = ref([]);
        var prefixes_ready = ref(false);
    const rdfPretty = rdf.clone()
    rdfPretty.formats.import(formatsPretty)
    const batchMode = ref(false);
    const fetchedRequests = new Set()
    const { token } = useToken();

    async function getGraphData(url) {
        return new Promise((resolve, reject) => {
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
                        updateSerializedData();
                        triggerReactivity();
                        resolve();
                        return
                    }
                }
            } else {
                getURL = url
            }
            batchMode.value = true;
            var headers = { "Content-Type": "text/turtle" }
            if (token.value !== null && token.value !== "null") {
                headers['X-DumpThings-Token'] = token.value;
            }
            readRDF(getURL, headers)
                .then(quadStream => {
                    // Load prefixes
                    quadStream.on('prefix', (prefix, ns) => {
                        graphPrefixes[prefix] = ns.value;
                        prefixArray.value.push(ns.value)
                    }).on('end', () => {
                        prefixes_ready.value = true
                    })
                    // Load data
                    quadStream.on('data', quad => {
                        graphData.add(quad)
                    }).on('end', () => {
                        updateSerializedData();
                        triggerReactivity();
                        batchMode.value = false;
                        resolve();
                    }).on('error', (error) => {
                        console.error('Error in quadStream:', error);
                        resolve()
                    });
                })
                .catch(error => {
                    console.error('Error reading TTL data:', error);
                    resolve()
                });
        })
    }

    async function updateSerializedData() {
        serializedGraphData.value = (await rdfPretty.io.dataset.toText('text/turtle', graphData)).trim()
    }

    watch(graphData, async () => {
        await updateSerializedData();
        updateGraphTriples();
    }, { deep: true });


    function updateGraphTriples() {
        var gt = []
        graphData.forEach(quad => {
            gt.push(`${quad.subject.value} - ${quad.predicate.value} - ${quad.object.value}`)
        });
        graphTriples.value = gt
    }

    function createReactiveDataset() {
        const dataset = rdf.dataset();
        const proxy = new Proxy(dataset, {
            get(target, prop, receiver) {
                const value = Reflect.get(target, prop, receiver);
                if (typeof value === 'function' && ['add', 'delete', 'deleteMatches', 'toCanonical', 'toStream', 'toString'].includes(prop)) {
                    return function (...args) {
                        const result = value.apply(target, args);
                        if (!batchMode.value) {
                            triggerReactivity(); // Trigger reactivity when dataset is mutated
                        }
                        return result;
                    };
                }
                return value;
            }
        });
        // Initialize the dummy property to ensure reactivity
        proxy._dummy = false;
        return reactive(proxy);
    }

    function triggerReactivity() {
        // Toggle the dummy property to trigger reactivity
        graphData._dummy = !graphData._dummy;
    }


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
            return;
        }

        fetchedRequests.add(getURL);

        return new Promise((resolve, reject) => {
            getGraphData(getURL)
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
        graphData,
        batchMode,
        getGraphData,
        graphPrefixes,
        serializedGraphData,
        graphTriples,
        updateSerializedData,
        triggerReactivity,
        fetchFromService
    }
}
