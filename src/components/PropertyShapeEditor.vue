<template>
    <v-row align="start" no-gutters>
        <v-col cols="3">
            <span>{{ nameOrCURIE }}<span v-if="isRequired" style="color: red;">*</span>:
                <v-tooltip activator="parent" location="right" max-width="400px" max-height="400px">
                    {{ props.property_shape[SHACL.description.value] }}
                </v-tooltip>
            </span>
        </v-col>
        <v-col cols="6">
            <span v-if="isTripleAdded">
                <keep-alive>
                    <component
                        :is="matchedComponent.comp"
                        :property_shape="property_shape"
                        :node_uid="props.node_uid"
                        :triple_uid="my_uid"
                        >
                    </component>
                </keep-alive>
            </span>
        </v-col>
        <v-col></v-col>
    </v-row>
</template>

<script setup>
    import { ref, onMounted, onBeforeMount, computed, inject, onBeforeUpdate} from 'vue'
    import {SHACL, RDF, DASH, XSD, DLDIST} from '../modules/namespaces'
    import { matchers } from '../modules/globals'
    import { useRules } from '../composables/rules'
    import { toCURIE } from '../modules/utils';
    
    // ----- //
    // Props //
    // ----- //
    
    const props = defineProps({
        property_shape: Object,
        node_uid: String,
    })

    // ---- //
    // Data //
    // ---- //
    const my_uid = ref('');
    const add_triple = inject('add_triple');
    const prefixes = inject('prefixes');
    const isTripleAdded = ref(false);
    const { isRequired, rules } = useRules(props.property_shape)


    // ----------------- //
    // Lifecycle methods //
    // ----------------- //

    onMounted(() => {
    })

    onBeforeMount(() => {
        console.log("PropertyShapeEditor is about to mounted")
        my_uid.value = props.node_uid + '--' + props.property_shape[SHACL.path.value]
        add_triple(props.node_uid, my_uid.value)
        isTripleAdded.value = true;
    })

    onBeforeUpdate(() => {
        console.log(`PropertyShapeEditor is about to be updated: ${my_uid.value}`)
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
                    // dlco:EmailAddress
                    if ( props.property_shape[SHACL.datatype.value] == DLDIST.EmailAddress.value) {
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
            return toCURIE(props.property_shape[SHACL.path.value], prefixes)   
        }
    });

    // --------- //
    // Functions //
    // --------- //


</script>