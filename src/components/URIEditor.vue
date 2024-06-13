<template>
    <v-text-field v-bind="kaas" density="compact" variant="outlined" label="(URI editor)"></v-text-field>
</template>

<script setup>
    import { ref, onMounted, computed } from 'vue'
    const props = defineProps({
        property_shape: Object,
    })
    var kaas = ref('')
</script>