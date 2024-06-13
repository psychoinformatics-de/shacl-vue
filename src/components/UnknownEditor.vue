<template>
    <em>...unknown editor...</em>
</template>

<script setup>
    import { ref, onMounted, computed } from 'vue'
    const props = defineProps({
        property_shape: Object,
    })
    var kaas = ref('')

</script>