<template>
    <v-container fluid v-show="page_ready">
    <v-row align="start" no-gutters>
      <v-col>
        <h3>Forms</h3>
        <v-select v-if="prefixes_ready" :items="nodeShapeNamesArray" item-title="name" label="Select" density="compact">
          <template v-slot:item="{ props, item }">
            <v-list-item v-bind="props" :title="toCURIE(nodeShapeNames[item.raw], shapePrefixes)" @click="selectIRI(nodeShapeNames[item.raw])"></v-list-item>
          </template>
        </v-select>
      </v-col>
      <v-col cols="6"><v-sheet class="pa-2 ma-2"></v-sheet></v-col>
    </v-row>
    <v-row align="start" style="flex-wrap: nowrap" no-gutters>
        <!-- Display selected form -->
        <v-col cols="6">
          <h3>Selected form</h3>
            <v-sheet class="pa-4" border rounded elevation="2">
                <span v-if="selectedIRI && prefixes_ready">
                  <v-form ref="form" validate-on="submit lazy" @submit.prevent="saveForm()" >
                    <NodeShapeEditor :key="selectedIRI" :shape_iri="selectedIRI" :shape_obj="selectedShape" :prop_groups="propertyGroups"/>

                    <div style="display: flex;">
                      <v-btn
                        class="mt-2"
                        text="Reset"
                        @click="resetForm()"
                        style="margin-left: auto; margin-right: 1em;"
                      ></v-btn>
                      <v-btn
                        class="mt-2"
                        text="Save"
                        type="submit"
                      ></v-btn>
                    </div>
                  </v-form>
                </span>
            </v-sheet>
        </v-col>
        <!-- Display entered form data -->
        <v-col class="ml-6">
          <span v-if="selectedIRI && prefixes_ready">
            <h3>Form data</h3>
            <v-sheet class="pa-4" border rounded elevation="2">
              <code>
                <span v-for="(value, key, index) in shapePrefixes">
                  @prefix {{ key }}: &lt;{{ value }}&gt; .<br>
                </span>
                <br>
                <span v-for="(item, index) in flatFormData">
                  _b{{ index }} <br>
                  &nbsp;&nbsp;&nbsp; a {{ toCURIE(item["node_iri"], shapePrefixes) }}
                  <!-- value is an array of objects -->
                  <span v-for="(prop_vals, prop_key, prop_idx) in item['triples']">
                    <span v-for="pval in prop_vals">
                      <span v-if="pval">
                          ; <br>
                        &nbsp;&nbsp;&nbsp; {{ toCURIE(prop_key, shapePrefixes) }} &quot;{{  pval }}&quot;
                      </span>
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
</template>


<script setup>
  import { ref, onMounted, onBeforeMount, provide, inject, computed} from 'vue'
  import { useFormData } from '@/composables/formdata';
  import { useShapeData } from '@/composables/shapedata';
  import { toCURIE } from '@/modules/utils';
  import editorMatchers from '@/modules/editors';
  import defaultEditor from '@/components/UnknownEditor.vue';

  // ---- //
  // Data //
  // ---- //
  
  var selectedIRI = ref(null)
  var selectedShape = ref(null)
  var current_instance = ref(null)
  var tab = ref(null)
  const { formData, add_empty_triple, add_empty_node, remove_triple, save_node } = useFormData()
  const shape_file_url = new URL("@/assets/shapesgraph.ttl", import.meta.url).href
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
  provide('add_empty_triple', add_empty_triple)
  provide('add_empty_node', add_empty_node)
  provide('remove_triple', remove_triple)
  provide('shapePrefixes', shapePrefixes)
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

  const flatFormData = computed(() => {
    var ffdata = []
    for (const [key, value] of Object.entries(formData)) {
      for (const obj of value) {
        ffdata.push(
          {
            "node_iri": key,
            "triples": obj
          }
        )
      }
    }
    return ffdata
  });

  


  // --------- //
  // Functions //
  // --------- //

  function selectIRI(IRI) { 
      selectedIRI.value = IRI
      selectedShape.value = nodeShapes.value[IRI]
      add_empty_node(IRI)
  }

  function saveForm() {
    add_empty_node(selectedIRI.value)
    // save_node()
  }

  function resetForm(IRI) {

  }
</script>