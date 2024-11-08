// formdata.js


import { reactive, ref, computed, inject} from 'vue'
import rdf from 'rdf-ext';
import { DLTHING, SHACL, RDF} from '@/modules/namespaces';
import formatsPretty from '@rdfjs/formats/pretty.js'

export function useFormData() {

  const formData = reactive({})
  const rdfPretty = rdf.clone()
  rdfPretty.formats.import(formatsPretty)
  // This is a stopgap and needs to be parameterized or made part of config somehow
  const ID_IRI = DLTHING.id.value

  const graphData = inject('graphData')

  function add_empty_node(node_uid) {
    // if the node key does not exist in the lookup object yet, add it
    // if the node key already exists in the lookup object, do nothing
    if (Object.keys(formData).indexOf(node_uid) < 0) {
      // The added value is an array of objects to allow multiple of the same
      // nodes to be added
      formData[node_uid] = reactive([{}])
    } else {
      formData[node_uid].push({})
    }
  }

  function remove_current_node(node_uid) {
    console.log(`Instructed to remove the last element of the node array: ${node_uid}`)
    // Error: if the node key does not exist in the lookup object
    if (Object.keys(formData).indexOf(node_uid) < 0) {
      console.error(`Trying to delete a node that does not exist in form data:\n${node_uid}`)
    }
    // Error: if the node value is not an array
    else if (!Array.isArray(formData[node_uid])) {
      console.error(`Not an array, cannot remove current node (${node_uid}):\n${formData[node_uid]}`)
    }
    // remove last element in array
    else {
      console.log("formdata in remove_current_node function")
      console.log(formData)
      formData[node_uid].pop()
      if (formData[node_uid].length == 0 ){ delete formData[node_uid]}
      
      // if (formData[node_uid].length == 1) {
      //   formData[node_uid] = reactive([{}])
      // } else {
      //   formData[node_uid].pop()
      // }

      
      
    }
  }

  function clear_current_node(node_uid) {
    // Error: if the node key does not exist in the lookup object
    if (Object.keys(formData).indexOf(node_uid) < 0) {
      console.error(`Trying to delete a node that does not exist in form data:\n${node_uid}`)
    }
    // Error: if the node value is not an array
    else if (!Array.isArray(formData[node_uid])) {
      console.error(`Not an array, cannot remove current node (${node_uid}):\n${formData[node_uid]}`)
    }
    // clear last element in array
    else {
      console.log(formData[node_uid].at(-1))
      objectKeysToNull(formData[node_uid].at(-1))
    }
  }

  function add_empty_triple(node_uid, triple_uid) {
    // if the node uid exists and the triple uid (predicate) does not exist, add it
    // if the node uid exists and the triple uid already exists, add empty value to array
    // if the node uid does not exist, print console error because this should not be possible
    if (Object.keys(formData).indexOf(node_uid) >= 0) {
      // Current node being edited is always the last in the array of nodes
      if (Object.keys(formData[node_uid].at(-1)).indexOf(triple_uid) < 0) {
        formData[node_uid].at(-1)[triple_uid] = reactive([null])
      } else {
        formData[node_uid].at(-1)[triple_uid].push(null)
      }
    } else {
      console.error(`Node UID not in formData yet: ${node_uid}. Cannot add triple to non-existing node.`)
    }
  }

  function remove_triple(node_uid, triple_uid, triple_idx) {
    if (Object.keys(formData).indexOf(node_uid) >= 0) {
      // Current node being edited is always the last in the array of nodes
      if (Object.keys(formData[node_uid].at(-1)).indexOf(triple_uid) < 0) {
        console.error(`Triple UID ${triple_uid} not in specific node ${node_uid} in formData. Cannot remove non-existing triple.`)
      } else {
        formData[node_uid].at(-1)[triple_uid].splice(triple_idx, 1)
      }
    } else {
      console.error(`Node UID not in formData: ${node_uid}. Cannot remove triple from non-existing node.`)
    }
  }

  function save_node(node_uid, nodeShapes) {
    // Check if the node exists beforehand
    console.log(`Saving node of type: ${node_uid}`)
    if (formData[node_uid]) {
      // console.log("Node has entry in formData")
      // console.log(`Current node value: ${formData[node_uid].at(-1)}`)
      var shape = nodeShapes[node_uid]
      // console.log(`Node shape: ${shape}`)
      var properties = shape.properties
      // console.log(`Shape properties: ${properties}`)
      // Subject should either be a named node or blank node
      // - named node if any of the properties is an ID
      // - blank node if no ID found
      // TODO: how do we know know the IRI of the ID field?
      var subject
      if ( Object.keys(formData[node_uid].at(-1)).indexOf(ID_IRI) >= 0) {
        console.log(`\t- node has id field: ${formData[node_uid].at(-1)[ID_IRI]}`)
        subject = rdf.namedNode(formData[node_uid].at(-1)[ID_IRI])
      } else {
        console.log(`\t- node DOES NOT have id field`)
        subject = rdf.blankNode()
      }

      let firstQuad = rdf.quad(subject, rdf.namedNode(RDF.type.value), rdf.namedNode(node_uid))
      graphData.add(firstQuad)

      // Loop through all keys, i.e. properties of shape, i.e. triple predicates
      for (var pred of Object.keys(formData[node_uid].at(-1))) {
        console.log(`\t- processing predicate: ${pred}`)
        // Only process entered values
        if (Array.isArray(formData[node_uid].at(-1)[pred]) &&
            formData[node_uid].at(-1)[pred].length == 1 &&
            formData[node_uid].at(-1)[pred][0] === null) {
            // console.log("Node predicate has no value, skipping")
            continue;
        }
        // Don't add ID quad:
        if (pred == ID_IRI) {
            continue;
        }
        // console.log(`Predicate value:\n`)
        // console.log(formData[node_uid].at(-1)[pred])
        let predicate = rdf.namedNode(pred)
        // Find associated property shape, for information about nodekind
        var property_shape = properties.find((prop) => prop[SHACL.path.value] == pred)
        var nodeFunc = null
        var dt = null
        if ( property_shape.hasOwnProperty(SHACL.nodeKind.value) ) {
          // options = sh:BlankNode, sh:IRI, sh:Literal, sh:BlankNodeOrIRI, sh:BlankNodeOrLiteral, sh:IRIOrLiteral
          // sh:nodeKind == sh:Literal
          if ( property_shape[SHACL.nodeKind.value] == SHACL.Literal.value ) {
            nodeFunc = rdf.literal
            // sh:datatype exists
            if ( property_shape.hasOwnProperty(SHACL.datatype.value) ) {
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
        for (var obj of formData[node_uid].at(-1)[pred]) {
          let object
          if (dt) {
            object = nodeFunc(String(obj), dt)
          } else {
            object = nodeFunc(obj)
          }
          let quad = rdf.quad(subject, predicate, object)
          graphData.add(quad)
        }
      }
      // at the end, what to do with current data in formdata? delete node element?
      // add_empty_node(node_uid);
    } else {
      console.error(`\t- Node ${node_uid} does not exist`)
    }
  }

  function clearObjectKeys(obj) {
    for (var key in obj){
      if (obj.hasOwnProperty(key)){
          delete obj[key];
      }
    }
  }

  function objectKeysToNull(obj) {
    for (var key in obj){
      if (obj.hasOwnProperty(key)){
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
    remove_triple,
    save_node
  }
}

// -----------------------
// Structure of form data:
// -----------------------


// Object with keys being the subject of a triple
// {
//   <class_iri>: [ // Array of class instances
//      // class instance 1
//      // Object with keys being predicates of triples 
//      {
//          // predicate 1
//          <property_iri>: [ // Array with elements being objects of triples
//             <value1>,
//             <value2>
//          ]
//          // predicate 2
//          <property_iri>: [
//             <value3>,
//             <value4>
//          ]
//          ...
//      },
//      // class instance 2
//      {
//         ...
//      }
//   ] 
//   ...
// }


// -------------------------------
// Example structure of form data:
// -------------------------------

// {
//   "https://concepts.datalad.org/s/sddui/unreleased/ScientificDataDistribution": [
//      {
//          https://concepts.datalad.org/s/thing/unreleased/name": [
//             <value1>,
//             <value2>
//          ]
//          https://concepts.datalad.org/s/thing/unreleased/title": [
//             <value3>,
//             <value4>
//          ]
//          ...
//      },
//      {
//         ...
//      }
//   ] 
//   ...
// }
