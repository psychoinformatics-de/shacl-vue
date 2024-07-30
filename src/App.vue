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
  import { ref, provide, onMounted} from 'vue';
  import { useGraphData } from '@/composables/graphdata';
  import { useClassData } from '@/composables/classdata';
  import { DLTHING, XSD } from '@/modules/namespaces';
  import rdf from 'rdf-ext';

  var tab = ref(1)

  const { graphData, getGraphData, graphPrefixes, serializedGraphData, graphTriples } = useGraphData()
  const { classData, getClassData, classPrefixes, serializedClassData, classTriples } = useClassData()

  provide('graphData', graphData)
  provide('serializedGraphData', serializedGraphData)
  provide('graphTriples', graphTriples)
  provide('graphPrefixes', graphPrefixes)
  provide('serializedClassData', serializedClassData)
  provide('classData', classData)



  onMounted( async () => {
    console.log("App.vue async onmounted...")
    const penguins = new URL("@/assets/distribution-penguins.ttl", import.meta.url).href
    await getGraphData(penguins)

    console.log(graphTriples.length)
    console.log(graphData.size)
    
    const mypersonB = rdf.grapoi({ dataset: graphData })
      .hasOut(DLTHING.meta_type, rdf.literal('dldist:Person', XSD.anyURI))
      .quads();
    console.log('Persons in Penguin Dataset, using literal in query:')
    for (const quad of mypersonB) {
      console.log(`\t${quad.subject.value}`)
    }

    const classes = new URL("@/assets/class_hierarchy.ttl", import.meta.url).href
    await getClassData(classes)
  })
  
</script>