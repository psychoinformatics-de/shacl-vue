<template>
  <v-app>
      <AppHeader />
      <v-main>
        <v-card height="100%">
          <v-tabs
            v-model="tab"
            align-tabs="left"
            color="deep-purple-accent-4"
          >
            <v-tab :value="1"> <v-icon icon="mdi-list-box-outline"></v-icon>&nbsp;&nbsp; Editor</v-tab>
            <v-tab :value="2"><v-icon icon="mdi-database"></v-icon>&nbsp;&nbsp;Data</v-tab>
            <v-tab :value="3"><v-icon icon="mdi-book-open"></v-icon>&nbsp;&nbsp;Viewer</v-tab>
          </v-tabs>
          
          <br>


          <v-tabs-window v-model="tab">
            <v-tabs-window-item :key="1" :value="1"> <MainForm/> </v-tabs-window-item>
            <v-tabs-window-item :key="2" :value="2"> <MainData/> </v-tabs-window-item>
            <v-tabs-window-item :key="3" :value="3"> <MainViewer/> </v-tabs-window-item>
          </v-tabs-window>
        </v-card>
      </v-main>
  </v-app>
</template>


<script setup>
  import { ref } from 'vue'
  var tab = ref(1)
  
</script>