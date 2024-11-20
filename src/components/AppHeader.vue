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

    <v-app-bar-title> 
      <code style="font-size: 1em;">shacl-vue</code>
    </v-app-bar-title>

    <template v-slot:append>
      <v-btn 
        icon="mdi-text-box"
        href="https://psychoinformatics-de.github.io/shacl-vue/docs/"
        target="_blank"
      ></v-btn>
      <v-btn 
        icon="mdi-github"
        href="https://github.com/psychoinformatics-de/shacl-vue"
        target="_blank"
      ></v-btn>
    </template>
  </v-app-bar>
</template>
