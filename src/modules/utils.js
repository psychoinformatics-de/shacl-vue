import { SHACL, RDF } from '../modules/namespaces'
import rdf from 'rdf-ext';

export function toCURIE(IRI, prefixes, return_type) {
  // prefixes is an object with prefix as keys and the resolved prefix IRI as the value
  if (!IRI) {
    return null
  }
  const longToShort = Object.values(prefixes).sort((a, b) => b.length - a.length);
  for (const iri of longToShort) {
    if (IRI.indexOf(iri) >= 0) {
      const prefix = objectFlip(prefixes)[iri]
      const property = IRI.substring(iri.length)
      if (return_type == "parts") {
        return {
          "prefix": prefix,
          "property": property,
        }
      } else {
        return prefix + ':' + property
      }
    }
  }
  return IRI
}


export function nameOrCURIE(shape, prefixes) {
  if (shape.hasOwnProperty(SHACL.name.value)) {
      return shape[SHACL.name.value]
  } else {
      return toCURIE(shape[SHACL.path.value], prefixes)   
  }
}


export function orderArrayOfObjects(array, key) {
  // Returns an array of objects ordered by the value of a specific key 
  return array.sort((a,b) => a[key] - b[key])
}


function objectFlip(obj) {
  // Flip the keys and values of an object
  return Object.keys(obj).reduce((ret, key) => {
    ret[obj[key]] = key;
    return ret;
  }, {});
}

export function isObject(val) {
  return typeof val === 'object' && !Array.isArray(val) && val !== null
}

export function resolveBlankNode(blankNode, shapesDataset) {

  // Check if a node is an RDF list (rdf:first and rdf:rest)
  const isRdfList = (node) => {
    let hasFirst = false;
    let hasRest = false;
    shapesDataset.forEach((quad) => {
      if (quad.subject.equals(node)) {
        if (quad.predicate.value === RDF.first.value) hasFirst = true;
        if (quad.predicate.value === RDF.rest.value) hasRest = true;
      }
    });
    return hasFirst && hasRest;
  };

  // Convert an RDF list into an array, handling literals and IRIs
  const rdfListToArray = (startNode) => {
    const listItems = [];
    let currentNode = startNode;

    while (currentNode && currentNode.value !== RDF.nil.value) {
      let listItem = null;

      // Get the first element in the RDF list
      shapesDataset.forEach((quad) => {
        if (quad.subject.equals(currentNode) && quad.predicate.value === RDF.first.value) {
          // Resolve blank nodes recursively, but handle literals and IRIs separately
          if (quad.object.termType === "BlankNode") {
            listItem = resolveBlankNode(quad.object, shapesDataset);
          } else if (quad.object.termType === "Literal") {
            listItem = quad.object.value; // Store literal value
          } else if (quad.object.termType === "NamedNode") {
            listItem = quad.object.value; // Store IRI as a string
          }
        }
      });

      if (listItem !== null) {
        listItems.push(listItem);
      }

      // Move to the next item in the list (rdf:rest)
      let nextNode = null;
      shapesDataset.forEach((quad) => {
        if (quad.subject.equals(currentNode) && quad.predicate.value === RDF.rest.value) {
          nextNode = quad.object;
        }
      });

      currentNode = nextNode;
    }

    return listItems;
  };

  let resolvedObject = {};
  
  shapesDataset.forEach((quad) => {
    if (quad.subject.equals(blankNode)) {
      const predicate = quad.predicate.value;
      const object = quad.object;

      // If the object is a blank node, resolve it recursively
      if (object.termType === "BlankNode") {
        // Check if it's an RDF list and convert it to an array
        if (isRdfList(object)) {
          resolvedObject[predicate] = rdfListToArray(object);
        } else {
          resolvedObject[predicate] = resolveBlankNode(object, shapesDataset);
        }
      } else if (object.termType === "Literal") {
        resolvedObject[predicate] = object.value; // Handle literal values
      } else if (object.termType === "NamedNode") {
        resolvedObject[predicate] = object.value; // Handle IRIs as strings
      }
    }
  });

  return resolvedObject;
}



// export function resolveBlankNode(blankNode, shapesDataset) {

//   // Function to check if a node is an RDF list (rdf:first and rdf:rest)
//   const isRdfList = (node) => {
//     let hasFirst = false;
//     let hasRest = false;
//     shapesDataset.forEach((quad) => {
//       if (quad.subject.equals(node)) {
//         if (quad.predicate.value === RDF.first.value) hasFirst = true;
//         if (quad.predicate.value === RDF.rest.value) hasRest = true;
//       }
//     });
//     return hasFirst && hasRest;
//   };

//   // Function to convert an RDF list into an array
//   const rdfListToArray = (startNode) => {
//     const listItems = [];
//     let currentNode = startNode;

//     while (currentNode && currentNode.value !== RDF.nil.value) {
//       let listItem = null;

//       // Get the first element in the RDF list
//       shapesDataset.forEach((quad) => {
//         if (quad.subject.equals(currentNode) && quad.predicate.value === RDF.first.value) {
//           if (quad.object.termType === "BlankNode") {
//             listItem = resolveBlankNode(quad.object, shapesDataset); // Recursively resolve blank nodes
//           } else {
//             listItem = { [quad.predicate.value]: quad.object.value }; // Store object value
//           }
//         }
//       });

//       if (listItem !== null) {
//         listItems.push(listItem);
//       }

//       // Move to the next item in the list (rdf:rest)
//       let nextNode = null;
//       shapesDataset.forEach((quad) => {
//         if (quad.subject.equals(currentNode) && quad.predicate.value === RDF.rest.value) {
//           nextNode = quad.object;
//         }
//       });

//       currentNode = nextNode;
//     }

//     return listItems;
//   };

//   let resolvedObject = {};
  
//   shapesDataset.forEach((quad) => {
//     if (quad.subject.equals(blankNode)) {
//       const predicate = quad.predicate.value;
//       const object = quad.object;

//       // If the object is a blank node, resolve it recursively
//       if (object.termType === "BlankNode") {
//         // Check if it's an RDF list and convert it to an array
//         if (isRdfList(object)) {
//           resolvedObject[predicate] = rdfListToArray(object);
//         } else {
//           resolvedObject[predicate] = resolveBlankNode(object, shapesDataset);
//         }
//       } else {
//         resolvedObject[predicate] = object.value; // Store the value
//       }
//     }
//   });

//   return resolvedObject;
// }

export function dlJSON(jsonObject) {
  // Data
  const jsonString = JSON.stringify(jsonObject);
  const blob = new Blob([jsonString], { type: "application/json" });
  // Create a link element
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "data.json";
  document.body.appendChild(link);
  // Click to download, and remove
  link.click();
  document.body.removeChild(link);
}

export function downloadTSV(data, filename) {
  const blob = new Blob([data], { type: 'text/tsv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}