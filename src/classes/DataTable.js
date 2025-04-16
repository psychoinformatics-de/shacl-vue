import { SHACL } from '../modules/namespaces'
import { findObjectByKey } from '../modules/utils'
import { toCURIE, toIRI } from 'shacl-tulip';
import { toRaw } from 'vue';

const reactiveCloneFunc = ((data) => {
    return structuredClone(toRaw(data))
});

export class DataTable {

    constructor(table, class_iri, record_iri, shapesDS, formData, allPrefixes, ID_IRI) {
        this.DELIMITER = ',';
        this.table = table
        this.columns = table.getColumnDefinitions().map(col => col.title)
        this.class_iri = class_iri
        this.record_iri = record_iri
        this.shapesDS = shapesDS
        this.nodeShape = this.shapesDS.data.nodeShapes[class_iri]
        this.ID_IRI = ID_IRI
        this.allPrefixes = allPrefixes
        this.formData = formData
        this.mappedProps = this.mapProps()
    }

    mapProps() {
        var mappedProps = {}
        mappedProps.props = {}
        mappedProps.requiredProps = []
        mappedProps.multivaluedProps = []
        mappedProps.blankNodeProps = []
        mappedProps.namedNodeProps = []
        var propertyShapes = this.nodeShape.properties // this is an array ob objects
        for (var p=0; p<propertyShapes.length; p++) {
            // Get the propert name
            var pShape = propertyShapes[p];
            var propertyName = toCURIE(pShape[SHACL.path.value], this.allPrefixes, "parts").property
            if (propertyName) { 
                mappedProps.props[propertyName] = pShape
            } else {
                console.log(`\nProp: ${propertyName}`)
                console.log('- propertyname not found, not mapping it; this is the shape:')
                console.log(pShape)
                continue;
            }
            // Is property required?
            if (this.propertyIsRequired(pShape)) {
                // console.log(`- this is a required property`)
                mappedProps.requiredProps.push(propertyName)
            }
            // Is property multivalued?
            if (this.propertyIsList(pShape)) {
                // console.log(`- this is a multivalued property`)
                mappedProps.multivaluedProps.push(propertyName)
            }
            // What is the nodeKind and type (from SHACL shape):
            // - just a string/number/...
            // - list of strings/numbers/...
            // - list of pids (named nodes)
            // - list of objects (blank nodes) => cannot be handled
            const [propertyIsBN, propertyIsIRI] = this.getNodeDeets(pShape)
            if (propertyIsBN) {mappedProps.blankNodeProps.push(propertyName)}
            if (propertyIsIRI) {mappedProps.namedNodeProps.push(propertyName)}
        }
        mappedProps.allProps = Object.keys(mappedProps.props);
        return mappedProps
    }

    propertyIsRequired(pShape) {
        // sh:minCount must be greater than zero
        return pShape[SHACL.minCount?.value] > 0 ? true : false
    }

    propertyIsList(pShape) {
        if (pShape.hasOwnProperty(SHACL.maxCount)) {
            if (pShape[SHACL.maxCount] == 1) {
                return false
            } else if (pShape[SHACL.maxCount] > 1) {
                return true
            } else {
                return false   
            }
        } else {
            return true
        }
    }

    getNodeDeets(pShape) {
        var isBlankNode = false
        var isIRI = false
        if ( pShape.hasOwnProperty(SHACL.nodeKind.value) ) {
            if (pShape[SHACL.nodeKind.value] == SHACL.IRI.value) {
                isIRI = true
            } else if (pShape[SHACL.nodeKind.value] == SHACL.BlankNode.value) {
                isBlankNode = true
            } else if (pShape[SHACL.nodeKind.value] == SHACL.BlankNodeOrIRI.value
                && pShape.hasOwnProperty(SHACL.class.value)) {
                var rangeNodeShape = this.shapesDS.data.nodeShapes[pShape[SHACL.class.value]]
                var foundIDpropshape = findObjectByKey(rangeNodeShape.properties, SHACL.path.value, this.ID_IRI)
                if (foundIDpropshape) {
                    isIRI = true
                } else {
                    isBlankNode = true
                }
            }
        }
        return [isBlankNode, isIRI]
    }

    saveTable(rdfDS, parentShapeIRI, parentPropertyIRI) {
        // Props have already been mapped
        // We first check if the ID_IRI, if expected to be provided, is in the list of columns
        var idPropertyName = toCURIE(this.ID_IRI, this.allPrefixes, "parts").property
        if (this.mappedProps.allProps.includes(idPropertyName) && !this.columns.includes(idPropertyName) ) {
            var msg = `ID_IRI property name '${idPropertyName}' is not included in the table columns, while it is expected. Cannot save data.`
            throw Error(msg)
        }
        // TODO: handle required properties in the same way? Do requiredProperties necessarily include ID_IRI too?
        // Now we check for column headings that can't be contained/processed in CSV
        // (isBlankNode, or is not in list of properties)
        // Warn that this column will be ignored
        for (var c of this.columns) {
            if (this.mappedProps.blankNodeProps.includes(c) ) {
                console.log(`Column '${c}' cannot be processed because it expects a blank node property, ignoring...`)
            }
            if (!this.mappedProps.allProps.includes(c) ) {
                console.log(`Column '${c}' cannot be processed because it is not in the list of possible properties, ignoring...`)
            }
        }
        // Now cycle through the rows and save data
        var tableData = this.table.getData()
        for (var row of tableData) {
            var nodeID
            if (this.columns.includes(idPropertyName)) {
                nodeID = row[idPropertyName]
            } else {
                nodeID = '_:' + crypto.randomUUID()// blanknode
            }
            // First process nodeID, i.e. subject (for both named node and blank node)
            this.formData.addSubject(this.class_iri, nodeID)
            // For each row cell, we need to add the relevant record(s) to formData
            for (var p of Object.keys(row)) {
                // ID_IRI column has already been processed, but the predicate should still be added... TODO inspect
                // if (p == idPropertyName) {continue;}
                // Ignore blanknode columns
                if (this.mappedProps.blankNodeProps.includes(p)) {continue;}
                // Ignore columns that aren't in the list of possible properties
                if (!this.mappedProps.allProps.includes(p)) {continue;}
                // If the value is empty, skip
                if (!row[p]) {continue;}
                // If the value exists
                // First get the predicate uri from the column name
                var predicate_uri = this.mappedProps.props[p][SHACL.path.value]
                // First check if this is a multivalued slot and then split it
                if (this.mappedProps.multivaluedProps.includes(p) && row[p].split(this.DELIMITER).length > 1) {
                    var p_parts = row[p].split(this.DELIMITER)
                    // Add a addPredicate for first element, addObject for rest
                    for (var i=0;i<p_parts.length;i++) {
                        if (i==0) {
                            this.formData.addPredicate(this.class_iri, nodeID, predicate_uri, [p_parts[i]])
                        } else {
                            // This pushes null into the content array, after which we still need to set the value
                            this.formData.addObject(this.class_iri, nodeID, predicate_uri);
                            this.formData.content[this.class_iri][nodeID][predicate_uri][i] = p_parts[i];
                        }
                    }
                } else {
                    this.formData.addPredicate(this.class_iri, nodeID, predicate_uri, [row[p]])
                }
            }
            var saved_node = this.formData.saveNode(
                this.class_iri,
                nodeID,
                this.shapesDS,
                rdfDS,
                false,
                reactiveCloneFunc
            )
            // Lastly, if uploading a table from nodeShapeEditor, the saved nodes
            // should be linked to the record via their ID (which could be named or blank nodes)
            if (this.record_iri) {
                // Get the iri of the property for which the InstancesSelectEditor was instantiated
                console.log("saved from instancesselecteditor, have to link new record to parent record")
                var pred_iri = parentPropertyIRI
                // If a predicate does not exist yet, use addPredicate else addObject
                if (Object.keys(this.formData.content[parentShapeIRI][this.record_iri]).indexOf(pred_iri) < 0) {
                    this.formData.addPredicate(parentShapeIRI, this.record_iri, pred_iri, [nodeID])
                } else {
                    console.log('content value before sdding object:')
                    console.log(toRaw(this.formData.content[parentShapeIRI][this.record_iri][pred_iri]))
                    // If the predicate exists, but it only has a single null value in the array, don't addObject and just set value
                    var predVal = toRaw(this.formData.content[parentShapeIRI][this.record_iri][pred_iri])

                    if (predVal.length == 1 && predVal[0] == null) {
                        console.log("not running addObject")
                        this.formData.content[parentShapeIRI][this.record_iri][pred_iri][0] = nodeID;
                    } else {
                        this.formData.addObject(parentShapeIRI, this.record_iri, pred_iri);
                        var l = this.formData.content[parentShapeIRI][this.record_iri][pred_iri].length
                        this.formData.content[parentShapeIRI][this.record_iri][pred_iri][l-1] = nodeID;
                    }
                    
                }
            }
        }
    }
}

