<template>
    <v-autocomplete
        label="(instances select editor)"
        v-model="graph[props.node_uid].properties[props.triple_uid].object"
        :items="['California', 'Colorado', 'Florida', 'Georgia', 'Texas', 'Wyoming']"
    ></v-autocomplete>
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