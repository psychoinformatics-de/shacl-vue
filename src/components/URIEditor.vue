<template>
    <v-text-field
        v-model="triple_object"
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
    import { inject, computed, reactive} from 'vue'
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
            console.log("Inside triple_object computed getter")
            // Have to account for the immediate switch when a form is saved
            // the getter will run on a 
            try {
                const node_idx = formData[props.node_uid].length - 1
                const triple_idx = formData[props.node_uid][node_idx][props.triple_uid].length - 1
                return formData[props.node_uid].at(-1)[props.triple_uid].at(-1);
            } catch (error) {
                return null
            }
        },
        set(value) {
            const node_idx = formData[props.node_uid].length - 1
            if (Object.keys(formData[props.node_uid][node_idx]).indexOf(props.triple_uid) < 0) {
                formData[props.node_uid][node_idx][props.triple_uid] = reactive([null])
            }
            const triple_idx = formData[props.node_uid][node_idx][props.triple_uid].length - 1
            formData[props.node_uid][node_idx][props.triple_uid][triple_idx] = value;
        }
    })
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