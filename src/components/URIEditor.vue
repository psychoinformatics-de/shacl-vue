<template>
    <v-text-field
        v-model="formData[props.node_uid][props.triple_uid]"
        density="compact"
        variant="outlined"
        type="url"
        label="(URI editor)"
        validate-on="lazy input"
        :rules="rules"
    >
    </v-text-field>
</template>

<script setup>
    import { inject } from 'vue'
    import { useRules } from '../composables/rules'

    const props = defineProps({
        property_shape: Object,
        node_uid: String,
        triple_uid: String,
    })
    const formData = inject('formData');
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
                    // sh:datatype == xsd:anyURI
                    return shape[SHACL.datatype.value] == XSD.anyURI.value
                }
            }
        }
        return false
    };
</script>