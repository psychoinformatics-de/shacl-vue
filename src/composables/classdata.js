// graphdata.js
import { reactive, ref } from 'vue'
import { readRDF } from '@/modules/io'
import rdf from 'rdf-ext';
import formatsPretty from '@rdfjs/formats/pretty.js'

export function useClassData() {

  const classData = reactive(rdf.dataset())
  const serializedClassData = ref('')
  var classPrefixes = reactive({});
	var prefixes_ready = ref(false);
  const rdfPretty = rdf.clone()
  rdfPretty.formats.import(formatsPretty)
  var classTriples = ref([]);


  async function getClassData(url) {
		readRDF(url)
		.then(quadStream => {
			// Load prefixes
			quadStream.on('prefix', (prefix, ns) => {
				classPrefixes[prefix] = ns.value;
			}).on('end', () => {
				prefixes_ready.value = true
			})
			// Load data
			quadStream.on('data', quad => {
				classData.add(quad)
			}).on('end', async () => {
        console.log('--- class Data ---')
        console.log(classData)
        serializedClassData.value = (await rdfPretty.io.dataset.toText('text/turtle', classData)).trim()
        classData.forEach(quad => {
          classTriples.value.push(`${quad.subject.value} - ${quad.predicate.value} - ${quad.object.value}`)
        });
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
