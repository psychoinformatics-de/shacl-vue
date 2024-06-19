<template>
    <v-switch
        label="No/Yes"
        v-model="graph[props.node_uid].properties[props.triple_uid].object"
        inset
        validate-on="lazy input"
        :rules="rules"
    >
    </v-switch>
</template>

<script setup>
    import { inject } from 'vue'
    import { useRules } from '../composables/rules'

    const props = defineProps({
        property_shape: Object,
        node_uid: String,
        triple_uid: String,
    })
    const graph = inject('graph');
    const { rules } = useRules(props.property_shape)
</script>

<script>
    import { SHACL, XSD } from '../modules/namespaces'
    export const matchingLogic = (shape) => {
        // sh:nodeKind exists
        if ( shape.hasOwnProperty(SHACL.nodeKind.value) ) {
            // sh:nodeKind == sh:Literal
            if ( shape[SHACL.nodeKind.value] == SHACL.Literal.value ) {
                // sh:datatype exists
                if ( shape.hasOwnProperty(SHACL.datatype.value) ) {
                    // sh:datatype == xsd:boolean
                    return shape[SHACL.datatype.value] == XSD.boolean.value
                }
            }
        }
        return false
    };
</script>