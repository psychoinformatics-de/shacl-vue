<template>
  <v-app>
      <AppHeader />
      <v-main>
        <span v-if="dataFetched">
          <v-card height="100%">
            <v-tabs
              v-model="tab"
              align-tabs="left"
              color="deep-purple-accent-4"
            >
              <v-tab :value="1"> <v-icon icon="mdi-list-box-outline"></v-icon>&nbsp;&nbsp; Editor</v-tab>
              <v-tab :value="2"><v-icon icon="mdi-database"></v-icon>&nbsp;&nbsp;Data</v-tab>
              <v-tab :value="3"><v-icon icon="mdi-book-open"></v-icon>&nbsp;&nbsp;Viewer</v-tab>
              <v-tab :value="4"><v-icon icon="mdi-cog"></v-icon>&nbsp;&nbsp;Testing</v-tab>
            </v-tabs>
            <br>
            <v-tabs-window v-model="tab">
              <v-tabs-window-item :key="1" :value="1"> <MainForm :ready="page_ready"/> </v-tabs-window-item>
              <v-tabs-window-item :key="2" :value="2"> <MainData/> </v-tabs-window-item>
              <v-tabs-window-item :key="3" :value="3"> <MainViewer/> </v-tabs-window-item>
              <v-tabs-window-item :key="4" :value="4"> <TestComp/> </v-tabs-window-item>
            </v-tabs-window>
          </v-card>

          <v-sheet class="pa-4" border rounded elevation="2">
            <suspense>
              <pre class="formatted-pre">
                <code class="formatted-code">{{ serializedData }}</code>
              </pre>
            </suspense>
          </v-sheet>
        </span>

      </v-main>
  </v-app>
</template>


<script setup>
  import { ref, provide, watch} from 'vue';
  import { useConfig } from '@/composables/configuration';
  const dataFetched = ref(false)
  var tab = ref(1)
  const { config, configFetched } = useConfig();
  provide('config', config)
  provide('configFetched', configFetched)

  import { useGraphData } from '@/composables/graphdata';
  import { useClassData } from '@/composables/classdata';
  import { useShapeData } from '@/composables/shapedata';

  const { graphData, getGraphData, graphPrefixes, serializedGraphData, graphTriples, serializeNodesToTSV } = useGraphData(config)
  const { classData, getClassData, classPrefixes, serializedClassData, classTriples } = useClassData(config)
  const {
        shapesDataset,
        nodeShapes,
        propertyGroups,
        nodeShapeNamesArray,
        shapePrefixes,
        prefixArray,
        prefixes_ready,
        nodeShapeIRIs,
        nodeShapeNames,
        page_ready,
        getSHACLschema,
        serializedData,
      } = useShapeData(config)

  provide('graphData', graphData)
  provide('getGraphData', getGraphData)
  provide('serializedGraphData', serializedGraphData)
  provide('graphTriples', graphTriples)
  provide('graphPrefixes', graphPrefixes)
  provide('serializeNodesToTSV', serializeNodesToTSV)
  provide('serializedClassData', serializedClassData)
  provide('classData', classData)
  provide('classPrefixes', classPrefixes)
  provide('shapesDataset', shapesDataset)
  provide('nodeShapes', nodeShapes)
  provide('propertyGroups', propertyGroups)
  provide('nodeShapeNamesArray', nodeShapeNamesArray)
  provide('shapePrefixes', shapePrefixes)
  provide('prefixArray', prefixArray)
  provide('prefixes_ready', prefixes_ready)
  provide('nodeShapeIRIs', nodeShapeIRIs)
  provide('nodeShapeNames', nodeShapeNames)
  provide('page_ready', page_ready)

  watch(configFetched, async (newValue) => {
    console.log("CHECK: configfetched")
    if (newValue) {
      // const { graphData, getGraphData, graphPrefixes, serializedGraphData, graphTriples } = useGraphData(config)
      // const { classData, getClassData, classPrefixes, serializedClassData, classTriples } = useClassData(config)
      await getGraphData()
      await getClassData()
      await getSHACLschema()
      dataFetched.value = true
      
    }
    }, { immediate: true }
  );

</script>