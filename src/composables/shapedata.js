/**
 * @module shapedata.js
 * @description This composable reads a ttl file with shacl shapes and returns
 * a set of reactive variables used by the root application component
 */
import { reactive, ref, onBeforeMount} from 'vue'
import { readRDF } from '@/modules/io'
import rdf from 'rdf-ext';
import {SHACL, RDF} from '@/modules/namespaces';

export function useShapeData(shapes_graph_url) {

    // ---- //
    // Data //
    // ---- //

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

    // ----------------- //
    // Lifecycle methods //
    // ----------------- //

    onBeforeMount(() => {
        getSHACLschema(shapes_graph_url);
    })

    // --------- //
    // Functions //
    // --------- //

	function getSHACLschema(url) {
		readRDF(url)
		.then(quadStream => {
			// Load shape prefixes
			quadStream.on('prefix', (prefix, ns) => {
				shapePrefixes[prefix] = ns.value;
				prefixArray.value.push(ns.value)
                console.log(`prefix: ${prefix} ${ns.value}`)
			}).on('end', () => {
				prefixes_ready.value = true
			})
			// Load shape data
			quadStream.on('data', quad => {
				shapesDataset.add(quad)
				const subject = quad.subject.value;
				const predicate = quad.predicate.value;
				const object = quad.object.value;
				// Isolate sh:NodeShape instances
				if (predicate === RDF.type.value && object === SHACL.NodeShape.value) {
					nodeShapes.value[subject] = { properties: [] };
				}
				// Get properties of node shapes
				if (predicate === SHACL.property.value) {
					nodeShapes.value[subject].properties.push(object);
				}
				// Get property groups, if any
				if (predicate === RDF.type.value && object === SHACL.PropertyGroup.value) {
				propertyGroups.value[subject] = { };
				}
			}).on('end', () => {
				// Loop through all nodeshapes
				for (const [key, val] of Object.entries(nodeShapes.value)) {
					// Get attributes (other than 'properties') of the nodeshape
					shapesDataset.forEach(quad => {
						if (quad.subject.value === key && quad.predicate.value != SHACL.property.value) {
							nodeShapes.value[key][quad.predicate.value] = quad.object.value
						}
					});
					// Loop through property elements, i.e. blank nodes, and set correct attributes
					for (var i = 0; i < val.properties.length; i++) {
						var node = val.properties[i];
						var new_node = {}
						shapesDataset.forEach(quad => {
							if (quad.subject.value === node) {
								new_node[quad.predicate.value] = quad.object.value
							}
						});
						// replace blank nodes with new object
						val.properties[i] = new_node;
					}
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
                page_ready.value = true
            });
		})
		.catch(error => {
			console.error('Error reading SHACL data:', error);
		});
	}

	// ------- //
    // Returns //
    // ------- //
	return {
		shapesDataset,
        nodeShapes,
        propertyGroups,
        nodeShapeNamesArray,
        shapePrefixes,
        prefixArray,
        prefixes_ready,
        nodeShapeIRIs,
        nodeShapeNames,
        page_ready,
	}
}