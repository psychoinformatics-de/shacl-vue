<template>
    <v-switch label="No/Yes" v-bind="kaas" inset></v-switch>
    <span>{{ kaas }}</span>
</template>

<script setup>
    import { ref, onMounted, computed } from 'vue'
    var kaas = ref('')

    const props = defineProps({
        property_shape: Object,
    })

</script>