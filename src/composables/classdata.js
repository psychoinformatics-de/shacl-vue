// classdata.js
import { inject, reactive, ref} from 'vue'
import { readRDF } from '@/modules/io'
import rdf from 'rdf-ext';
import formatsPretty from '@rdfjs/formats/pretty.js'

const basePath = import.meta.env.BASE_URL || '/';

export function useClassData(config) { 
  const defaultURL = `${basePath}class_hierarchy.ttl`;
  const classData = reactive(rdf.dataset())
  const serializedClassData = ref('')
  var classPrefixes = reactive({});
	var prefixes_ready = ref(false);
  const rdfPretty = rdf.clone()
  rdfPretty.formats.import(formatsPretty)
  var classTriples = ref([]);

  async function getClassData(url) {
    var classURL
    if (config.value.class_url) {
      if (config.value.class_url.indexOf('http')) {
        classURL = config.value.class_url
      } else {
        classURL = `${basePath}${config.value.class_url}`;
      }
    } else {
      classURL = defaultURL
    }
    const getURL = url ? url : classURL
    if (getURL === classURL && !config.value.use_default_classes) {
      // console.log("getURL === classURL; returning")
      return
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
				classData.add(quad)
			}).on('end', async () => {
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
