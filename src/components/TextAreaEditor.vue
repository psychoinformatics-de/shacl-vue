<template>
    <v-textarea v-bind="props.object" variant="outlined" label="(text area editor)"></v-textarea>
</template>

<script setup>
    import { ref, onMounted, computed } from 'vue'
    const props = defineProps({
        property_shape: Object,
        object: String,
    })

</script>