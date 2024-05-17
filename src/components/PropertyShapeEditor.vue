<template>
        <v-row align="start" no-gutters>
            <v-col cols="3">
                <span>{{ nameOrCURIE }}:
                    <v-tooltip activator="parent" location="right" max-width="400px" max-height="400px">
                        {{ props.property_shape[SHACL.name.value] }}: {{ props.property_shape[SHACL.description.value] }}
                    </v-tooltip>
                </span>
            </v-col>
            <v-col cols="6"><component :is="matchedComponent.comp"></component></v-col>
            <v-col></v-col>
        </v-row>
</template>

<script setup>
    import { ref, onMounted, computed } from 'vue'
    import {SHACL, RDF, DASH, XSD} from '../plugins/namespaces'
    import { matchers } from '../plugins/globals'
    
    
    // ----- //
    // Props //
    // ----- //
    
    const props = defineProps({
        property_shape: Object,
        prefixes: Object,
    })

    // ------------------- //
    // Computed properties //
    // ------------------- //

    const matchedComponent = computed(() => {

        // TODO: work on a matching procedure that can potentially match multiple
        // scenarios, and pushes matched rules to an array, then order the array
        // based on prescpecified priorities of individual rules, then selects
        // highest priority rule, i.e. selects highest priority matched renderer.
        // This procedure should be implemented in it's own module and imported
        // where necessary, because e.g. a DetailsEditor component might need to
        // recursively use base editors (e.g. TextFieldEditor)
        
        // From a SHACL context, the main indicators of the type of property are `sh:nodeKind` and `sh:dataType`
        // but these have a 
        // See: https://www.w3.org/TR/shacl/#NodeKindConstraintComponent
        // sh:NodeKind: sh:BlankNode, sh:IRI, sh:Literal, sh:BlankNodeOrIRI, sh:BlankNodeOrLiteral and sh:IRIOrLiteral
        
        if ( props.property_shape.hasOwnProperty(SHACL.nodeKind.value) ) {
            // sh:nodeKind == sh:Literal
            if ( props.property_shape[SHACL.nodeKind.value] == SHACL.Literal.value ) {
                // sh:datatype
                if ( props.property_shape.hasOwnProperty(SHACL.datatype.value) ) {
                    // xsd:string
                    if ( props.property_shape[SHACL.datatype.value] == XSD.string.value) {
                        // text field or text area
                        if (props.property_shape[DASH.singleLine.value] == "false") {
                            return matchers[DASH.TextAreaEditor.value]
                        } else {
                            return matchers[DASH.TextFieldEditor.value]
                        }   
                    }
                    // xsd:boolean
                    if ( props.property_shape[SHACL.datatype.value] == XSD.boolean.value) {
                        return matchers[DASH.BooleanSelectEditor.value]
                    }
                    // xsd:date
                    if ( props.property_shape[SHACL.datatype.value] == XSD.date.value) {
                        return matchers[DASH.DatePickerEditor.value]
                    }
                    // xsd:dateTime
                    if ( props.property_shape[SHACL.datatype.value] == XSD.dateTime.value) {
                        return matchers[DASH.DateTimePickerEditor.value]
                    }
                    // https://www.w3.org/TR/NOTE-datetime
                    if ( props.property_shape[SHACL.datatype.value] == "https://www.w3.org/TR/NOTE-datetime") {
                        return matchers[DASH.DateTimePickerEditor.value]
                    }
                    // xsd:anyURI
                    if ( props.property_shape[SHACL.datatype.value] == XSD.anyURI.value) {
                        return matchers[DASH.URIEditor.value]
                    }
                    // xsd:nonNegativeInteger
                    if ( props.property_shape[SHACL.datatype.value] == XSD.nonNegativeInteger.value) {
                        return matchers[DASH.TextFieldEditor.value]
                    }

                }
                
            }
            // sh:nodeKind == sh:IRI OR sh:nodeKind == sh:BlankNodeOrIRI)
            if ( [SHACL.IRI.value, SHACL.BlankNodeOrIRI.value].includes(props.property_shape[SHACL.nodeKind.value]) ) {
                // todo: this should actually be an IRI selector, with the option to add anew object via
                // a detailseditor if the required IRI is not avaialable as part of the list to select from
                // ( based on linkml inline = false )
                return matchers[DASH.InstancesSelectEditor.value]
            }

        } else {
            console.error("No 'sh:nodeKind' in property shape:")
            console.error(props.property_shape)
        }

        return matchers["UnknownEditor"]
    })

    const nameOrCURIE = computed(() => {
        if (props.property_shape.hasOwnProperty(SHACL.name.value)) {
            return props.property_shape[SHACL.name.value]
        } else {
            return toCURIE(props.property_shape[SHACL.path.value])   
        }
    });

    // --------- //
    // Functions //
    // --------- //

    function toCURIE(IRI) {
        
        for (const [curie, iri] of Object.entries(props.prefixes)) {
          if (IRI.indexOf(iri) >= 0) {
            var parts = IRI.split('/')
            return curie + ':' + parts[parts.length - 1]
          }
        }
    }

</script>