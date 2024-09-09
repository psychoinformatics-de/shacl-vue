/**
 * @module io.js
 * @description This module provides common functionality for reading and writing
 * to files or endpoints
 * 
 * It depends mainly on https://github.com/rdfjs-base/fetch-lite for reading RDF data
 * into streams and writing stream data to serialized RDF formats
 */


import formats from '@rdfjs/formats-common'
import fetch from '@rdfjs/fetch-lite'

export async function readRDF(file_url, headers = {}) {
    var res = null
    res = await fetch(file_url,
        {
            formats, 
            headers: headers
        }
    )

    // Handle cases where the server returns generic 'text/plain' content type
    if (res.headers.get('content-type').indexOf('text/plain') >= 0) {
        // default to turtle
        headers['Content-Type'] = 'text/turtle';
        res = await fetch(file_url, { formats, headers });
    }

    const quadStream = await res.quadStream()
    // quadStream.on('error', err => console.error(err))
    return quadStream
    // Examples of what to do with the quadstream:
    // 
    //   - quadStream.on('error', err => console.error(err))
    //   - quadStream.on('prefix', (prefix, ns) => {
    //         console.log(`prefix: ${prefix} ${ns.value}`)
    //     })
    //   - quadStream.on('data', quad => {
    //         console.log(`${quad.subject.value} - ${quad.predicate.value} -  ${quad.object.value}`)
    //     })
    //   -  quadStream.on('prefix', (prefix, ns) => {
    //          // do something for every prefix
    //      }).on('end', () => {
    //          // do something at the end of all prefixes
    //      })
}