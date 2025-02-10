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
import formatsPretty from '@rdfjs/formats/pretty.js'
import rdf from 'rdf-ext'
import N3 from 'n3';

import { toRaw } from 'vue';

// clone the default environment
const rdfPretty = rdf.clone()
// import pretty print serializers
rdfPretty.formats.import(formatsPretty)

export async function readRDF(file_url, headers = { "Content-Type": "text/turtle" }) {

    try {
        var res = null
        res = await fetch(file_url,
            {
                formats, 
                headers: headers
            }
        )
        // Handle cases where the server returns generic 'text/plain' or 'text/html' content type
        if (['text/plain', 'text/html'].indexOf(res.headers.get('content-type')) >= 0) {
            // default to turtle
            headers['Content-Type'] = 'text/turtle';
            res = await fetch(file_url, { formats, headers });
        }

        if (res.ok) {
            if (res.headers.get('content-type').indexOf('application/json') >= 0) {
                console.log(res.json())
                throw new Error(`readRDF error: cannot read json data`);

            }
            const quadStream = await res.quadStream()
            // quadStream.on('error', err => console.error(err))
            return quadStream
        } else {
            throw new Error(`readRDF error:: ${res.statusText}`);
        }

        
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

    } catch (error) {
        console.error('readRDF error:', error);
        throw error;
    }
    
}


export async function postRDF(endpoint, dataset, format = 'text/turtle', headers = {}, prefixes) {
    try {
        // Ensure we have the correct content-type
        headers['Content-Type'] = format;

        var N3body
        // console.log("Quads in dataset")
        const writer = new N3.Writer({ prefixes: toRaw(prefixes) }); // Create a writer which uses `c` as a prefix for the namespace `http://example.org/cartoons#`
        dataset.forEach(quad => {
            // console.log(`${quad.subject.value} - ${quad.predicate.value} - ${quad.object.value}`) 
            // console.log(`object:${quad.object.value}\nobject datatype:${quad.object.datatype?.value}\nobject language:${quad.object.language}`);
            writer.addQuad(quad)
        });
        writer.end((error, result) => {
            // console.log("N3 writer result")
            // console.log(result)
            N3body = result
        });

        // Serialize the dataset to the desired format
        const body = await rdfPretty.io.dataset.toText('text/turtle', dataset)
        // console.log("Dataset canonical")
        // console.log(dataset.toCanonical())
        // console.log("N3 Body of POST:")
        // console.log(N3body)
        // console.log("rdfPretty Body of POST:")
        // console.log(body)

        const response = await fetch(endpoint, {
            method: 'POST',
            formats, 
            headers,
            body,
            prefixes,
        });

        if (!response.ok) {
            throw new Error(`postRDF error: ${response.statusText}`);
        }

        return response;
    } catch (error) {
        console.error('postRDF error:', error);
        throw error;
    }
}




