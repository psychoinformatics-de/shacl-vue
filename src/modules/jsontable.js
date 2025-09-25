/*

Javascript implementation of helpers for the FlatSON specification

A Field name encoding specification for bidirectional conversion of
nested JSON to a table representation. See also:
https://hub.psychoinformatics.de/datalink/flatson
*/

export class Table {

    constructor(props) {
        this.PLACEHOLDER = undefined
        // starting off by supporting column headers and row input arguments
        // TODO: support file input (CSV / TSV)
        this.columns = props.columns
        this.rows = props.rows
        this.delimiter = props.delimiter ? props.delimiter : '$'
        // TODO: validation
        // - number of columns = 1
        // - minimum number of rows = 1
        // - number of elements in rows should be same as number of columns
        // - multiple columns with same name not allowed

        this.columnsProcessed = {}
        // Process columns
        this.processColumns()
        console.log(this.columnsProcessed)
    }

    processColumns() {
        for (var c=0; c<this.columns.length; c++) {
            var col = this.columns[c]
            this.columnsProcessed[col] = this._processColumn(col)
        }
    }

    _processColumn(col) {

        // First, some standards/defaults:
        // Delimiter should be escaped in case it is a special regex character
        const escapedDelim = this.delimiter.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
        const charClassSafeDelim = escapedDelim.replace(/^\\/, '');
        // Regex pattern for valid nested content, at least one of:
        // - single delimiter followed by digit(s)
        // - double delimiter followed by text (which excludes delimiter)
        const nestedPattern = new RegExp(
            `(${escapedDelim}\\d+)|(${escapedDelim}{2}(?!${escapedDelim})[^${escapedDelim}\\s]+)`,
            'g'
        );
        // Regex pattern for splitting nested content:
        // - recognize delimiter ocurring once
        // - recognize delimiter ocurring twice in succession
        // - retain delimiters and parts after them
        const delimiterRegex = new RegExp(`(${escapedDelim}{1,2})`);
        // Output object
        var colObj = {
            colType: "", // literal | nested
            colString: "", // the part of the column name without starting/ending delimiter
        }
        // Check if nested or literal (original check with unparsed data)
        // Some columns that are interpreted as nested here might later be
        // reclassified as literal once more information is available.
        // For example, if we have $top$1$ but there is no $top$0$, then the former
        // should become a literal even though classified as nested at first
        if (
            // Starts and ends with delimiter
            col.startsWith(this.delimiter)
            && col.endsWith(this.delimiter)
            // Length is longer than two delimiters
            && col.length > 2
            // Inner string (excluding start/end delimiters) has valid nested content
            && nestedPattern.test(col.slice(1, -1))
        ) {
            colObj.colType = 'nested'
            colObj.colString = col.slice(1, -1);
        } else {
            colObj.colType = 'literal'
            colObj.colString = col
            return colObj
        }

        // Nested column headings are parsed further
        colObj.parts =  []; // any string (field name) or integer (array index)
        colObj.delimiters = []; // the delimiter preceding the associated part (at the same index)
        colObj.valid = []; // is the part valid based on the delimiter? TODO: this is not used purposefully yet

        // Now apply regex to get parts, i.e. delimiters and the characters following them
        const parsedParts = colObj.colString.split(delimiterRegex).filter(p => p !== '');
        // add internal "delimiter" preceding the first part
        parsedParts.unshift("_start")
        // Divide into delimiters and parts
        var part, valid
        for (var p=0; p<parsedParts.length/2; p++) {
            colObj.delimiters.push(parsedParts[2*p])
            // if single -> array index
            // if double -> object key
            part = parsedParts[2*p+1]
            if (parsedParts[2*p] === this.delimiter ) {
                valid = /^\d+$/.test(part)
                if (valid) part = parseInt(part)
            } else if (parsedParts[2*p] === this.delimiter + this.delimiter) {
                valid = new RegExp(`^[^\\s${charClassSafeDelim}]+$`).test(part);
            } else {
                valid = 'na'
            }
            colObj.parts.push(part)
            colObj.valid.push(valid)
        }
        return colObj
    }
    
    toJSON() {
        const result = []
        for (var r of this.rows) {
            var rowObj = {}
            console.log(`Current row: ${r}`)
            for (var c of Object.keys(this.columnsProcessed)) {
                var cVal = this.columnsProcessed[c]
                console.log(`Current column: ${c}`)
                if (cVal.colType == 'literal') {
                    rowObj[cVal.colString] = r[c] // TODO: here assumes incoming rows are structured objects; if they are arrays, we should use integer indexing
                    continue;
                }
                // First part will always be a field name (not array element);
                // it might already exist from a previous column being toJSON-processed
                if (!rowObj.hasOwnProperty(cVal.parts[0])) {
                    // set to "_unflatsoned" as a placeholder for it to be processed
                    // because we don't know yet if it should be an array or object
                    rowObj[cVal.parts[0]] = this.PLACEHOLDER
                }

                // start at second delimiter/part
                for (var p=1; p<cVal.parts.length; p++) {
                    var part = cVal.parts[p];
                    var delim = cVal.delimiters[p];
                    // If: array index
                    if (delim === this.delimiter) {
                        // should be an array, which could already exist
                        // also, current part could be any integer, not necessarily the following one in the sequence,
                        // meaning that we should fill up the empty indices unless they're already populated
                        if (this._getValue(rowObj, p-1, cVal.parts) === this.PLACEHOLDER) {
                            this._setValue(rowObj, p-1, cVal.parts, [])
                        }
                        this._fillArray(rowObj, p-1, cVal.parts, part, this.PLACEHOLDER)
                    }
                    // If: object key
                    else {
                        if (this._getValue(rowObj, p-1, cVal.parts) === this.PLACEHOLDER) {
                            this._setValue(rowObj, p-1, cVal.parts, {})
                        }
                        if (!this._getValue(rowObj, p-1, cVal.parts).hasOwnProperty(part)) {
                            this._setValue(rowObj, p, cVal.parts, this.PLACEHOLDER)
                        }
                    }
                    // last part reached, assign value
                    if (p == cVal.parts.length-1) {
                        this._setValue(rowObj, p, cVal.parts, r[c])
                    }
                }
            }
            result.push(rowObj)
        }
        return result
    }

    _fillArray(obj, partsIdx, parts, part, placeholder) {
        // first get the correct position in the object hierarchy
        for (var i=0; i<partsIdx; i++) {
            obj = obj[parts[i]]
        }
        // arr is now at: obj[parts[partsIdx]]
        for (var i=0; i<part; i++) {
            // if i is not an index in arr, push the placeholder
            if (i >= obj[parts[partsIdx]].length) {
                obj[parts[partsIdx]].push(placeholder)
            }
        }
        
    }

    _setValue(obj, idx, key_arr, val) {
        for (var i=0; i<idx; i++) {
            obj = obj[key_arr[i]]
        }
        obj[key_arr[idx]] = val
    }

    _getValue(obj, idx, key_arr) {
        for (var i=0; i<=idx; i++) {
            obj = obj[key_arr[i]]
        }
        return obj
    }

}



// function required(argumentName = false) {
//     throw new Error(`Missing required argument${argumentName ? ` (${argumentName})` : ''}.`)
// }

export function table2json(props) {
    props.columns
    props.rows
    props.delimiter

}

export function json2table() {
    
}