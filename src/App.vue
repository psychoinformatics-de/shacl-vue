<template>
  <v-app>
      <AppHeader />
      <v-main>
          <v-container fluid v-if="!explore">
              <div class="banner">
                  <div class="banner-column" style="text-align: left; margin-left: 8em;">
                      <h1 style="color: #3451B2">shacl-vue (alpha)</h1>
                      <h1>Automatic generation of user interfaces from SHACL</h1>
                      <br>
                      <div class="banner-buttons">
                      <v-btn
                          rounded="xl" size="large" style="margin-right: 1em"
                          @click="startExploring()"
                      >🚀 Explore</v-btn>
                      <v-btn
                          rounded="xl" size="large" style="margin-right: 1em"
                          href="https://psychoinformatics-de.github.io/shacl-vue/docs/"
                          target="_blank"
                      ><v-icon>mdi-text-box</v-icon>&nbsp;&nbsp;Docs</v-btn>
                      <v-btn
                          rounded="xl" size="large"
                          href="https://github.com/psychoinformatics-de/shacl-vue"
                          target="_blank"
                      ><v-icon>mdi-github</v-icon>&nbsp;&nbsp;Code</v-btn>
                      </div>
                  </div>
                  <div class="banner-column" style="margin-right: 6em;">
                      <v-img
                      class="mx-auto"
                      width="40%"
                      src="./assets/shacl_vue.svg"
                      ></v-img>
                  </div>
              </div> 
          </v-container>
          <v-container fluid v-if="explore">
              <ShaclVue :configUrl="null"></ShaclVue>
          </v-container>
      </v-main>
  </v-app>
</template>


<script setup>
  import { ref } from 'vue'
  const explore = ref(true)
  function startExploring() {
      explore.value = true;
  }

</script>

<style scoped>
  .banner {
      display: flex;
      flex-direction: row;
      width: 100%;
      margin: auto;
  }
  .banner-column {
      display: flex;
      flex-direction: column;
      flex: 1;
      margin: 4em;
      color: #34495e;
  }
  .banner-column h1 {
      font-size: 2.5em;
  }
  .banner-buttons {
      display: flex;
      flex-direction: row;
      width: 100%;
      margin: auto;
      margin-top: 1em;
  }
</style>