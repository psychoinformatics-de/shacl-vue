<template>
    <v-autocomplete
        label="(instances select editor)"
        v-model="graph[props.node_uid].properties[props.triple_uid].object"
        :items="['California', 'Colorado', 'Florida', 'Georgia', 'Texas', 'Wyoming']"
        validate-on="lazy input"
        :rules="rules"
    ></v-autocomplete>
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
    import { SHACL } from '../modules/namespaces'
    export const matchingLogic = (shape) => {
        // sh:nodeKind exists
        if ( shape.hasOwnProperty(SHACL.nodeKind.value) ) {
            // sh:nodeKind == sh:IRI ||
            // sh:nodeKind == sh:BlankNodeOrIRI ||
            return [SHACL.IRI.value, SHACL.BlankNodeOrIRI.value].includes(shape[SHACL.nodeKind.value])
        }
        return false
    };
</script>