// formdata.js

// Example formData structure:
// var exFormData = {
//   "https://concepts.datalad.org/s/distribution/unreleased/Person": {          // RDF type of a subject
//     "https://example.org/ns/dataset/#ahorst": {                               // A subject: named or blank node
//       "https://concepts.datalad.org/s/distribution/unreleased/email":  []     // A predicate: named node
//     }
//   },
//   "https://concepts.datalad.org/s/prov/unreleased/Attribution": { // type
//   } 
// }

import { reactive, ref, computed, inject, toRaw} from 'vue'
import rdf from 'rdf-ext';
import { SHACL, RDF } from '@/modules/namespaces';
import { isEmptyObject, getSubjectTriples, getObjectTriples, toIRI} from '@/modules/utils';
import formatsPretty from '@rdfjs/formats/pretty.js'
import { postRDF } from '@/modules/io'
import { useGraphData } from '@/composables/graphdata'
const { fetchFromService } = useGraphData()

export function useFormData() {

    const formData = reactive({})
    const rdfPretty = rdf.clone()
    rdfPretty.formats.import(formatsPretty)  

    function add_empty_node(nodeshape_iri, node_iri) {
        // if the node shape IRI does not exist in the formData lookup object yet, add it
        // if the node shape IRI already exists in the formData lookup object:
        // - if the specific iri does not exists, add it
        // - if the specific iri exists do nothing
        if (Object.keys(formData).indexOf(nodeshape_iri) < 0) {
            // The added value is an object; to allow adding multiple of the same node type,
            // unique subject IRIs (from named or blank nodes) will be the unique keys of the object
            formData[nodeshape_iri] = reactive({})
        }
        if (Object.keys(formData[nodeshape_iri]).indexOf(node_iri) < 0) {
            // The added value is an object with keys == predicates and values being arrays
            // that can take multiple object values
            // TODO: this needs to be trialed because unsure whether this or alternative is more suitable
            // alternative could be having an object with both keys and values being the object, or
            // keys being numeric and sequential, and values being object values
            formData[nodeshape_iri][node_iri] = reactive({})
        } 
    }


    function remove_current_node(nodeshape_iri, node_iri) {
        // Error: if the node shape iri does not exist in the lookup object
        if (Object.keys(formData).indexOf(nodeshape_iri) < 0) {
            console.error(`Trying to delete a node of a shape that does not exist in form data:\n${nodeshape_iri}`)
        }
        // Error: if the node iri does not exist in the lookup object
        else if (Object.keys(formData[nodeshape_iri]).indexOf(node_iri) < 0) {
            console.error(`Trying to delete a node that does not exist in form data:\n${nodeshape_iri} - ${node_iri}`)
        }
        // remove node instance at provided iri
        // if node object is empty after instance removal, remove node key as well
        else {
            delete formData[nodeshape_iri][node_iri]
            if ( isEmptyObject(formData[nodeshape_iri])) { delete formData[nodeshape_iri] }
        }
    }


    function clear_current_node(nodeshape_iri, node_iri) {
        // Error: if the node key does not exist in the lookup object
        if (Object.keys(formData).indexOf(nodeshape_iri) < 0) {
            console.error(`Trying to clear a node of a shape that does not exist in form data:\n${nodeshape_iri}`)
        }
        // Error: if the node idx does not exist in the lookup object
        else if (Object.keys(formData[nodeshape_iri]).indexOf(node_iri) < 0) {
            console.error(`Trying to clear a node that does not exist in form data:\n${nodeshape_iri} - ${node_iri}`)
        }
        // clear node instance at provided index
        else {
            objectKeysToNull(formData[nodeshape_iri][node_iri])
        }
    }


    function add_empty_triple(nodeshape_iri, node_iri, triple_uid) {
        // console.log(`Adding empty triple:\nnodeshape_iri: ${nodeshape_iri}\nnode_iri: ${node_iri}\ntriple_uid: ${triple_uid}`)
        // if the node shape+iri exist and the triple uid (predicate) does not exist, add it
        // if the node shape+iri exist and the triple uid already exists, add empty value to array
        // if the node shape+iri do not exist, print console error because this should not be possible
        if (Object.keys(formData).indexOf(nodeshape_iri) >= 0 && Object.keys(formData[nodeshape_iri]).indexOf(node_iri) >= 0) {
            // Current node being edited at IRI
            if (Object.keys(formData[nodeshape_iri][node_iri]).indexOf(triple_uid) < 0) {
                formData[nodeshape_iri][node_iri][triple_uid] = reactive([null])
            } else {
                formData[nodeshape_iri][node_iri][triple_uid].push(null)
            }
        } else {
            console.error(`Node shape and/or node IRI not in formData yet:\n${nodeshape_iri} - ${node_iri}\nCannot add triple to non-existing node.`)
        }
    }


    function add_empty_triple_manual(nodeshape_iri, node_iri, triple_uid) {
        formData[nodeshape_iri][node_iri][triple_uid].push(null)
    }





    function remove_triple(nodeshape_iri, node_iri, triple_uid, triple_idx) {
        if (Object.keys(formData).indexOf(nodeshape_iri) >= 0 && Object.keys(formData[nodeshape_iri]).indexOf(node_iri) >= 0) {
            // Current node being edited at index
            if (Object.keys(formData[nodeshape_iri][node_iri]).indexOf(triple_uid) < 0) {
                console.error(`Triple UID ${triple_uid} not in specific node IRI instance in formData:\n${nodeshape_iri} - ${node_iri}\nCannot remove non-existing triple.`)
            } else {
                formData[nodeshape_iri][node_iri][triple_uid].splice(triple_idx, 1)
            }
        } else {
            console.error(`Node shape and/or node IRI not in formData yet:\n${nodeshape_iri} - ${node_iri}\nCannot remove triple from non-existing node.`)
        }
    }


    function save_node(nodeshape_iri, node_iri, nodeShapes, graphData, editMode, id_iri) {
        // Check if the node exists beforehand
        console.log(`Saving node of shape: ${nodeshape_iri}`)
        var changeNodeIdx = false
        var rereferenceTriples = false
        var subject_iri = null
        if (formData[nodeshape_iri]) {
            // console.log("Node has entry in formData")
            // console.log(`Current node value: ${formData[nodeshape_iri].at(-1)}`)

            // If we are in edit more, the first step is to delete existing quads from graphData
            if (editMode) {
                console.log("saving while in edit mode -> delete preexisting quads from dataset")
                graphData.deleteMatches(rdf.namedNode(node_iri), null, null, null)
            }

            var shape = nodeShapes[nodeshape_iri]
            // console.log(`Node shape:`)
            // console.log(shape)
            var properties = shape.properties
            // console.log(`Node shape properties:`)
            // console.log(properties)
            // Subject should either be a named node or blank node
            // - named node if any of the properties is an ID (as defined by some IRI as constant or from config, see declarations above)
            // - blank node if no ID found
            var subject
            if (Object.keys(formData[nodeshape_iri][node_iri]).indexOf(id_iri) >= 0) {
                // console.log(`\t- node instance has ID field: ${formData[nodeshape_iri][node_iri][id_iri][0]}`)
                subject_iri = formData[nodeshape_iri][node_iri][id_iri][0]
                subject = rdf.namedNode(subject_iri)
                changeNodeIdx = true
            } else {
                // console.log(`\t- node instance DOES NOT have ID field`)
                subject = rdf.blankNode(node_iri) // node_iri is created with crypto.randomUUID(), so it is unique
            }
            // Add the first quad, specifying rdf-type of the node
            let firstQuad = rdf.quad(subject, rdf.namedNode(RDF.type.value), rdf.namedNode(nodeshape_iri))
            // console.log(`Adding first quad (rdftype of node) to data graph:\n${firstQuad.toString()}`)
            graphData.add(firstQuad)
            // Now: loop through all keys, i.e. properties of shape, i.e. triple predicates
            for (var pred of Object.keys(formData[nodeshape_iri][node_iri])) {
                console.log(`\t- processing predicate: ${pred}`)
                // Only process entered values
                if (Array.isArray(formData[nodeshape_iri][node_iri][pred]) &&
                    formData[nodeshape_iri][node_iri][pred].length == 1 &&
                    formData[nodeshape_iri][node_iri][pred][0] === null) {
                    // console.log("Node predicate has no value, skipping")
                    continue;
                }
                // Don't add ID quad:
                if (pred == id_iri) {
                    continue;
                }
                var predicate = rdf.namedNode(pred)
                // Find associated property shape, for information about nodekind
                var property_shape = properties.find((prop) => prop[SHACL.path.value] == pred)
                var nodeFunc = null
                var dt = null
                if (property_shape.hasOwnProperty(SHACL.nodeKind.value)) {
                    // options = sh:BlankNode, sh:IRI, sh:Literal, sh:BlankNodeOrIRI, sh:BlankNodeOrLiteral, sh:IRIOrLiteral
                    // sh:nodeKind == sh:Literal
                    if (property_shape[SHACL.nodeKind.value] == SHACL.Literal.value) {
                        nodeFunc = rdf.literal
                        // sh:datatype exists
                        if (property_shape.hasOwnProperty(SHACL.datatype.value)) {
                            dt = property_shape[SHACL.datatype.value]
                        }
                    } else if ([SHACL.IRI.value, SHACL.BlankNodeOrIRI.value].includes(property_shape[SHACL.nodeKind.value])) {
                        nodeFunc = rdf.namedNode
                    } else {
                        console.error(`\t- NodeKind not supported: ${property_shape[SHACL.nodeKind.value]}\n\t\tAdding triple with literal object to graphData`)
                        nodeFunc = rdf.literal
                    }
                } else if (property_shape.hasOwnProperty(SHACL.in.value)) {
                    // This is a temporary workaround; should definitely not be permanent
                    // Assume Literal nodekind for any arrays
                    nodeFunc = rdf.literal

                }
                else {
                    console.error(`\t- NodeKind not found for property shape: ${pred}\n\tCannot add triple to graphData. Here's the full property shape:`)
                    console.error(property_shape)
                }

                // Loop through all elements of the array with triple objects
                for (var obj of formData[nodeshape_iri][node_iri][pred]) {
                    let triple_object
                    if (dt) {
                        triple_object = nodeFunc(String(obj), dt)
                    } else {
                        triple_object = nodeFunc(obj)
                    }
                    let quad = rdf.quad(subject, predicate, triple_object)
                    // console.log(`Adding quad to data graph:\n${quad.toString()}`)
                    graphData.add(quad)
                }
            }
            // If this was in editmode and the node IRI has been altered,
            // i.e. node_iri is not the same as the new value in formData,
            // then we need to RE-reference existing triples in the graph that has the current node_iri as object.
            // This is only necessary for namedNodes where the IRI changed. The process is:
            // - only do the following if the node is a namedNode and if the IRI changed during editing
            // - find all triples with the node IRI as object -> oldTriples
            // - for each triple in oldTriples: create a new one with same subject and predicate
            //   and with new IRI as object, then delete the old triple
            if (editMode && subject_iri !== null && subject_iri !== node_iri) {
                var objectQuads = getObjectTriples(graphData, rdf.namedNode(node_iri))
                objectQuads.forEach((quad) => {
                    let new_quad = rdf.quad(quad.subject, quad.predicate, subject)
                    graphData.delete(quad)
                    graphData.add(new_quad)
                });
            }

            // Change formdata node_iri to the actual id, if this was present:
            if (changeNodeIdx && subject_iri !== node_iri) {
                formData[nodeshape_iri][subject_iri] = reactive(structuredClone(toRaw(formData[nodeshape_iri][node_iri])))
                delete formData[nodeshape_iri][node_iri]
            }
            // at the end, what to do with current data in formdata?
            // we keep it there because this keeps track of changes during
            // the session, so that we know what to submit back to the service.
        } else {
            console.error(`\t- Node ${nodeshape_iri} does not exist`)
        }

        console.log("formData saved to graph. Current formData:")
        console.log(toRaw(formData))
    }

    function submitFormData(nodeShapes, id_iri) {
        // Send a POST to a service for every record in formData
        for (var class_uri of Object.keys(formData)) {
            // class_uri: all classes that were edited
            // Get shapes for reference
            var nodeShape = nodeShapes[class_uri]
            var propertyShapes = nodeShape.properties
            for (var record_id of Object.keys(formData[class_uri])) {
                // Turn the record/node into quads
                var quads = formNodeToQuads(class_uri, record_id, nodeShapes, propertyShapes, id_iri)
                // Create an rdf dataset per record
                var ds = rdf.dataset()
                quads.forEach(quad => {
                    ds.add(quad)
                });
                // A POST should happen per record
                postRDF(endpoint, ds)
            }
        }
    }

    function formNodeToQuads(class_uri, record_id, nodeShapes, propertyShapes, id_iri) {
        // Node = record_id = a specific identifiable object that was edited
        // Empty array to store quads
        var quadArray = []
        // Identify the record's subject (named or blank node)
        subject = getRecordSubjectTerm(record_id, formData[class_uri][record_id])
        // Add the triple stating the subject is of type class
        let firstQuad = rdf.quad(subject, rdf.namedNode(RDF.type.value), rdf.namedNode(class_uri))
        quadArray.push(firstQuad)

        // Now we need to add all triples relating to the properties of the record.
        for (var triple_predicate of Object.keys(formData[class_uri][record_id])) {
            // triple_predicate: all properties of an identifiable object
            // Only process entered values, i.e. ignore property if it has value: [null]
            if (Array.isArray(formData[class_uri][record_id][triple_predicate]) &&
                formData[class_uri][record_id][triple_predicate].length == 1 &&
                formData[class_uri][record_id][triple_predicate][0] === null) {
                continue;
            }
            // Don't add id_iri triple, since it would have been added already if it exists
            if (triple_predicate == id_iri) {
                continue;
            }
            // now set the predicate as a named node
            var predicate = rdf.namedNode(triple_predicate)
            // In order to set the node type of the object, we first need to figure it out
            var [nodeFunc, dt] = getPropertyNodeKind(property_iri, propertyShapes)
            // Now we can create the object nodes for each property
            for (var val of formData[class_uri][record_id][triple_predicate]) {
                // val: all values of a given property of an identifiable object
                let triple_object
                if (dt) {
                    triple_object = nodeFunc(String(val), dt)
                } else {
                    triple_object = nodeFunc(val)
                }
                // and finally we can add the quads to the store
                let quad = rdf.quad(subject, predicate, triple_object)
                quadArray.push(quad)
            }
        }
        // TODO: see the following in saveNode function:
        // If this was in editmode and the node IRI has been altered,
        // i.e. node_iri is not the same as the new value in formData,
        // then we need to RE-reference existing triples in the graph that has the current node_iri as object.
        // This is only necessary for namedNodes where the IRI changed. The process is:
        // - only do the following if the node is a namedNode and if the IRI changed during editing
        // - find all triples with the node IRI as object -> oldTriples
        // - for each triple in oldTriples: create a new one with same subject and predicate
        //   and with new IRI as object, then delete the old triple

        // For now we ignore this ^^, i.e. we just add formData to new rdf datasets
        // and nothing more. This is to be tested to see the implications. TODO
    }

    function getRecordSubjectTerm(record_id, record) {
        // A record is an object with property IRIs as keys and arrays as values
        // If the configured id_iri is a property of the record, this means that
        // property's value is the subject, which should be a named node.
        // If the configured id_iri is NOT a property of the record, it means
        // the record_id itself is the subject, which is a blank node.
        var subject
        if (Object.keys(node).indexOf(id_iri) >= 0) {
            subject_iri = record[id_iri][0]
            subject = rdf.namedNode(subject_iri)
        } else {
            subject = rdf.blankNode(record_id)
        }
        return subject
    }

    function getPropertyNodeKind(property_iri, propertyShapes) {
        // Find associated property shape, for information about nodekind
        var propertyShape = propertyShapes.find((prop) => prop[SHACL.path.value] == property_iri)
        var nodeFunc = null
        var dt = null
        if (propertyShape.hasOwnProperty(SHACL.nodeKind.value)) {
            // possible options = sh:BlankNode, sh:IRI, sh:Literal, sh:BlankNodeOrIRI, sh:BlankNodeOrLiteral, sh:IRIOrLiteral
            // if sh:nodeKind == sh:Literal
            if (propertyShape[SHACL.nodeKind.value] == SHACL.Literal.value) {
                nodeFunc = rdf.literal
                // if sh:datatype exists
                if (propertyShape.hasOwnProperty(SHACL.datatype.value)) {
                    dt = propertyShape[SHACL.datatype.value]
                }
            // if sh:nodeKind == sh:IRI or sh:BlankNodeOrIRI
            } else if ([SHACL.IRI.value, SHACL.BlankNodeOrIRI.value].includes(propertyShape[SHACL.nodeKind.value])) {
                nodeFunc = rdf.namedNode
            } else {
                console.error(`\t- NodeKind not supported: ${propertyShape[SHACL.nodeKind.value]}\n\t\tAdding triple with literal object to graphData`)
                nodeFunc = rdf.literal
            }
        } else if (propertyShape.hasOwnProperty(SHACL.in.value)) {
            // This is a temporary workaround; should definitely not be permanent
            // Assume Literal nodekind for any arrays
            console.log(`\t- NodeKind not found for property shape: ${property_iri}; found 'sh:in'. Setting to default literal`)
            nodeFunc = rdf.literal
        }
        else {
            console.log(`\t- NodeKind not found for property shape: ${property_iri}. Setting to default literal`)
            nodeFunc = rdf.literal
        }
        return [nodeFunc, dt]
    }


    function quadsToFormData(nodeshape_iri, subject_term, graphData, id_iri, prefixes) {
        console.log("Adding quads to formdata...")
        // Subject term should be namedNode or blankNode
        var node_iri = subject_term.value
        add_empty_node(nodeshape_iri, node_iri)
        // Get all triples with the term as subject, and add to formData
        // NOTE: these triples added to formData are only the ones that exist in graphData
        // i.e. only the values that the subject has been annotated with. The node shape
        // defines all properties that the node could have, of which the actual existing
        // properties are only a subset. This means that the `add_empty_triple` call below
        // is not populating all possible empty properties for the node, such that the form
        // can be edited in full. At the moment, this task is left to the `add_empty_triple`
        // call that is done in `onMounted` of the `PropertyShapeEditor` component. It is
        // to be determined whether this is the best way forward. But it works for now.
        // TODO ^^

        // Another TODO: the ID property of the node is not necessarily existing explicitly
        // as a triple in the graph. Refer to the `save_node` function above, where the quad
        // with the id_iri as predicate is not added to the graph when formData is saved.
        // For the current `quadsToFormData` function, the reverse process is important
        // to keep in mind, i.e. because the id_iri quad does not exist in the graph,
        // the corresponding field in formData has to be set explicitly from the subject_term,
        // because it won't be covered in the `quadArray.forEach` loop.
        var quadArray = getSubjectTriples(graphData, subject_term)
        var IdQuadExists = false
        quadArray.forEach((quad) => {
            var triple_uid = toIRI(quad.predicate.value, prefixes)
            if (triple_uid === id_iri) {
                IdQuadExists = true
            }
            add_empty_triple(nodeshape_iri, node_iri, triple_uid)
            var length = formData[nodeshape_iri][node_iri][triple_uid].length
            formData[nodeshape_iri][node_iri][triple_uid][length-1] = quad.object.value
        });
        // Here we deal with explicitly adding the id_iri quad, if necessary
        if (subject_term.termType === "NamedNode"  && !IdQuadExists) {
            add_empty_triple(nodeshape_iri, node_iri, id_iri)
            var l = formData[nodeshape_iri][node_iri][id_iri].length
            formData[nodeshape_iri][node_iri][id_iri][l-1] = node_iri
        }
    }

    function clearObjectKeys(obj) {
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                delete obj[key];
            }
        }
    }

    function objectKeysToNull(obj) {
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                obj[key] = reactive([null])
            }
        }
    }

    // expose managed state as return value
    return {
        formData,
        add_empty_node,
        remove_current_node,
        clear_current_node,
        add_empty_triple,
        add_empty_triple_manual,
        remove_triple,
        save_node,
        quadsToFormData,
        submitFormData,
    }
}