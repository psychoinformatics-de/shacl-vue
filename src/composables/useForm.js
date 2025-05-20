// formdata.js

import { reactive, toRaw} from 'vue'
import { SHACL } from '@/modules/namespaces';
import { replaceServiceIdentifier} from '@/modules/utils';
import { postRDF } from '@/modules/io'
import { useToken } from '@/composables/tokens'
import { FormBase } from 'shacl-tulip' 
import { Store } from 'n3';

export function useForm(config) {

    const formData = new FormBase(null, reactive({}))

    async function submitFormData(shapesDS, id_iri, prefixes, config, rdfDS) {

        try {
            console.log("inside submitFormData function")
            console.log(toRaw(formData.content))
            if (Object.keys(formData.content).length == 0) {
                var msg = "submitFormData: no edited formData to submit; returning."
                console.log(msg)
                return {
                    success: true,
                    skipped: true,
                    message: msg
                };
            }
            const endpoint = 'post-record'
            const serviceBaseURL = config.value.service_base_url
            const serviceEndpoints = config.value.service_endpoints
            if (!(serviceBaseURL || serviceEndpoints)) {
                throw new Error("Service base URL and/or service endpoints not included in configuration.\nPosting data to an endpoint will not be possible.")
            }
            if (Object.keys(serviceEndpoints).indexOf(endpoint) < 0) {
                throw new Error(`Unknown endpoint '${endpoint}' provided; Posting data to an endpoint will not be possible. Returning.`)
            }

            if (Object.keys(serviceEndpoints).indexOf(endpoint) < 0) {
                throw new Error(`Unknown endpoint '${endpoint}' provided; Posting data to an endpoint will not be possible. Returning.`)
            }

            // Handle two possibilities:
            // - serviceBaseURL is a string, assume type write
            // - serviceBaseURL is an Array (latest feature)
            // Error if no write urls are found or if more than 1 are found
            const writeUrls = Array.isArray(serviceBaseURL)
            ? serviceBaseURL.filter(el => el.type === "write")
            : [{"url": serviceBaseURL, "type": "write"}];
            if (writeUrls.length === 0) {
                throw new Error("No service base URL with type 'write' was found in the configuration; Posting data to an endpoint will not be possible. Returning.");
            }
            if (writeUrls.length > 1) {
                throw new Error("Multiple service base URLs with type 'write' were found; only one is allowed to post data. Returning");
            }

            const { token } = useToken();
            var headers = {}
            if (token.value !== null && token.value !== "null") {
                headers['X-DumpThings-Token'] = token.value;
            }

            // collect all POST requests as Promises
            let postPromises = [];
            for (var class_uri of Object.keys(formData.content)) {
                // class_uri: all classes that were edited
                // Get shapes for reference
                var nodeShape = shapesDS.data.nodeShapes[class_uri]
                var propertyShapes = nodeShape.properties
                // if the nodeshape does NOT have a propertyshape with sh:path being equal to ID_IRI,
                // it means the class's records will be blank nodes and we can skip the whole class
                var ps = propertyShapes.find((prop) => prop[SHACL.path.value] == id_iri)
                if(!ps) {
                    console.log(`Class '${class_uri}' shape does not have an id field, i.e. it will have blank node records, i.e. skipping.`)
                    continue;
                }
                for (var record_id of Object.keys(formData.content[class_uri])) {
                    console.log(`formData for node: ${record_id}`)
                    console.log(toRaw(formData.content[class_uri][record_id]))
                    // Turn the record/node into quads
                    var quads = formData.formNodeToQuads(class_uri, record_id, shapesDS)
                    // Ne need to resolve blank nodes recursively, and add all to the dataset
                    quads.forEach(quad => {
                        if (quad.object.termType === "BlankNode") {
                            var moreQuads = rdfDS.getSubjectTriples(quad.object)
                            quads = quads.concat(Array.from(moreQuads))
                        }
                    });
                    // Create an rdf dataset per record
                    var ds = new Store()
                    quads.forEach(quad => {
                        ds.add(quad)
                    });
                    // A POST replaceServiceIdentifier(class_uri, serviceEndpoints[endpoint], prefixes)
                    const query_string = replaceServiceIdentifier(class_uri, serviceEndpoints[endpoint], prefixes)
                    var postURL = `${writeUrls[0].url}${query_string}`
                    console.log("POSTing to the following URL:")
                    console.log(postURL)
                    postPromises.push(postRDF(postURL, ds, 'text/turtle', headers, prefixes));
                    // await postRDF(postURL, ds,'text/turtle', headers, prefixes)
                }
            }
            // wait until all POST requests settle.
            const results = await Promise.allSettled(postPromises);
            const failed = results.filter(result => result.value.success === false).map(r => {return r.value});

            if (failed.length > 0) {
                return {
                    success: false,
                    error: failed,
                    message: "One or more POSTS failed",
                };
            } else {
                return {
                    success: true,
                };
            }
        } catch (error) {
            return {
                success: false,
                error,
                message: error.message,
            };
        }
    }


    // expose managed state as return value
    return {
        formData,
        submitFormData,
    }
}
