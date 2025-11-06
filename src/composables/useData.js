// useData.js
import { ref, reactive, toRaw } from 'vue';
import { findObjectByKey, replaceServiceIdentifier } from '@/modules/utils';
import { useToken } from '@/composables/tokens';
import { ReactiveRdfDataset } from '@/classes/ReactiveRdfDataset';

const basePath = import.meta.env.BASE_URL || '/';

export function useData(config) {
    const defaultURL = `${basePath}dlschemas_data.ttl`;
    const rdfDS = new ReactiveRdfDataset();
    const fetchedRequests = new Set();
    const fetchedPages = reactive({})
    const { token } = useToken();
    const http401response = ref(false);

    async function fetchFromService(endpoint, arg, prefixes, matchText = '') {
        // endpoint: the name of the endpoint defined in the config
        // - e.g.: 'get-paginated-records'
        // arg: the URI of the parameter to be formatted and made part of the query string
        // - e.g.: 'https://concepts.trr379.de/s/dfg-cp-survey/unreleased/DSCOrganization'
        // prefixes: object with prefixes and associated namespaces, necessary for constructing GET request url
        // matchText: text for constrained request
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
            let base_query_string = replaceServiceIdentifier(
                arg,
                serviceEndpoints[endpoint],
                prefixes
            );
            let query_string = base_query_string
            const results = [];
            let allFailed = true;
            let anyFailed = false;
            let allSkipped = true;
            const results_status = [];
            for (const baseUrl of baseUrls) {
                if (endpoint.includes('get-paginated-records')) {
                    // If this is the first time that a paginated request will be made
                    // for this baseURL and for this class/arg and for this matching parameter,
                    // we set the page to 1, else we set it to the next page, unless the next
                    // page exceeds the total number of pages, then we just skip.
                    if (
                        !fetchedPages[baseUrl].hasOwnProperty(arg) ||
                        (
                            fetchedPages[baseUrl].hasOwnProperty(arg) &&
                            !fetchedPages[baseUrl][arg].hasOwnProperty(matchText)
                        )
                    ) {
                        query_string = base_query_string.replace('{page_number}', '1')
                        query_string = _handleMatchingParam(query_string, matchText)
                    } else {                        
                        var nextPage = fetchedPages[baseUrl][arg][matchText].lastPageFetched + 1;
                        query_string = base_query_string.replace('{page_number}', nextPage.toString())
                        query_string = _handleMatchingParam(query_string, matchText)
                        console.log(`query_string: ${query_string}`)
                        if (nextPage > fetchedPages[baseUrl][arg][matchText].totalPages) {
                            console.log(
                                `Skipping request: Last page of records already fetched for class '${arg}' and matching string '${matchText}' at service URL '${baseUrl}' `
                            );
                            // Add result to array, then continue to next baseUrl
                            results.push({
                                success: true,
                                skipped: true,
                                url: `${baseUrl}${query_string}`,
                                allPagesFetched: true,
                                // NOTE: this might be unnecessary given the new use of getTotalItems
                                pageMeta: {
                                    total: fetchedPages[baseUrl][arg][matchText]["totalItems"]
                                }
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
                if (endpoint.includes('get-paginated-records')) {
                    result = await getPaginatedRdfData(getURL);
                } else if (endpoint.includes('get-records')) {
                    result = await getRdfDataArray(getURL);
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
                        // add the complete getURL to the Set of fetched urls
                        // The plan is to use it somewhere but this not used yet
                        fetchedPages[baseUrl].fetchedRequests.add(getURL)
                        // If, for the current baseurl, we have NOT fetched records
                        // of the current class (arg) AND matchText before, we need
                        // to set the first value from the page metadata

                        if (!fetchedPages[baseUrl].hasOwnProperty(arg)) {
                            fetchedPages[baseUrl][arg] = {}
                        }
                        if (!fetchedPages[baseUrl][arg].hasOwnProperty(matchText)) {
                            fetchedPages[baseUrl][arg][matchText] = {
                                totalItems: result.pageMeta.total,
                                totalPages: result.pageMeta.pages,
                                lastPageFetched: result.pageMeta.page,
                            }
                        } else {
                            // If records for the current class (arg) have already been
                            // fetched before, only set the lastPageFetched value. we
                            // assume the rest stays constant.
                            fetchedPages[baseUrl][arg][matchText]["lastPageFetched"] = result.pageMeta.page
                        }
                        console.log("fetchedPages:")
                        console.log(toRaw(fetchedPages))
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
        return fetchRdfData({ url: getURL, expect: 'ttl', contentType: 'text/turtle' });
    }

    async function getRdfDataArray(getURL) {
        return fetchRdfData({ url: getURL, expect: 'json', contentType: 'application/json' });
    }

    async function getPaginatedRdfData(getURL) {
        return fetchRdfData({ url: getURL, expect: 'paged', contentType: 'application/json' });
    }

    async function fetchRdfData({
        url,
        expect, // 'ttl', 'json', 'paged'
        contentType // 'text/turtle' or 'application/json'
    }) {
        let getURL = url;
        // Build headers
        const headers = _getHeaders({ 'Content-Type': contentType });
        try {
            const response = await fetch(getURL, { method: 'GET', headers });
            if (response.status === 401) http401response.value = true;
            if (!response.ok) throw new Error(`Response status: ${response.status}`);

            // Now we handle different response types
            // First is fetching a single TTL document that expects TTL text
            if (expect === 'ttl') {
                const text = await response.text();
                await rdfDS.parseTTLandDedup(text);
                rdfDS.triggerReactivity();
                return { success: true, url: getURL };
            }
            // Other response types both expect json first
            const json = await response.json();
            // JSON array of TTL strings
            if (expect === 'json') {
                
                for (const element of json) {
                    await rdfDS.parseTTLandDedup(element);
                }
                rdfDS.triggerReactivity();
                return { success: true, url: getURL };
            }
            // Paginated response
            if (expect === 'paged') {
                const metadata = {
                    page: json.page,
                    pages: json.pages,
                    total: json.total,
                    size: json.size,
                };
                for (const element of json.items) {
                    await rdfDS.parseTTLandDedup(element);
                }
                rdfDS.triggerReactivity();
                return { success: true, url: getURL, pageMeta: metadata };
            }
            throw new Error(`Unsupported fetch type: ${expect}`);
        } catch (error) {
            return {
                success: false,
                message: error.message,
                error,
                url: getURL,
            };
        }
    }

    function _getHeaders(headers = {}) {
        if (token.value !== null && token.value !== 'null') {
            headers['X-DumpThings-Token'] = token.value;
        }
        return headers
    }

    function hasUnfetchedPages(IRI, matchText='') {
        let hasAnyIRI = false;
        let hasAnyMatchText = false;
        for (const serviceURL in fetchedPages) {
            const endpoint = fetchedPages[serviceURL];
            if (endpoint[IRI]) {
                hasAnyIRI = true;
                if (endpoint[IRI][matchText]) {
                    hasAnyMatchText = true;
                    if (endpoint[IRI][matchText].totalPages > endpoint[IRI][matchText].lastPageFetched) {
                        return true;
                    }
                }
            }
        }
        // Additional conditions:
        if (!hasAnyIRI) {
            return true;
        }
        if (hasAnyIRI && !hasAnyMatchText) {
            return true;
        }
        return false;
    }

    function getTotalItems(IRI) {
        let total = 0;
        for (const serviceURL in fetchedPages) {
            const endpoint = fetchedPages[serviceURL];
            if (endpoint[IRI]) {
                if (endpoint[IRI][''] && endpoint[IRI][''].totalItems) {
                    total += endpoint[IRI][''].totalItems
                }
            }
        }
        return total;
    }

    function firstPageFetched(IRI, matchText='') {
        for (const serviceURL in fetchedPages) {
            const endpoint = fetchedPages[serviceURL];
            if (endpoint[IRI]) {
                if (endpoint[IRI][matchText] && endpoint[IRI][matchText].totalItems) {
                    return true
                }
            }
        }
        return false;
    }

    function _handleMatchingParam(query_str, matchText) {
        // config template is:
        // "records/p/{name}?format=ttl&matching=%25{match_string}%25&size=100&page={page_number}"
        let myStr;
        if (matchText) {
            myStr = query_str.replace('{match_string}', matchText)
        } else {
            myStr = query_str.replace('&matching=%25{match_string}%25', '')
        }
        return myStr
    }

    // expose managed state as return value
    return {
        rdfDS,
        getRdfData,
        fetchFromService,
        fetchedPages,
        hasUnfetchedPages,
        getTotalItems,
        firstPageFetched,
        http401response,
    };
}
