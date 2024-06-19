<template>
    <v-text-field
        v-model="graph[props.node_uid].properties[props.triple_uid].object"
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
    import {inject, ref} from 'vue'
    import { useRules } from '../composables/rules'

    const props = defineProps({
        property_shape: Object,
        node_uid: String,
        triple_uid: String,
    })
    const graph = inject('graph');
    const { isRequired, rules } = useRules(props.property_shape)    
</script>