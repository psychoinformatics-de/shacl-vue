<template>
    <v-text-field v-model="graph[props.comp_uid].object" density="compact" variant="outlined" label="(URI editor)"></v-text-field>
</template>

<script setup>
    import { ref, inject, watch} from 'vue'
    const props = defineProps({
        property_shape: Object,
        comp_uid: String
    })
    const graph = inject('graph');
</script>