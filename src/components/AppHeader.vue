<template>
  <v-app-bar :elevation="1" rounded>
    <template v-slot:prepend>
      <v-img
        :width="36"
        cover
        src="../assets/shacl_vue.svg"
        style="margin-left: 10px;"
      ></v-img>
    </template>

    <v-app-bar-title>SHACL-Vue: Automatic generation of editors/viewers from SHACL</v-app-bar-title>

    <template v-slot:append>
      <v-btn 
        icon="mdi-github"
        href="https://github.com/psychoinformatics-de/shacl-vue"
        target="_blank"
      ></v-btn>
    </template>
  </v-app-bar>
</template>

<script setup>
  //
</script>