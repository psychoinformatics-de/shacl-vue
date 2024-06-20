<template>
  <v-container fluid>
    <h3>Add data</h3>
    <v-sheet class="pa-4" border rounded elevation="2">
      <v-row align="start" no-gutters>
        <v-col>
          <v-form @submit.prevent>
            <v-file-input
              density="compact"
              variant="outlined"
              accept="*.ttl"
              label="Upload a ttl file"
              chips
              validate-on="input"
            ></v-file-input>
          </v-form>

        </v-col>
        <v-col cols="1" style="text-align: center;">...or...</v-col>
        <v-col>
          <v-form @submit.prevent>
            <v-text-field
              v-model="public_url"
              density="compact"
              variant="outlined"
              type="url"
              label="Paste a public URL"
              validate-on="lazy input"
            >
            </v-text-field>
          </v-form>
        </v-col>
      </v-row>

      

    </v-sheet>
    <br>
    <h3>Data Graph</h3>
    <v-sheet class="pa-4" border rounded elevation="2">
      <code>

      </code>
    </v-sheet>
  </v-container>
</template>


<script setup>
  import { ref, onMounted, onBeforeMount, provide } from 'vue'

  const public_url = ref('')
  
</script>