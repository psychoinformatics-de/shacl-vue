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

export async function postRDF(endpoint, dataset, format = 'text/turtle', headers = {}, prefixes) {
    try {
        // Ensure we have the correct content-type
        headers['Content-Type'] = format;

        // Serialize the dataset to the desired format
        const body = await rdfPretty.io.dataset.toText('text/turtle', dataset)

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
