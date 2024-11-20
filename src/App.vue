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
              <v-tab :value="0"> <v-icon icon="mdi-home"></v-icon>&nbsp;&nbsp; Home</v-tab>
              <v-tab :value="1"> <v-icon icon="mdi-list-box-outline"></v-icon>&nbsp;&nbsp; Forms</v-tab>
              <v-tab :value="2"><v-icon icon="mdi-database"></v-icon>&nbsp;&nbsp;Data</v-tab>
              <!-- <v-tab :value="3"><v-icon icon="mdi-book-open"></v-icon>&nbsp;&nbsp;Viewer</v-tab> -->
              <!-- <v-tab :value="4"><v-icon icon="mdi-cog"></v-icon>&nbsp;&nbsp;Testing</v-tab> -->
            </v-tabs>
            <br>
            <v-tabs-window v-model="tab">
              <v-tabs-window-item :key="0" :value="0">
                <v-container fluid>
                  <div class="banner">

                    <div class="banner-column" style="text-align: left; margin-left: 8em;">
                        <h1 style="color: #3451B2">shacl-vue (alpha)</h1>
                        <h1>Automatic generation of user interfaces from SHACL</h1>
                        <br>
                        <div class="banner-buttons">
                          <v-btn rounded="xl" size="large" style="margin-right: 1em"><v-icon>mdi-chevron-down</v-icon>&nbsp;&nbsp;Learn</v-btn>

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
              </v-tabs-window-item>
              <v-tabs-window-item :key="1" :value="1"> <MainForm :ready="page_ready"/> </v-tabs-window-item>
              <v-tabs-window-item :key="2" :value="2"> <MainData/> </v-tabs-window-item>
              <!-- <v-tabs-window-item :key="3" :value="3"> <MainViewer/> </v-tabs-window-item> -->
              <!-- <v-tabs-window-item :key="4" :value="4"> <TestComp/> </v-tabs-window-item> -->
            </v-tabs-window>
          </v-card>
        </span>
      </v-main>
  </v-app>
</template>


<script setup>
  import { ref, provide, watch, reactive} from 'vue';
  import { useConfig } from '@/composables/configuration';
  const dataFetched = ref(false)
  var tab = ref(0)
  const { config, configFetched } = useConfig();
  provide('config', config)
  provide('configFetched', configFetched)

  import { useGraphData } from '@/composables/graphdata';
  import { useClassData } from '@/composables/classdata';
  import { useShapeData } from '@/composables/shapedata';
  import { useFormData } from '@/composables/formdata';
  import editorMatchers from '@/modules/editors';
  import defaultEditor from '@/components/UnknownEditor.vue';

  const { graphData, batchMode, getGraphData, graphPrefixes, serializedGraphData, graphTriples, serializeNodesToTSV, updateSerializedData, triggerReactivity} = useGraphData(config)
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
  const {
    formData,
    add_empty_node,
    remove_current_node,
    clear_current_node,
    add_empty_triple,
    remove_triple,
    save_node,
    quadsToFormData,
  } = useFormData()
  provide('formData', formData)
  const defaultPropertyGroup = {}
  defaultPropertyGroup.key = "https://concepts.datalad.org/DefaultPropertyGroup"
  defaultPropertyGroup.value = {
    "http://www.w3.org/2000/01/rdf-schema#comment": "",
    "http://www.w3.org/2000/01/rdf-schema#label": "Default Properties",
    "http://www.w3.org/ns/shacl#order": 100,
  }
  provide('batchMode', batchMode)
  provide('updateSerializedData', updateSerializedData)
  provide('triggerReactivity', triggerReactivity)
  provide('quadsToFormData', quadsToFormData)
  provide('defaultPropertyGroup', defaultPropertyGroup)
  provide('editorMatchers', editorMatchers)
  provide('defaultEditor', defaultEditor)
  provide('add_empty_triple', add_empty_triple)
  provide('add_empty_node', add_empty_node)
  provide('remove_triple', remove_triple)
  provide('remove_current_node', remove_current_node)
  provide('clear_current_node', clear_current_node)
  provide('save_node', save_node)
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
  const editMode = reactive({
    form: false,
    graph: false,
  })
  provide('editMode', editMode)

  watch(configFetched, async (newValue) => {
    // console.log("CHECK: configfetched")
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