import { SHACL, RDF, XSD} from '../modules/namespaces'
import rdf from 'rdf-ext';


export function toCURIE(IRI, prefixes, return_type) {
	// console.log("Inside toCURIE")
	// console.log(IRI)
	// console.log(prefixes)
  // prefixes is an object with prefix as keys and the resolved prefix IRI as the value
  if (!IRI) {
    return null
  }
  if (!prefixes) {
    console.log("no prefixes passed!!")
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


export function toIRI(CURIE, prefixes) {
  // prefixes is an object with prefix as keys and the resolved prefix IRI as the value
  if (!CURIE) {
    return null
  }
  if (!prefixes) {
    console.error("no prefixes passed!!")
    return null
  }
  if (CURIE.indexOf(':') < 0) {
    // console.log("not a valid curie, returning")
    return CURIE
  }
  var parts = CURIE.split(':')
  var pref = parts[0]
  var prop = parts[1]
  if (Object.keys(prefixes).indexOf(pref) < 0) {
    return CURIE
  }
  return prefixes[pref] + prop
}


export function nameOrCURIE(shape, prefixes, readable=false) {
  if (shape.hasOwnProperty(SHACL.name.value)) {
      return shape[SHACL.name.value]
  } else {
      if (readable) {
        return makeReadable(toCURIE(shape[SHACL.path.value], prefixes, "parts").property)
      }
      return toCURIE(shape[SHACL.path.value], prefixes)
  }
}


export function orderArrayOfObjects(array, key) {
  // Returns an array of objects ordered by the value of a specific key 
  return [...array].sort((a,b) => a[key] - b[key])
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


export function isEmptyObject(obj) {
  for (const prop in obj) {
    if (Object.hasOwn(obj, prop)) {
      return false;
    }
  }
  return true;
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

export function dlTTL(ttlstring) {
  // Data
  const blob = new Blob([ttlstring], { type: "text/turtle" });
  // Create a link element
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "graphdata.ttl";
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


export function getLiteralAndNamedNodes(graphData, predicate, propertyClass, prefixes) {
  var propClassCurie = toCURIE(propertyClass, prefixes)
  // a) use the literal node with xsd data type
  const literalNodes = rdf.grapoi({ dataset: graphData })
      .hasOut(predicate, rdf.literal(String(propClassCurie), XSD.anyURI))
      .quads();
  // b) and the named node
  const uriNodes = rdf.grapoi({ dataset: graphData })
      .hasOut(predicate, rdf.namedNode(propertyClass))
      .quads();
  // return as a concatenated array of quads
  return Array.from(literalNodes).concat(Array.from(uriNodes))
}


export function getSubjectTriples(graphData, someTerm, blankNodesResolved=false) {
  // console.log(`Getting all triples with subject: ${someTerm.value}`)
  const quads = rdf.grapoi({ dataset: graphData, term: someTerm }).out().quads();
  // Array.from(quads).forEach(quad => {
  //     console.log(`\t${quad.subject.value} - ${quad.predicate.value} - ${quad.object.value}`)
  // })
  var quadArray = Array.from(quads)
  if (blankNodesResolved) {
    quads.forEach(q => {
      if (q.object.termType === "BlankNode") {
        var moreQuads = getSubjectTriples(graphData, q, true)
        quadArray = quadArray.concat(Array.from(moreQuads))
      }
    })
  }
  return quadArray  
}


export function getObjectTriples(graphData, someTerm) {
  // console.log(`Getting all triples with object: ${someTerm.value}`)
  const quads = rdf.grapoi({ dataset: graphData, term: someTerm }).in().quads();
  // Array.from(quads).forEach(quad => {
  //     console.log(`\t${quad.subject.value} - ${quad.predicate.value} - ${quad.object.value}`)
  // })
  return Array.from(quads)
}


export function addCodeTagsToText(text) {
	return text.replace(/`([^`]+)`/g, '<code class="code-style">$1</code>');
}

export function findObjectByKey(array, key, value) {
    return array.find(obj => obj[key] === value);
}

export function replaceServiceIdentifier(id, arg_string, prefixes) {
  // id: The URI parameter to be formatter
  // arg_string: The formatting instruction "record?id={curie}&format=ttl";

  // First extract the part inside the curly brackets
  const id_type = arg_string.match(/{(.*?)}/)[1];
  var replacement_id
  // console.log(`id_type = ${id_type}`)

  if (id_type == "curie") {
      replacement_id = toCURIE(id, prefixes)
  } else if (id_type == "name") {
      replacement_id = toCURIE(id, prefixes, "parts").property
  } else if (id_type == "uri") {
      replacement_id = id
  } else {
      replacement_id = id
  }
  // console.log(replacement_id)
  // Replace curly brackets and everything in between
  return arg_string.replace(/{.*?}/, encodeURIComponent(replacement_id));
}

export function makeReadable(input) {
  // capitalize first letter
  var output = input.charAt(0).toUpperCase() + input.slice(1)
  // Replace underscores and dashes with space
  output = output.replace(/_/g,' ');
  output = output.replace(/-/g,' ');
  return output
}
