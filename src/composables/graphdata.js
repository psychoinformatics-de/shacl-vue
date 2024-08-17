// graphdata.js
import { reactive, ref } from 'vue'
import { readRDF } from '@/modules/io'
import rdf from 'rdf-ext';
import formatsPretty from '@rdfjs/formats/pretty.js'

export function useGraphData() {

  const graphData = reactive(rdf.dataset())
  const serializedGraphData = ref('')
  var graphPrefixes = reactive({});
	var prefixArray = ref([]);
	var prefixes_ready = ref(false);
  const rdfPretty = rdf.clone()
  rdfPretty.formats.import(formatsPretty)
  var graphTriples = ref([]);


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
			}).on('end', async () => {
        serializedGraphData.value = (await rdfPretty.io.dataset.toText('text/turtle', graphData)).trim()
        graphData.forEach(quad => {
          graphTriples.value.push(`${quad.subject.value} - ${quad.predicate.value} - ${quad.object.value}`)
        });
      });
		})
		.catch(error => {
			console.error('Error reading TTL data:', error);
		});
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
