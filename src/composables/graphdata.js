// graphdata.js
import { reactive, ref, inject, watch} from 'vue'
import { readRDF } from '@/modules/io'
import rdf from 'rdf-ext';
import { SHACL , RDF} from '../modules/namespaces'
import formatsPretty from '@rdfjs/formats/pretty.js'
import { downloadTSV } from '@/modules/utils';
const baseURL = new URL(import.meta.env.BASE_URL || '/', import.meta.url).href;

export function useGraphData(config) {

  const defaultURL = new URL("@/assets/distribution-penguins-mini.ttl", import.meta.url).href
  const graphData = createReactiveDataset();
  const serializedGraphData = ref('');
  const graphTriples = ref([]);
  var graphPrefixes = reactive({});
	var prefixArray = ref([]);
	var prefixes_ready = ref(false);
  const rdfPretty = rdf.clone()
  rdfPretty.formats.import(formatsPretty)
  const batchMode = ref(false);


  async function getGraphData(url) {
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
        // If config url is an online resource (proxy = contains http), keep as is
        // If not, construct relative url
        if (config.value.data_url.indexOf("http") >= 0) {
          getURL = config.value.data_url
        } else {
          getURL = new URL("src/" + config.value.data_url, baseURL).href
        }
      } else {
        if (config.value.use_default_data == true) {
          getURL = defaultURL
        } else {
          console.log("getGraphData -> no url provided via argument or config, and config specifies not to use default; not fetching")
          updateSerializedData();
          triggerReactivity();
          return
        }
      }
    } else {
      getURL = url
    }

    console.log(`data url is: ${getURL}`)
    batchMode.value = true;
		readRDF(getURL)
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
      });
		})
		.catch(error => {
			console.error('Error reading TTL data:', error);
		});
	}

  async function updateSerializedData() {
    serializedGraphData.value = (await rdfPretty.io.dataset.toText('text/turtle', graphData)).trim()
  }

  watch(graphData, async () => {
    console.log("CHECK: graphdata from composable")
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
        if (typeof value === 'function' && ['add', 'delete'].includes(prop)) {
          return function (...args) {
            const result = value.apply(target, args);
            if (!batchMode.value) {
              triggerReactivity(); // Trigger reactivity when dataset is mutated
            }
            console.log("(Adding triple to reactive rdf.dataset)")
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

  async function serializeNodesToTSV() {
    const nodeType = 'https://concepts.datalad.org/s/sddnb/unreleased/StudySample';
    const propertyURIs = [
      'https://concepts.datalad.org/s/sddnb/unreleased/participant_id',
      'https://concepts.datalad.org/s/sddnb/unreleased/session_id',
      'https://concepts.datalad.org/s/sddnb/unreleased/pheno_age',
      'https://concepts.datalad.org/s/sddnb/unreleased/pheno_group',
      'https://concepts.datalad.org/s/sddnb/unreleased/pheno_sex',
      'https://concepts.datalad.org/s/sddnb/unreleased/tool1_item1',
      'https://concepts.datalad.org/s/sddnb/unreleased/tool1_item2',
      'https://concepts.datalad.org/s/sddnb/unreleased/tool2_item1'
    ];
    const filename = 'StudySamples.tsv'
    // Define the headers for the TSV
    const headers = propertyURIs.map(uri => uri.split('/').pop()); // Extract local name for headers
    let tsvData = headers.join('\t') + '\n'; // Column headers

    // Use the graph to find all nodes of the specified type
    const predicate = rdf.namedNode(RDF.type.value)
    const nodes = rdf.grapoi({ dataset: graphData })
            .hasOut(predicate, rdf.namedNode(nodeType))
            .quads();

    // Iterate over each node
    for (const quad of nodes) {
      const node = quad.subject;

      // Collect property values for the current node
      const row = [];
      for (const propertyURI of propertyURIs) {
        // Use the graph to find the value for each property
        const valueQuad = Array.from(graphData.match(node, rdf.namedNode(propertyURI)));

        // Push value or empty if not found
        if (valueQuad.length > 0) {
          const value = valueQuad[0].object;
          // Handle literal values (e.g., strings, numbers) and URIs
          if (value.termType === 'Literal') {
            row.push(value.value);
          } else if (value.termType === 'NamedNode') {
            row.push(value.value); // URI value
          }
        } else {
          row.push(''); // Empty if no value found
        }
      }
      tsvData += row.join('\t') + '\n'; // Add row to TSV data
    }

    // Trigger the download of the TSV file
    downloadTSV(tsvData, filename);
  }

  

    // expose managed state as return value
    return {
      graphData,
      batchMode,
      getGraphData,
      graphPrefixes,
      serializedGraphData,
      graphTriples,
      serializeNodesToTSV
    }
  }
