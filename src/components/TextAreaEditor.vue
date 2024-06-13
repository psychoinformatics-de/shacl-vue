<template>
    <v-textarea v-bind="kaas" variant="outlined" label="(text area editor)"></v-textarea>
</template>

<script setup>
    import { ref, onMounted, computed } from 'vue'
    const props = defineProps({
        property_shape: Object,
    })
    var kaas = ref('')

</script>