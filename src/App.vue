<template>
    <v-app>
        <ShaclVue :configUrl="confURL"></ShaclVue>
    </v-app>
</template>

<script setup>
const confURL = 'config.json';
</script>
