// graphdata.js
import { reactive, ref, inject, watch} from 'vue'
import { readRDF } from '@/modules/io'
import rdf from 'rdf-ext';
import formatsPretty from '@rdfjs/formats/pretty.js'
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
    console.log(`default url is: ${defaultURL}`)
    console.log(`config url is: ${config.value.data_url}`)
    var relURL
		if (config.value.data_url) {
      if (config.value.data_url.indexOf("http") >= 0) {
        relURL = config.value.data_url
      } else {
        relURL = new URL("src/" + config.value.data_url, baseURL).href
      }
		}
    const dataURL = relURL ? relURL : defaultURL
    const getURL = url ? url : dataURL
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
  

    // expose managed state as return value
    return {
      graphData,
      batchMode,
      getGraphData,
      graphPrefixes,
      serializedGraphData,
      graphTriples
    }
  }
