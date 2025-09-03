/**
 * @module io.js
 * @description This module provides common functionality for reading and writing
 * to files or endpoints
 */

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
            headers,
            body,
        });

        if (!response.ok) {
            let errorBody = null;
            try {
                var jsonresponse = await response.json()
                errorBody = jsonresponse.detail
            } catch {
                errorBody = '<could not read response body>';
            }

            var res = {
                success: false,
                url,
                status: response.status,
                statusText: response.statusText,
                body: errorBody,
                message: `postRDF error: HTTP ${response.status} ${response.statusText} from ${url}`,
            };
            return res;
        }
        return {
            success: true,
            url,
            status: response.status,
            statusText: response.statusText,
            message: 'RDF data POSTed successfully',
        };
    } catch (error) {
        return {
            success: false,
            error,
            url: url,
            message: error.message,
            stack: error.stack,
        };
    }
}
