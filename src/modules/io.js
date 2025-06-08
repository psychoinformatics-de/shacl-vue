/**
 * @module io.js
 * @description This module provides common functionality for reading and writing
 * to files or endpoints
 *
 * It depends mainly on https://github.com/rdfjs-base/fetch-lite for reading RDF data
 * into streams and writing stream data to serialized RDF formats
 */

import formats from '@rdfjs/formats-common';
import fetch from '@rdfjs/fetch-lite';
import { Writer } from 'n3';

export async function postRDF(
    endpoint,
    dataset,
    format = 'text/turtle',
    headers = {},
    prefixes
) {
    const url = endpoint;
    try {
        // Ensure we have the correct content-type
        headers['Content-Type'] = format;

        // Serialize the dataset to the desired format
        const body = await new Promise((resolve, reject) => {
            const writer = new Writer({ prefixes: prefixes });
            writer.addQuads(dataset.getQuads(null, null, null, null));
            writer.end((error, result) => {
                if (error) reject(error);
                else resolve(result.trim());
            });
        });

        const response = await fetch(url, {
            method: 'POST',
            formats,
            headers,
            body,
            prefixes,
        });

        if (!response.ok) {
            // throw new Error(`readRDF error: ${res.statusText}`)
            const code = response.status || 'Unknown';
            const error = new Error(`postRDF error: HTTP ${code} from ${url}`);
            error.status = code;
            error.url = url;
            error.response = response;
            throw error;
        }

        return {
            success: true,
            url: url,
            message: 'RDF data POSTed successfully',
        };
    } catch (error) {
        return {
            success: false,
            error,
            url: url,
            message: error.message,
        };
    }
}
