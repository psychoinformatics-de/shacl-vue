<template>
    <v-text-field v-model="graph[props.node_uid].properties[props.triple_uid].object" density="compact" variant="outlined" label="(text field editor)"></v-text-field>
</template>

<script setup>
    import {inject} from 'vue'
    const props = defineProps({
        property_shape: Object,
        node_uid: String,
        triple_uid: String
    })
    const graph = inject('graph');
</script>