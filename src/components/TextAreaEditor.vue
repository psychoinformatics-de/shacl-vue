<template>
    <v-textarea
        v-model="triple_object"
        variant="outlined"
        label="add text">
    </v-textarea>
</template>

<script setup>
    import {inject, computed} from 'vue'
    const props = defineProps({
        property_shape: Object,
        node_uid: String,
        triple_uid: String
    })
    const formData = inject('formData');

    const triple_object = computed({
        get() {
            return formData[props.node_uid].at(-1)[props.triple_uid].at(-1);
        },
        set(value) {
            const node_idx = formData[props.node_uid].length - 1
            const triple_idx = formData[props.node_uid][node_idx][props.triple_uid].length - 1
            formData[props.node_uid][node_idx][props.triple_uid][triple_idx] = value;
        }
    });
</script>

<script>
    import { SHACL, DASH, XSD } from '../modules/namespaces'
    export const matchingLogic = (shape) => {
        // sh:nodeKind exists
        if ( shape.hasOwnProperty(SHACL.nodeKind.value) ) {
            // sh:nodeKind == sh:Literal
            if ( shape[SHACL.nodeKind.value] == SHACL.Literal.value ) {
                // sh:datatype exists
                if ( shape.hasOwnProperty(SHACL.datatype.value) ) {
                    // sh:datatype == xsd:string
                    if ( shape[SHACL.datatype.value] == XSD.string.value) {
                        // text area
                        return shape.hasOwnProperty(SHACL.datatype.value) && shape[DASH.singleLine.value] == "false"
                    }
                }
            }
        }
        return false
    };
</script>