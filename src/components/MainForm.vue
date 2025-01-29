<template>
    <v-container fluid v-show="!props.ready">
      <v-skeleton-loader type="article"></v-skeleton-loader>
    </v-container>
    <v-container fluid v-show="props.ready">
    <v-row align="start" no-gutters>
      <v-col>
        <h3>Forms</h3>
        <v-select v-model="selectedFormItem" v-if="prefixes_ready" :items="nodeShapeNamesArray" item-title="name" label="Select" density="compact">
          <template v-slot:item="{ props, item }">
            <v-list-item v-bind="props" :title="toCURIE(nodeShapeNames[item.raw], shapePrefixes)" @click="selectIRI(nodeShapeNames[item.raw])"></v-list-item>
          </template>
        </v-select>
      </v-col>
      <v-col cols="6">
        <v-sheet class="pa-2 ma-2">
          <div v-if="allPrefixes && selectedIRI" style="display: flex;">
            <div style="margin-left: auto;">
              <v-btn variant="tonal" @click="openDrawer">Prefixes <v-icon>mdi-menu-down</v-icon></v-btn>
            <v-navigation-drawer
              v-model="drawer"
              location="right"
              temporary
              width="300"
            >
              <v-list density="compact">
                <!-- Prepend button as the first list item -->
                <v-list-item @click="togglePrefixFields">
                  <v-list-item-title> <v-icon style="padding-bottom: 0.1em;">mdi-plus-box-outline</v-icon> Add new prefix</v-list-item-title>
                </v-list-item>
                <v-list-item v-if="showPrefixForm">
                  <v-card outlined class="pa-4">
                    <v-form ref="prefixForm" v-model="formValid" validate-on="input" @submit.prevent="savePrefix()">
                      <v-text-field density="compact" label="Prefix code" v-model="new_prefix.code" :rules="[rules.required]" ></v-text-field>
                      <v-text-field density="compact" label="Prefix URL" v-model="new_prefix.url" :rules="[rules.required]" ></v-text-field>
                      <div style="display: flex;">
                        <v-btn
                            class="mt-2"
                            text="Save"
                            type="submit"
                            style="margin-left: auto;"
                        ></v-btn>
                      </div>
                    </v-form>
                  </v-card>
                </v-list-item>
                <v-divider></v-divider>
                <v-list-item v-for="(item, index) in prefixOptions" :key="index">
                  <v-list-item-title>{{ item.title }}</v-list-item-title>
                  <v-list-item-subtitle>{{ item.props.subtitle }}</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-navigation-drawer>
            </div>
          </div>
        </v-sheet>
      </v-col>
    </v-row>
    <v-row align="start" style="flex-wrap: nowrap" no-gutters>
        <!-- Display selected form -->
        <v-col cols="6">
          <span v-if="selectedIRI && nodeSelected && prefixes_ready">
            <h3>Selected form</h3>
            <FormEditor :key="selectedIRI" :shape_iri="selectedIRI" :node_idx="newNodeIdx"></FormEditor>
          </span>
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
                    <span v-if="item['@id']"> {{ item['@id'] }} </span>
                    <span v-else>{{ item["instance_id"].substring(0,9) }} </span>
                    <br>
                  &nbsp;&nbsp;&nbsp; a {{ toCURIE(item["node_iri"], shapePrefixes) }}
                  <!-- value is an array of objects -->
                  <span v-for="(prop_vals, prop_key, prop_idx) in item['triples']">
                    <span v-for="pval in prop_vals">
                        <span v-if="pval && pval != item['@id']">
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
    <!-- <v-sheet class="pa-4" border rounded elevation="2">
      <code>
        {{ flatFormData }}
      </code>
    </v-sheet>
    <v-sheet class="pa-4" border rounded elevation="2">
      <code>
        {{ formData }}
      </code>
    </v-sheet> -->
  </v-container>
</template>


<script setup>
  import { ref, onMounted, onBeforeMount, provide, inject, computed, reactive, watch} from 'vue'
  import { DLTHING } from '@/modules/namespaces';
  import { toCURIE } from '@/modules/utils';

  // ----- //
  // Props //
  // ----- //

  const props = defineProps({
      ready: Boolean,
  })

  // ---- //
  // Data //
  // ---- //
  
  const config = inject('config')
  const ID_IRI = config.value.id_iri ? config.value.id_iri : ""
  var selectedIRI = ref(null)
  var selectedShape = ref(null)
  var selectedFormItem = ref(null)
  var prefixForm = ref(null)
  var showPrefixForm = ref(false)
  var drawer = ref(false)
  var formValid = ref(false)
  const newNodeIdx = ref(null)
  const rules = {
    required: value => !!value || 'This field is required',
  }
  const formData = inject('formData')
  const add_empty_node = inject('add_empty_node')
  
  const nodeSelected = ref(false);
  const shapePrefixes = inject('shapePrefixes')
  const nodeShapes = inject('nodeShapes')
  const nodeShapeNamesArray = inject('nodeShapeNamesArray')
  const nodeShapeNames = inject('nodeShapeNames')
  const prefixes_ready = inject('prefixes_ready')
  const graphPrefixes = inject('graphPrefixes');
  const classPrefixes = inject('classPrefixes');
  const allPrefixes = reactive({});
  const new_prefix = reactive({
    code: null,
    url: null
  })
  provide('allPrefixes', allPrefixes)

  function cancelFormHandler() {
    selectedFormItem.value = null
    selectedIRI.value = null
    newNodeIdx.value = null
    nodeSelected.value = false
  }
  provide('cancelFormHandler', cancelFormHandler);
  const saveMainForm = () => {
    selectedFormItem.value = null
    selectedIRI.value = null
    newNodeIdx.value = null
    nodeSelected.value = false
  };
  provide('saveFormHandler', saveMainForm);


  // ----------------- //
  // Lifecycle methods //
  // ----------------- //

  onBeforeMount(() => {
    console.log(`the root component is about to be mounted.`)
  })

  watch(prefixes_ready, (newValue) => {
    console.log("CHECK: prefixesready")
    if (newValue) {
      Object.assign(allPrefixes, shapePrefixes, graphPrefixes, classPrefixes)
      // allPrefixes = {...shapePrefixes, ...graphPrefixes, ...classPrefixes}
      console.log("All prefixes ready")
      console.log(allPrefixes)
    }
    }, { immediate: true });

  onMounted(() => {
    console.log(`the root component is now mounted.`)
  })

  // ------------------- //
  // Computed properties //
  // ------------------- //

  const flatFormData = computed(() => {
    var ffdata = []
    for (const [node_iri, value] of Object.entries(formData)) {
        // key is node iri
        // value is object with node instance ids as keys
        for (const [inst_id, inst_obj] of Object.entries(value)) {

            var atID = Object.keys(inst_obj).indexOf(ID_IRI) >= 0 && inst_obj[ID_IRI] ? inst_obj[ID_IRI] : [null]
            ffdata.push(
                {
                    "node_iri": node_iri,
                    "instance_id": inst_id,
                    "triples": inst_obj,
                    "@id": atID[0]
                }
            )
        }
    }
    return ffdata
  });

  const prefixOptions = computed(() => {
      var prefixes = []
      for (const [k, v] of Object.entries(allPrefixes)) {
          prefixes.push(
              {
                  title: k,
                  value: k,
                  props: { subtitle: v},
              }
          )
      }
      return prefixes.sort((a, b) => a.title.localeCompare(b.title))
  })
  

  


  // --------- //
  // Functions //
  // --------- //

    function selectIRI(IRI) {
        nodeSelected.value = false
        selectedIRI.value = IRI
        selectedShape.value = nodeShapes.value[IRI]
        newNodeIdx.value = '_:' + crypto.randomUUID()
        add_empty_node(IRI, newNodeIdx.value)
        nodeSelected.value = true
    }

    function openDrawer() {
        resetPrefixFields()
        showPrefixForm.value = false
        drawer.value = true;

    }

  function togglePrefixFields() {
      showPrefixForm.value = !showPrefixForm.value
      if (!showPrefixForm.value) resetPrefixFields()
  }

  function resetPrefixFields() {
      new_prefix.code = null
      new_prefix.url = null
  }

  async function savePrefix() {
    const validationResult = await prefixForm.value.validate();
    if (validationResult.valid) {
      allPrefixes[new_prefix.code] = new_prefix.url
      resetPrefixFields()
      togglePrefixFields()
    } else {
      console.log("Prefix form validation error")
    }
  }

</script>