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