// classdata.js
import { inject, reactive, ref} from 'vue'
import { RDFS } from '../modules/namespaces'
import { readRDF } from '@/modules/io'
import rdf from 'rdf-ext';
import formatsPretty from '@rdfjs/formats/pretty.js'

const basePath = import.meta.env.BASE_URL || '/';

export function useClassData(config) { 
    const defaultURL = `${basePath}dlschemas_owl.ttl`;
    const classData = reactive(rdf.dataset())
    const serializedClassData = ref('')
    var classPrefixes = reactive({});
    var prefixes_ready = ref(false);
    const rdfPretty = rdf.clone()
    rdfPretty.formats.import(formatsPretty)
    var classTriples = ref([]);

    async function getClassData(url) {
        var getURL
        if (!url) {
            // If no url argument provided, check config
            // Config priority is:
            // - if the class_url is provided, use it and ignore use_default_classes
            // - if the class_url is NOT provided, use default if use_default_classes==true, else nothing
            if (config.value.class_url) {
                if (config.value.class_url.indexOf('http')) {
                    getURL = config.value.class_url
                } else {
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

        // console.log(`class url is: ${getURL}`)
        readRDF(getURL)
            .then(quadStream => {
                // Load prefixes
                quadStream.on('prefix', (prefix, ns) => {
                    classPrefixes[prefix] = ns.value;
                }).on('end', () => {
                    prefixes_ready.value = true
                })
                // Load data
                quadStream.on('data', quad => {
                    if (quad.predicate.value === RDFS.subClassOf.value &&
                        quad.subject.termType !== 'BlankNode' &&
                        quad.object.termType !== 'BlankNode' ) {
                        classData.add(quad)
                    }
                }).on('end', async () => {
            serializedClassData.value = (await rdfPretty.io.dataset.toText('text/turtle', classData)).trim()
            classData.forEach(quad => {
                classTriples.value.push(`${quad.subject.value} - ${quad.predicate.value} - ${quad.object.value}`)
            });
            console.log("classdata loaded")
            console.log(classTriples.value)
        });
        })
        .catch(error => {
            console.error('Error reading TTL data:', error);
        });
    }

    // expose managed state as return value
    return {
        classData,
        getClassData,
        classPrefixes,
        serializedClassData,
        classTriples
    }
}
