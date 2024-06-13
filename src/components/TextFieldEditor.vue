<template>
    <v-text-field v-bind="props.object" density="compact" variant="outlined" label="(text field editor)"></v-text-field>
</template>

<script setup>
    import { ref, onMounted, computed } from 'vue'

    // ----- //
    // Props //
    // ----- //
    const props = defineProps({
        property_shape: Object,
        object: String,
    })
</script>