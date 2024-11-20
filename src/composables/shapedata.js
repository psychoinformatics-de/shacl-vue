/**
 * @module shapedata.js
 * @description This composable reads a ttl file with shacl shapes and returns
 * a set of reactive variables used by the root application component
 */
import { reactive, ref, onBeforeMount, toRaw} from 'vue'
import { readRDF } from '@/modules/io'
import rdf from 'rdf-ext';
import {SHACL, RDF} from '@/modules/namespaces';
import formatsPretty from '@rdfjs/formats/pretty.js'
import { resolveBlankNode } from '@/modules/utils';

const baseURL = new URL(import.meta.env.BASE_URL || '/', import.meta.url).href;
const rdfPretty = rdf.clone()
rdfPretty.formats.import(formatsPretty)

export function useShapeData(config) {

    // ---- //
    // Data //
    // ---- //
	const defaultURL = new URL("@/assets/shapesgraph.ttl", import.meta.url).href
	var shapesDataset = reactive(rdf.dataset());
	var nodeShapes = ref({});
	var propertyGroups = ref({});
	var nodeShapeNamesArray = ref([]);
	var shapePrefixes = reactive({});
	var prefixArray = ref([]);
	var prefixes_ready = ref(false);
	var nodeShapeIRIs = ref(null);
	var nodeShapeNames = ref({});
	var page_ready = ref(false);
	const serializedData = ref('');

    // // ----------------- //
    // // Lifecycle methods //
    // // ----------------- //

    // onBeforeMount(() => {
    //     getSHACLschema(shapes_graph_url);
    // })

    // --------- //
    // Functions //
    // --------- //

	async function getSHACLschema(url) {
		// console.log(`default url is: ${defaultURL}`)
		// console.log(`config url is: ${config.value.shapes_url}`)
		var relURL
		if (config.value.shapes_url) {
			if (config.value.shapes_url.indexOf("http") >= 0) {
			  relURL = config.value.shapes_url
			} else {
			  relURL = new URL("src/" + config.value.shapes_url, baseURL).href
			}
		}
		const shapesURL = relURL ? relURL : defaultURL
		const getURL = url ? url : shapesURL

		// if (getURL === shapesURL && !config.value.use_default_shapes) {
		// 	return
		// }

		// console.log(`shapes url is: ${getURL}`)
		readRDF(getURL)
		.then(quadStream => {
			// Load shape prefixes
			quadStream.on('prefix', (prefix, ns) => {
				shapePrefixes[prefix] = ns.value;
				prefixArray.value.push(ns.value)
			}).on('end', () => {
				prefixes_ready.value = true
			})
			// Load shape data
			quadStream.on('data', quad => {
				shapesDataset.add(quad)
				const subject = quad.subject.value;
				const predicate = quad.predicate.value;
				const object = quad.object;
				// Isolate sh:NodeShape instances
				if (predicate === RDF.type.value && object.value === SHACL.NodeShape.value) {
					nodeShapes.value[subject] = { properties: [] };
				}
				// Get properties of node shapes
				if (predicate === SHACL.property.value) {
					nodeShapes.value[subject].properties.push(object);
				}
				// Get property groups, if any
				if (predicate === RDF.type.value && object.value === SHACL.PropertyGroup.value) {
				propertyGroups.value[subject] = { };
				}
			}).on('end', () => {

				// Loop through all nodeshapes
				// console.log("Restructuring up nodeshapes object...")
				for (const [key, val] of Object.entries(nodeShapes.value)) {
					// Get attributes (other than 'properties') of the nodeshape
					// console.log(`Restructuring node (i.e. key): ${key}`)
					// console.log(`val of node being restructured:`)
					// console.log(val)
					shapesDataset.forEach(quad => {
						if (quad.subject.value === key && quad.predicate.value != SHACL.property.value) {
							const predicate = quad.predicate.value;
							const object = quad.object;
							// Check if the object is a blank node and resolve it
							if (quad.object.termType === 'BlankNode') {
								nodeShapes.value[key][quad.predicate.value] = resolveBlankNode(quad.object, shapesDataset);
							} else {
								nodeShapes.value[key][quad.predicate.value] = quad.object.value;
							}
						}
					});
					// console.log("properties of node after restructuring step 1:")
					// console.log(nodeShapes.value[key])

					// Loop through property elements, i.e. blank nodes, and set correct attributes
					for (var i = 0; i < val.properties.length; i++) {
						var node = val.properties[i];

						if (node.termType === "BlankNode") {
							// If it's a blank node, resolve it
							// console.log(`Resolving blank node: ${node.value}`);
							val.properties[i] = resolveBlankNode(node, shapesDataset);
						} else {
							// Non-blank nodes are kept as they are, but eventually store only their `.value`
							var new_node = {};
							shapesDataset.forEach((quad) => {
							  if (quad.subject.value === node.value) {
								new_node[quad.predicate.value] = quad.object.value; // Store only .value
							  }
							});
							val.properties[i] = new_node;
						}
					}
					// console.log("properties of node after restructuring step 2:")
					// console.log(nodeShapes.value[key].properties)
				}
				for (const iri of Object.keys(nodeShapes.value)) { 
                    var parts = iri.split('/')
                    nodeShapeNames.value[parts[parts.length - 1]] = iri
				}
				nodeShapeNamesArray.value = Object.keys(nodeShapeNames.value).sort()
				nodeShapeIRIs.value = Object.keys(nodeShapes.value).sort()
                // Now handle the (possibility of) property groups
                for (const [key, value] of Object.entries(propertyGroups.value)) {
                    shapesDataset.forEach(quad => {
                        if (quad.subject.value === key && quad.predicate.value != RDF.type.value ) {
                            propertyGroups.value[key][quad.predicate.value] = quad.object.value
                        }
                    });
                }
				updateSerializedData()
				// console.log("All nodeshapes from shapes graph:")
				// console.log(toRaw(nodeShapes.value))
                page_ready.value = true
            });
		})
		.catch(error => {
			console.error('Error reading SHACL data:', error);
		});
	}

	async function updateSerializedData() {
		serializedData.value = (await rdfPretty.io.dataset.toText('text/turtle', shapesDataset)).trim()
	}

	// ------- //
    // Returns //
    // ------- //
	return {
		getSHACLschema,
		shapesDataset,
        nodeShapes,
        propertyGroups,
        nodeShapeNamesArray,
        shapePrefixes,
        prefixArray,
        prefixes_ready,
        nodeShapeIRIs,
        nodeShapeNames,
		serializedData,
        page_ready,
	}
}