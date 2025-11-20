import { SHACL, RDFS, RDF, DLTHINGS, SKOS } from '../modules/namespaces';
import { toCURIE, toIRI } from 'shacl-tulip';
import { DataFactory, Writer } from 'n3';
const { namedNode, blankNode} = DataFactory;

export function nameOrCURIE(shape, prefixes, readable = false) {
    if (shape.hasOwnProperty(SHACL.name.value)) {
        return shape[SHACL.name.value];
    } else {
        if (readable) {
            return makeReadable(
                toCURIE(shape[SHACL.path.value], prefixes, 'parts').property
            );
        }
        return toCURIE(shape[SHACL.path.value], prefixes);
    }
}

export function orderArrayOfObjects(array, key) {
    // Returns an array of objects ordered by the value of a specific key
    return [...array].sort((a, b) => a[key] - b[key]);
}

export function isObject(val) {
    return typeof val === 'object' && !Array.isArray(val) && val !== null;
}

export function dlJSON(jsonObject) {
    // Data
    const jsonString = JSON.stringify(jsonObject);
    const blob = new Blob([jsonString], { type: 'application/json' });
    // Create a link element
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'data.json';
    document.body.appendChild(link);
    // Click to download, and remove
    link.click();
    document.body.removeChild(link);
}

export function dlTTL(ttlstring, filename) {
    // Data
    const blob = new Blob([ttlstring], { type: 'text/turtle' });
    // Create a link element
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
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

export function addCodeTagsToText(text) {
    return text.replace(/`([^`]+)`/g, '<code class="code-style">$1</code>');
}

export function findObjectByKey(array, key, value) {
    return array.find((obj) => obj[key] === value);
}

export function findObjectIndexByKey(array, key, value) {
    return array.findIndex((obj) => obj[key] === value);
}

export function replaceServiceIdentifier(id, arg_string, prefixes) {
    // id: The URI parameter to be formatted
    // arg_string: The formatting instruction "record?id={curie}&format=ttl";

    // First extract the part inside the curly brackets
    const id_type = arg_string.match(/{(.*?)}/)[1];
    var replacement_id;
    // console.log(`id_type = ${id_type}`)

    if (id_type == 'curie') {
        replacement_id = toCURIE(id, prefixes);
    } else if (id_type == 'name') {
        replacement_id = toCURIE(id, prefixes, 'parts').property;
    } else if (id_type == 'uri') {
        replacement_id = id;
    } else {
        replacement_id = id;
    }
    // console.log(replacement_id)
    // Replace curly brackets and everything in between
    return arg_string.replace(/{.*?}/, encodeURIComponent(replacement_id));
}

export function makeReadable(input) {
    // capitalize first letter
    var output = input.charAt(0).toUpperCase() + input.slice(1);
    // Replace underscores and dashes with space
    output = output.replace(/_/g, ' ');
    output = output.replace(/-/g, ' ');
    return output;
}

export function getPrefLabel(node, graphDataset, allPrefixes, from) {
    // console.log("Inside getPrefLabel")
    // console.log(allPrefixes)
    var prefLabel = '';
    // Get quads related to a subject
    // node.value = toIRI(node.value, allPrefixes)
    var relatedQuads = graphDataset.getSubjectTriples(node);

    // Isolate first quad with predicate 'skos:prefLabel'
    var prefLabelQuad = relatedQuads.find((q) => {
        return (
            q.predicate.value == SKOS.prefLabel.value &&
            q.object.termType === 'Literal'
        );
    });

    if (prefLabelQuad) {
        return prefLabelQuad.object.value;
    }

    // Isolate quads that are 'DLTHINGS.annotations'
    var annotationQuads = relatedQuads.filter((q) => {
        return (
            q.predicate.value == DLTHINGS.annotations.value &&
            q.object.termType === 'BlankNode'
        );
    });
    // If no annotations, return empty string
    if (!annotationQuads) {
        return prefLabel;
    }
    // For each annotation quad, ...
    for (var aq of annotationQuads) {
        var bnQuads = graphDataset.getSubjectTriples(aq.object);
        var annotationTagQuad = bnQuads.find((bnQ) => {
            return (
                bnQ.predicate.value == DLTHINGS.annotation_tag.value &&
                (bnQ.object.value == 'skos:prefLabel' ||
                    bnQ.object.value == toIRI('skos:prefLabel', allPrefixes))
            );
        });
        if (annotationTagQuad) {
            var annotationValueQuad = bnQuads.find((bnQ2) => {
                return bnQ2.predicate.value == DLTHINGS.annotation_value.value;
            });
            if (annotationValueQuad) {
                prefLabel = annotationValueQuad.object.value;
                console.log(`Found annotation '${prefLabel}' for node:`);
                console.log(node.value);
                break;
            }
        }
    }
    return prefLabel;
}

export function snakeToPascal(snakeStr) {
    return snakeStr
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');
}

export function snakeToCamel(snakeStr) {
    return snakeStr
        .split('_')
        .map((word, index) =>
            index === 0
                ? word.toLowerCase()
                : word.charAt(0).toUpperCase() + word.slice(1)
        )
        .join('');
}

export function toSnakeCase(str) {
    return (
        str
            // Insert an underscore before uppercase letters (except at the beginning)
            .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
            // Replace spaces, hyphens, and multiple underscores with a single underscore
            .replace(/[\s\-]+/g, '_')
            // Lowercase the entire string
            .toLowerCase()
    );
}

export function adjustHexColor(hexColor, amount) {
    // Remove the '#' if present
    let colorInt = parseInt(hexColor.replace('#', ''), 16);
    // Adjust the color value
    colorInt = Math.max(0, Math.min(0xffffff, colorInt + amount));
    // Convert back to hex and ensure it's always 6 digits
    return `#${colorInt.toString(16).padStart(6, '0')}`;
}

export function getDisplayName(uri, configVarsMain, prefixes, shape = {}) {
    // configVarsMain.classNameDisplay should be one of:
    // - name: the value of the nodeshape's `sh:name` attribute (e.g. Organization)
    // - reference: the reference of the nodeshape CURIE (e.g. DSCOrganization)
    // - curie: the full CURIE of the nodeshape IRI (e.g. trr379cps:DSCOrganization)
    let mode = configVarsMain.classNameDisplay;
    let name = shape.hasOwnProperty(SHACL.name.value) ? shape[SHACL.name.value] : null;
    let reference = toCURIE(uri, prefixes, 'parts').property;
    let curie = toCURIE(uri, prefixes);
    if (mode == 'name') {
        return name ? name : reference;
    } else if (mode == 'reference') {
        return reference;
    } else {
        return curie
    }
}

export function getSuperClasses(class_uri, graph) {
    var superClasses = [];
    var endReached = false;
    var sC;
    var uri = class_uri;
    while (endReached != true) {
        sC = getSuperClass(uri, graph);
        if (sC == null) {
            endReached = true;
        } else {
            for (var el of sC) {
                superClasses.push(el.object.value);
            }
            if (sC.length == 2) {
                sC = sC[1];
            } else {
                sC = sC[0];
            }
            uri = sC.object.value;
        }
    }
    return superClasses;
}

export function getSuperClass(class_uri, graph) {
    const superClass = graph.getQuads(
        namedNode(class_uri),
        namedNode(RDFS.subClassOf.value),
        null,
        null
    );
    if (superClass.length > 0) {
        // this is an array which will most likely have a single element, but could have multiple
        return superClass.reverse();
    }
    return null;
}

export function getSubClasses(class_uri, graph) {
    const visited = new Set();
    const subClasses = new Set();
    function traverse(uri) {
        if (visited.has(uri)) return;
        visited.add(uri);
        const direct = getDirectSubClasses(uri, graph);
        if (!direct) return;
        for (const quad of direct) {
            const subUri = quad.subject.value;
            if (!subClasses.has(subUri)) {
                subClasses.add(subUri);
                traverse(subUri);
            }
        }
    }
    traverse(class_uri);
    return Array.from(subClasses);
}

export function getDirectSubClasses(class_uri, graph) {
    const subClasses = graph.getQuads(
        null,
        namedNode(RDFS.subClassOf.value),
        namedNode(class_uri),
        null
    );
    if (subClasses.length > 0) {
        return subClasses;
    }
    return null;
}

export function getPidQuad(pid, graph) {
    const q = graph.getQuads(
        namedNode(pid),
        namedNode(RDF.type.value),
        null,
        null
    );
    if (q && q.length) {
        return q[0];
    } else {
        return undefined;
    }
}

export function getSubjectQuad(subj, graph) {
    const q = graph.getQuads(
        subj.termType === 'BlankNode' ? blankNode(subj.value): namedNode(subj.value),
        namedNode(RDF.type.value),
        null,
        null
    );
    if (q && q.length) {
        return q[0];
    } else {
        return undefined;
    }
}

export function objectsEqual(obj1, obj2) {
    if (Object.keys(obj1).length !== Object.keys(obj2).length) {
        return false;
    }

    for (var key of Object.keys(obj1)) {
        if (obj1[key] !== obj2[key]) {
            return false;
        }
    }
    return true;
}

export async function quadsToTTL(allQuads, allPrefixes) {
    var usedPrefixes = {};
    allQuads.forEach((quad) => {
        var iris = [
            quad.subject.value,
            quad.predicate.value,
            quad.object.value,
        ];
        if (quad.object.termType == 'Literal' && quad.object.datatype?.value) {
            var lp = toCURIE(quad.object.datatype.value, allPrefixes, 'parts');
            if (lp == quad.object.datatype.value || !lp) {
                // means the IRI does not use a known prefix
            } else {
                usedPrefixes[lp['prefix']] = allPrefixes[lp['prefix']];
            }
        }
        for (var i of iris) {
            var p = toCURIE(i, allPrefixes, 'parts');
            if (p == i || !p) {
                // means the IRI does not use a known prefix
                continue;
            } else {
                usedPrefixes[p['prefix']] = allPrefixes[p['prefix']];
            }
        }
    });

    const ttl = await new Promise((resolve, reject) => {
        const writer = new Writer({ prefixes: usedPrefixes });
        writer.addQuads(allQuads);
        writer.end((error, result) => {
            if (error) reject(error);
            else resolve(result.trim());
        });
    });
    return ttl;
}

export function getAllClasses(classDS, main_class) {
    return [main_class].concat(getSubClassesOld(classDS, main_class));
}

export function getSubClassesOld(classDS, main_class) {
    // Find quads in the subclass datasetnodes with predicate rdfs:subClassOf
    // object main_class, and return as an array of terms
    const subClasses = classDS.data.graph.getQuads(
        null,
        namedNode(RDFS.subClassOf.value),
        namedNode(main_class),
        null
    );
    var myArr = [];
    subClasses.forEach((quad) => {
        myArr.push(quad.subject.value);
    });
    return myArr;
}

export function hasConfigDisplayLabel(class_uri, allPrefixes, configVarsMain) {
    var class_curi = toCURIE(class_uri, allPrefixes)
    if (configVarsMain.displayNameAutogenerate.hasOwnProperty(class_curi)) {
        return configVarsMain.displayNameAutogenerate[class_curi]
    } else {
        return false
    }
}

export function getConfigDisplayLabel(labelTemplate, labelParts, configVarsMain, rdfDS, allPrefixes) {
    const regex = /{([^}]+)}/g;
    const defaultPlaceholder = 
        "default" in configVarsMain.displayNameAutogeneratePlaceholder ? 
        configVarsMain.displayNameAutogeneratePlaceholder.default : "[?]"

    return labelTemplate.replace(regex, (_, key) => {
        let missingPlaceholder =
            key in configVarsMain.displayNameAutogeneratePlaceholder ? 
            configVarsMain.displayNameAutogeneratePlaceholder[key] : defaultPlaceholder
        if (!(key in labelParts)) {
            return missingPlaceholder;
        }
        let objectVal = labelParts[key];
        if (!Array.isArray(objectVal)) {
            objectVal = [objectVal];
        }

        const resolved = objectVal.map((val) => {
            if (rdfDS && allPrefixes) {
                let relatedRecordQuad = getPidQuad(val, rdfDS.data.graph);
                if (relatedRecordQuad) {
                    return getRecordDisplayLabel(
                        relatedRecordQuad.subject,
                        rdfDS,
                        allPrefixes,
                        configVarsMain
                    );
                }
            }
            return val;
        });
        return resolved.join(", ");
    });
}

export function quadsToTripleObject(quads, allPrefixes) {
    let tripleObject = {}
    for (const q of quads) {
        let predCuri = toCURIE(q.predicate.value, allPrefixes)
        if (!tripleObject[predCuri]) {
            tripleObject[predCuri] = [];
        }
        tripleObject[predCuri].push(q.object.value);
    }
    return tripleObject
}

export function getRecordDisplayLabel(subjectTerm, rdfDS, allPrefixes, configVarsMain) {
    let displayLabel = ''
    // First get the node statement, because we need its class
    // e.g.: 'subjectTerm rdf:type ex:Dataset .'
    let subjQ = getSubjectQuad(subjectTerm, rdfDS.data.graph)
    // let pidQ = getPidQuad(subjectTerm.value, rdfDS.data.graph)
    if (!subjQ) {
        // This should technically never happen since we're working with named nodes here
        // but the escape route is still necessary to prevent timing errors from
        // clogging the console
        return displayLabel
    }
    let classIRI = subjQ.object.value;
    let relatedQuads = rdfDS.getSubjectTriples(subjectTerm);
    // Convert to triples as an object with predicate-object key-values
    let relatedTriples = quadsToTripleObject(relatedQuads, allPrefixes)        
    let labelTemplate = hasConfigDisplayLabel(classIRI, allPrefixes, configVarsMain)
    if (labelTemplate) {
        displayLabel = getConfigDisplayLabel(labelTemplate, relatedTriples, configVarsMain, rdfDS, allPrefixes)
    }
    // If the label is only the placeholder, rather display the pid
    if ( displayLabel == configVarsMain.displayNameAutogeneratePlaceholder.default ||
        displayLabel == "[?]" || !displayLabel ) {
        displayLabel = subjectTerm.value
    }
    return displayLabel
}

export function nodeShapeHasPID(nodeshapeIRI, shapesDS, pidIRI) {
    // Use SHACL shaped to check if a node has PID, i.e. if it will be a named node
    // - if the nodeshape does NOT have a propertyshape with sh:path being equal to ID_IRI,
    // - it means the class's records will be blank nodes 
    var nodeShape = shapesDS.data.nodeShapes[nodeshapeIRI];
    if (!nodeShape) return undefined
    var ps = nodeShape.properties.find(
        (prop) => prop[SHACL.path.value] == pidIRI
    );
    return ps ? true : false
}

export async function hashSubgraph(quads) {
    if (!quads || !quads.length) return '';
    // Simple canonicalization function that calculates a persistent hash
    // form a set of quads, by doing the following per quad:
    // - replacing blank node subject and object values with '_:'
    // - using named node subject, predicate, and object values as they are
    // - concatenating the above with a separator, as a string
    // then sorting all resulting strings, and lastly joining the sorted
    // strings with newline characters, before calculating the SHA-256 hash.
    const sorted = quads.map(q => {
        const subj = q.subject.termType === 'BlankNode' ? '_:' : q.subject.value;
        const obj = q.object.termType === 'BlankNode' ? '_:' : q.object.value;
        return `${subj}|${q.predicate.value}|${obj}`;
    }).sort();
    const canonicalString = sorted.join('\n');
    // Encode to bytes for hashing
    const encoder = new TextEncoder();
    const data = encoder.encode(canonicalString);
    // Compute SHA-256 using the browser's Web Crypto API
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    // Convert to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex
}

export function getRecordQuads(pid, graph, recursive=false) {
    // Return an array of quads related to a specific named node
    // Default will return only the first level of quads, i.e. all quads
    // that have the named node as subject.
    // Set `recursive` to true to get quads related to blank node objects recursively
    // related named nodes are not recursively resolved
    const visited = new Set();
    const allQuads = [];
    function addQuadsRecursively(quads) {
        for (const qd of quads) {
            if (!allQuads.includes(qd)) {
                allQuads.push(qd);
                if (qd.object.termType === 'BlankNode') {
                    const id = qd.object.value;
                    if (!visited.has(id)) {
                        visited.add(id);
                        const moreQuads = graph.getQuads(qd.object, null, null, null);
                        addQuadsRecursively(Array.from(moreQuads));
                    }
                }
            }
        }
    }
    const baseQuads = graph.getQuads(namedNode(pid), null, null, null);
    if (recursive) {
        addQuadsRecursively(baseQuads);
        return allQuads;
    } else {
        return baseQuads;
    }
}

export function getContent(content, key) {
    if (key.startsWith('content:')) {
        let contentKey = key.replace('content:','')
        return content[contentKey].value
    } else {
        return key
    }
}

export function fillStringTemplate(template, params) {
    return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, key) => {
        if (!(key in params)) {
            if (key == '_randomUUID') {
                return crypto.randomUUID()
            } else {
                console.error(`Error: No value provided for placeholder {${key}}`);
                return match;
            }
        }
        return params[key];
    });
}