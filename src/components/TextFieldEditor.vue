<template>
    <v-text-field
        v-model="triple_object"
        density="compact"
        variant="outlined"
        type="url"
        label="(text field editor)"
        validate-on="lazy input"
        :rules="rules"
    >
    </v-text-field>
</template>

<script setup>
    import { inject, computed} from 'vue'
    import { useRules } from '../composables/rules'

    const props = defineProps({
        property_shape: Object,
        node_uid: String,
        triple_uid: String
    })
    const formData = inject('formData');
    const { rules } = useRules(props.property_shape)

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
    import { SHACL, DASH, XSD, DLDIST} from '../modules/namespaces'
    export const matchingLogic = (shape) => {
        // sh:nodeKind exists
        if ( shape.hasOwnProperty(SHACL.nodeKind.value) ) {
            // sh:nodeKind == sh:Literal
            if ( shape[SHACL.nodeKind.value] == SHACL.Literal.value ) {
                // sh:datatype exists
                if ( shape.hasOwnProperty(SHACL.datatype.value) ) {
                    // sh:datatype == xsd:string
                    if ( shape[SHACL.datatype.value] == XSD.string.value) {
                        // text field or text area
                        if (shape.hasOwnProperty(SHACL.datatype.value) && shape[DASH.singleLine.value] == "false") {
                            return false
                        } else {
                            return true
                        }   
                    }
                    // sh:datatype == xsd:nonNegativeInteger ||
                    // sh:datatype == dlco:EmailAddress
                    return shape[SHACL.datatype.value] == XSD.nonNegativeInteger.value ||
                            shape[SHACL.datatype.value] == DLDIST.EmailAddress.value
                }
            }
        }
        return false
    };
</script>
