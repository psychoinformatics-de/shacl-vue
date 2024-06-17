<template>
    <v-switch label="No/Yes" v-model="graph[props.node_uid].properties[props.triple_uid].object" inset></v-switch>
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