<template>
    <v-text-field v-bind="kaas" density="compact"></v-text-field>
</template>

<script setup>
    import { ref, onMounted, computed } from 'vue'
    var kaas = ref('')
</script>