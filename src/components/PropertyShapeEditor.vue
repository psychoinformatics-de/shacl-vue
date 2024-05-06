<template>
        <v-row align="start" no-gutters>
            <v-col cols="3">{{ nameOrCURIE }}:</v-col>
            <v-col cols="3"><component :is="matchedComponent.comp"></component></v-col>
            <v-col></v-col>
        </v-row>
</template>

<script setup>
    import { ref, onMounted, computed } from 'vue'
    import {SHACL, RDF, DASH} from '../plugins/namespaces'
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
        
        // From a SHACL context, the main indicator of the type of property is `sh:nodeKind`
        // See: https://www.w3.org/TR/shacl/#NodeKindConstraintComponent
        // sh:NodeKind: sh:BlankNode, sh:IRI, sh:Literal, sh:BlankNodeOrIRI, sh:BlankNodeOrLiteral and sh:IRIOrLiteral
        if ( props.property_shape.hasOwnProperty(SHACL.nodeKind.value) ) {
            if ( props.property_shape[SHACL.nodeKind.value] == SHACL.IRI.value ) {
                // todo: this should actually be an IRI selector, with the option to add anew object via
                // a detailseditor if the required IRI is not avaialable as part of the list to select from
                // ( based on linkml inline = false )
                return matchers[DASH.DetailsEditor.value]
            }
            if ( props.property_shape[SHACL.nodeKind.value] == SHACL.BlankNode.value ) {
                // this is an inplace editor, based on linkml inline object
                return matchers[DASH.DetailsEditor.value]
            }
        }

        if ( props.property_shape.hasOwnProperty(SHACL.datatype.value) ) {
            if ( props.property_shape[SHACL.datatype.value] == "http://www.w3.org/2001/XMLSchema#string" ) {
                console.log(matchers[DASH.TextFieldEditor.value])
                return matchers[DASH.TextFieldEditor.value]
            }
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