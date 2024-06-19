export function toCURIE(IRI, prefixes) {
    for (const [curie, iri] of Object.entries(prefixes)) {
        if (IRI.indexOf(iri) >= 0) {
          var parts = IRI.split('/')
          return curie + ':' + parts[parts.length - 1]
        }
    }
}

export function orderArrayOfObjects(array, key) {
  // Returns an array of objects ordered by the value of a specific key 
  return array.sort((a,b) => a[key] - b[key])
}