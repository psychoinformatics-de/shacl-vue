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
              v-model="upload_url"
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
              validate-on="input"
            >
            </v-text-field>
          </v-form>
        </v-col>
      </v-row>
      <v-row align="start" no-gutters>
        <v-btn text="Load data" @click="getGraphData(public_url)"></v-btn>
      </v-row>

      

    </v-sheet>
    <br>
    <h3>Data Graph</h3>
    
    <v-sheet class="pa-4" border rounded elevation="2">
      <suspense>
        <pre class="formatted-pre">
          <code class="formatted-code">{{ serializedGraphData }}</code>
        </pre>
      </suspense>
    </v-sheet>

    <br>

    <v-sheet class="pa-4" border rounded elevation="2">
      <Suspense>
        <pre class="formatted-pre">
          <code class="formatted-code">
            <span v-for="trip in graphTriples">
              {{ trip }}
            </span>
          </code>
        </pre>
      </Suspense>
    </v-sheet>


  </v-container>
</template>


<script setup>
  import { ref, computed, onMounted, inject } from 'vue'
  const graphData = inject('graphData');
  const serializedGraphData = inject('serializedGraphData');
  const graphTriples = inject('graphTriples');
  const public_url = ref('')
  const upload_url = ref(null)


</script>