<template>
  <v-app>
      <AppHeader />
      <v-main v-show="page_ready">
        <v-container fluid>
          <v-row align="start" no-gutters>
            <!-- <v-col cols="1"><v-sheet class="pa-2 ma-2"></v-sheet></v-col> -->
            <v-col>
              <v-select v-if="prefixes_ready" :items="nodeShapeNamesArray" item-title="name" label="Select a Node" density="compact">
                <template v-slot:item="{ props, item }">
                  <v-list-item v-bind="props" :title="toCURIE(nodeShapeNames[item.raw], prefixes)" @click="selectIRI(nodeShapeNames[item.raw])"></v-list-item>
                </template>
              </v-select>
            </v-col>
            <v-col cols="3"><v-sheet class="pa-2 ma-2"></v-sheet></v-col>
          </v-row>
          <v-row align="start" style="height: 150px; flex-wrap: nowrap" no-gutters>
              <!-- <v-col cols="1"><v-sheet class="pa-2 ma-2"></v-sheet></v-col> -->
              <v-col cols="6">
                <h3>Selected Node</h3>
                  <v-sheet class="pa-4" border rounded elevation="2">
                      <span v-if="selectedIRI && prefixes_ready">
                        <v-form @submit.prevent>
                          <NodeShapeEditor :key="selectedIRI" :shape_iri="selectedIRI" :shape_obj="selectedShape" :prop_groups="propertyGroups"/>
                        </v-form>
                      </span>
                  </v-sheet>
              </v-col>
              <v-col class="ml-6">
                <span v-if="selectedIRI && prefixes_ready">
                  <h3>Data</h3>
                  <v-sheet class="pa-4" border rounded elevation="2">
                    <code>
                      <span v-for="(value, key, index) in prefixes">
                        @prefix {{ key }}: &lt;{{ value }}&gt; .<br>
                      </span>
                      <br>
                      <span v-for="(value, key, index) in formData">
                        _b{{ index }} <br>
                        &nbsp;&nbsp;&nbsp; a {{ toCURIE(key, prefixes) }}
                        <span v-for="(prop_val, prop_key , prop_idx) in value">
                          <span v-if="prop_val">
                             ; <br>
                            &nbsp;&nbsp;&nbsp; {{ toCURIE(prop_key, prefixes) }} &quot;{{  prop_val }}&quot;
                          </span>
                        </span> .
                        <br><br>
                      </span>
                    </code>
                  </v-sheet>
                </span>
              </v-col>
          </v-row>
        </v-container>
      </v-main>
  </v-app>
</template>


<script setup>
  import { ref, onMounted, onBeforeMount, provide, getCurrentInstance } from 'vue'
  import { useFormData } from './composables/formdata';
  import { useShapeData } from './composables/shapedata';
  import { toCURIE } from './modules/utils';
  import editorMatchers from './modules/editors';
  import defaultEditor from './components/UnknownEditor.vue';

  // ---- //
  // Data //
  // ---- //
  
  var selectedIRI = ref(null)
  var selectedShape = ref(null)
  var current_instance = ref(null)
  const { formData, add_triple, add_node, remove_triple, edit_triple } = useFormData()
  const shape_file_url = new URL("./assets/shapesgraph.ttl", import.meta.url).href
  const {
    shapesDataset,
    nodeShapes,
    propertyGroups,
    nodeShapeNamesArray,
    prefixes,
    prefixArray,
    prefixes_ready,
    nodeShapeIRIs,
    nodeShapeNames,
    page_ready
  } = useShapeData(shape_file_url)
  const defaultPropertyGroup = {}
  defaultPropertyGroup.key = "https://concepts.datalad.org/DefaultPropertyGroup"
  defaultPropertyGroup.value = {
    "http://www.w3.org/2000/01/rdf-schema#comment": "",
    "http://www.w3.org/2000/01/rdf-schema#label": "Default Properties",
    "http://www.w3.org/ns/shacl#order": 100,
  }
  provide('defaultPropertyGroup', defaultPropertyGroup)
  provide('formData', formData)
  provide('add_triple', add_triple)
  provide('add_node', add_node)
  provide('remove_triple', remove_triple)
  provide('edit_triple', edit_triple)
  provide('prefixes', prefixes)
  provide('editorMatchers', editorMatchers)
  provide('defaultEditor', defaultEditor)


  // ----------------- //
  // Lifecycle methods //
  // ----------------- //

  onBeforeMount(() => {
    console.log(`the root component is about to be mounted.`)
  })

  onMounted(() => {
    console.log(`the root component is now mounted.`)
  })

  // ------------------- //
  // Computed properties //
  // ------------------- //


  // --------- //
  // Functions //
  // --------- //

  function selectIRI(IRI) { 
      selectedIRI.value = IRI
      selectedShape.value = nodeShapes.value[IRI]
      add_node(IRI)
  }
</script>