<template>
    <v-autocomplete
        label="(instances select editor)"
        :items="['California', 'Colorado', 'Florida', 'Georgia', 'Texas', 'Wyoming']"
    ></v-autocomplete>
</template>

<script setup>
    import { ref, onMounted, computed } from 'vue'
    const props = defineProps({
        property_shape: Object,
    })
    var kaas = ref('')

</script>