// useData.js
import { watch, reactive } from 'vue';
import { replaceServiceIdentifier } from '@/modules/utils';
import { useToken } from '@/composables/tokens';
import { ReactiveRdfDataset } from '@/classes/ReactiveRdfDataset';

const basePath = import.meta.env.BASE_URL || '/';

export function useData(config) {
    const defaultURL = `${basePath}dlschemas_data.ttl`;
    const rdfDS = new ReactiveRdfDataset();
    const fetchedRequests = new Set();
    const fetchedPages = reactive({})
    const { token } = useToken();

    async function getRdfData(url) {
        var getURL;
        if (!url) {
            // If no url argument provided, check config
            // Config priority is:
            // - if the data_url is provided, use it and ignore use_default_data
            // - if the data_url is NOT provided, use default if use_default_data==true, else nothing
            if (config.value.data_url) {
                if (config.value.data_url.indexOf('http') >= 0) {
                    getURL = config.value.data_url;
                } else {
                    getURL = `${basePath}${config.value.data_url}`;
                }
            } else {
                if (config.value.use_default_data == true) {
                    getURL = defaultURL;
                } else {
                    console.warn(
                        'getRdfData: No valid URL to fetch RDF data. Skipping fetch.'
                    );
                    return {
                        success: false,
                        message:
                            'No valid data URL found and use_default_data is false.',
                        error: null,
                        url: null,
                    };
                }
            }
        } else {
            getURL = url;
        }
        var headers = { 'Content-Type': 'text/turtle' };
        if (token.value !== null && token.value !== 'null') {
            headers['X-DumpThings-Token'] = token.value;
        }

        const result = await rdfDS.loadRDF(getURL, headers);

        if (!result.success) {
            return {
                success: false,
                message: result.message,
                error: result.error,
                url: getURL,
            };
        }
        rdfDS.triggerReactivity();
        return {
            success: true,
            url: getURL,
        };
    }

    async function fetchFromService(endpoint, arg, prefixes) {
        // endpoint: the name of the endpoint defined in the config
        // arg: the URI of the parameter to be formatted and made part of the query string

        try {
            const serviceBaseURL = config.value.service_base_url;
            const serviceEndpoints = config.value.service_endpoints;
            if (!(serviceBaseURL || serviceEndpoints)) {
                throw new Error(
                    'Service base URL and/or service endpoints not included in configuration.\nFetching data from an endpoint will not be possible.'
                );
            }

            if (Object.keys(serviceEndpoints).indexOf(endpoint) < 0) {
                throw new Error(
                    `Unknown endpoint '${endpoint}' provided; continuing without making a request to configured service`
                );
            }

            // Handle two possibilities:
            // - serviceBaseURL is a string (backwards compatible)
            // - serviceBaseURL is an Array (latest feature)
            const baseUrls = Array.isArray(serviceBaseURL)
                ? serviceBaseURL.map((entry) => entry.url)
                : [serviceBaseURL];

            // Initialise the variable to keep track of fetched pages
            for (var b of baseUrls) {
                if (!fetchedPages.hasOwnProperty(b)) {
                    fetchedPages[b] = {
                        fetchedRequests: new Set(),
                    }
                }
            }

            let query_string = replaceServiceIdentifier(
                arg,
                serviceEndpoints[endpoint],
                prefixes
            );

            const results = [];
            let allFailed = true;
            let anyFailed = false;
            let allSkipped = true;
            const results_status = [];

            for (const baseUrl of baseUrls) {
                if (endpoint == 'get-paginated-records') {
                    // If this is the first time that a paginated request will be made
                    // for this baseURL and for this class/arg, we set the page to 1
                    // else we set it to the next page, unless the next page exceeds the
                    // total number of pages, then we just skip.
                    if (!fetchedPages[baseUrl].hasOwnProperty(arg)) {
                        query_string = query_string.replace('{page_number}', '1')
                    } else {
                        var nextPage = fetchedPages[baseUrl][arg].lastPageFetched + 1;

                        query_string = query_string.replace('{page_number}', nextPage.toString())
                        if (nextPage > fetchedPages[baseUrl][arg].totalPages) {
                            console.log(
                                `Skipping request: Last page of records already fetched for class '${arg}' at service URL '${baseUrl}' `
                            );
                            // Add result to array, then continue to next baseUrl
                            results.push({
                                success: true,
                                skipped: true,
                                url: `${baseUrl}${query_string}`,
                                allPagesFetched: true,
                            });
                            results_status.push('skipped');
                            continue;
                        }
                    }
                }

                const getURL = `${baseUrl}${query_string}`;
                if (fetchedRequests.has(getURL)) {
                    console.log(
                        `Skipping request: Data previously fetched from ${getURL}`
                    );
                    // Add result to array, then continue to next baseUrl
                    results.push({
                        success: true,
                        skipped: true,
                        url: getURL,
                    });
                    results_status.push('skipped');
                    continue;
                }

                fetchedRequests.add(getURL);
                let result;
                if (endpoint == 'get-paginated-records') {
                    result = await getPaginatedRdfData(getURL);
                } else {
                    result = await getRdfData(getURL);
                }
                
                if (!result.success) {
                    fetchedRequests.delete(getURL); // Allow retry
                    results.push({
                        url: getURL,
                        success: false,
                        skipped: false,
                        message: result.message || 'Failed to fetch RDF data.',
                    });
                    results_status.push('failed');
                    anyFailed = true;
                } else {
                    results.push({
                        url: getURL,
                        success: true,
                        skipped: false,
                        pageMeta: result.pageMeta ? result.pageMeta : {}
                    });
                    allFailed = false;
                    results_status.push('success');

                    // If this was a pagination request, we need to store details
                    if (result.pageMeta){
                        console.log("Storing pagemeta now")
                        // add the complete getURL to the Set of fetched urls
                        // The plan is to use it somewhare but this not used yet
                        fetchedPages[baseUrl].fetchedRequests.add(getURL)
                        // If, for the current baseurl, we have NOT fetched records
                        // of the current class (arg) before, we need to set the first
                        // value from the page metadata
                        if (!fetchedPages[baseUrl].hasOwnProperty(arg)) {
                            fetchedPages[baseUrl][arg] = {
                                totalItems: result.pageMeta.total,
                                totalPages: result.pageMeta.pages,
                                lastPageFetched: result.pageMeta.page,
                            }
                        } else {
                            // If records for the current class (arg) have already been
                            // fetched before, only set the lastPageFetched value. we
                            // assume the rest stays constant.
                            fetchedPages[baseUrl][arg]["lastPageFetched"] = result.pageMeta.page
                        }
                    }
                }
            }
            // Now we have an array of results
            // Process all
            if (anyFailed) {
                var error = new Error(
                    'One or more RDF data fetch attempts failed.'
                );
                return {
                    success: false,
                    message: error.message,
                    status: Array.from(new Set(results_status)),
                    error: error,
                    url: results,
                };
            }
            for (var r of results) {
                if (!r.skipped) {
                    allSkipped = false;
                    break;
                }
            }
            return {
                success: true,
                skipped: allSkipped,
                status: Array.from(new Set(results_status)),
                url: results,
            };
        } catch (error) {
            return {
                success: false,
                message: error.message,
                status: null,
                error: error,
                url: null,
            };
        }
    }

    async function getPaginatedRdfData(getURL) {
        var headers = {};
        let metadata;
        if (token.value !== null && token.value !== 'null') {
            headers['X-DumpThings-Token'] = token.value;
        }
        try {
            const response = await fetch(getURL, headers);
            if (!response.ok) {
                throw new Error(`Response status: ${response.status}`);
            }
            const json = await response.json();
            metadata = {
                page: json.page,
                pages: json.pages,
                total: json.total,
                size: json.size,
            }
            json.items.forEach(element => {
                rdfDS.parseTTL(element)
            });
        } catch (error) {
            return {
                success: false,
                message: error.message,
                error: error,
                url: getURL,
            };
        }
        rdfDS.triggerReactivity();
        return {
            success: true,
            url: getURL,
            pageMeta: metadata,
        };

    }

    function hasUnfetchedPages(IRI) {
        for (const topLevelKey in fetchedPages) {
            const section = fetchedPages[topLevelKey];
            if (section[IRI]) {
                if (section[IRI].totalPages > section[IRI].lastPageFetched) {
                    return true;
                }
            }
        }
        return false;
    }

    // expose managed state as return value
    return {
        rdfDS,
        getRdfData,
        fetchFromService,
        fetchedPages,
        hasUnfetchedPages,
    };
}
