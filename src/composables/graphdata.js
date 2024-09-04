// graphdata.js
import { reactive, ref, computed, watch} from 'vue'
import { readRDF } from '@/modules/io'
import rdf from 'rdf-ext';
import formatsPretty from '@rdfjs/formats/pretty.js'

export function useGraphData() {
  const graphData = createReactiveDataset();
  const serializedGraphData = ref('');
  const graphTriples = ref([]);
  var graphPrefixes = reactive({});
	var prefixArray = ref([]);
	var prefixes_ready = ref(false);
  const rdfPretty = rdf.clone()
  rdfPretty.formats.import(formatsPretty)


  async function getGraphData(url) {
		readRDF(url)
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
            triggerReactivity(); // Manually trigger reactivity when dataset is mutated
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
      getGraphData,
      graphPrefixes,
      serializedGraphData,
      graphTriples
    }
  }
