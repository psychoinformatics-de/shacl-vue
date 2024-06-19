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
  import { ref, reactive, onMounted, onBeforeMount, provide, getCurrentInstance, computed} from 'vue'
  import rdf from 'rdf-ext';
  import ParserN3  from '@rdfjs/parser-n3';
  import { Readable } from 'readable-stream';
  import {SHACL, RDF} from './modules/namespaces';
  import { useFormData } from './composables/formdata';
  import { toCURIE } from './modules/utils';
  import editorMatchers from './modules/editors';
  import defaultEditor from './components/UnknownEditor.vue';

  // ---- //
  // Data //
  // ---- //
  
  const ttl_files = ["./assets/sddui-shacl.ttl", "./assets/sddui-shacl.ttl"]
  var shapesDataset = ref(null);
  var page_ready = ref(false);
  var prefixes_ready = ref(false);
  var nodeShapes = ref(null);
  var propertyGroups = ref(null);
  var nodeShapeIRIs = ref(null);
  var nodeShapeNames = ref(null);
  var nodeShapeNamesArray = ref([]);
  var prefixes = reactive({});
  var prefixArray = ref([]);
  var selectedIRI = ref(null)
  var selectedShape = ref(null)
  var graphDataset = ref(rdf.dataset());
  var current_instance = ref(null)
  const { formData, add_triple, add_node, remove_triple, edit_triple } = useFormData()


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
    getSHACLschema()
  })

  onMounted(() => {
    console.log("CURRENT INSTANCE")
    current_instance = getCurrentInstance()
    console.log(current_instance)
    console.log("MATCHERS")
    console.log(editorMatchers)

  })

  // ------------------- //
  // Computed properties //
  // ------------------- //

  const all_triples = computed(() => {

    var triples = {}
    for (const [idx, key] of Object.keys(formData).entries()) {
      triples[key] = {
        subject: formData[key].subject,
        predicate: formData[key].predicate,
        object: formData[key].object
      }

      for (const [jdx, tkey] of Object.keys(formData[key].properties).entries()) {
        triples[tkey] = {
          subject: formData[key].properties[tkey].subject,
          predicate: formData[key].properties[tkey].predicate,
          object: formData[key].properties[tkey].object
        }
      }
    }
    return triples
  })

  // --------- //
  // Functions //
  // --------- //

  function getSHACLschema() {
      const shape_file_url = new URL("./assets/graph.ttl", import.meta.url).href
      fetch(shape_file_url, {headers: {
          'Accept': 'text/turtle',
          'Content-Type': 'text/turtle',
      }})
      .then(response => response.text())
      .then(turtleContent => {
          const input = Readable.from(turtleContent)
          const parserN3 = new ParserN3();
          const output = parserN3.import(input)
          nodeShapes = {}
          propertyGroups = {}
          nodeShapeNamesArray = []
          shapesDataset = rdf.dataset()
          output.on('prefix', (prefix, ns) => {
              prefixes[prefix] = ns.value;
              prefixArray.value.push(ns.value)
              console.log(`prefix: ${prefix} ${ns.value}`)
          }).on('end', () => {
              prefixes_ready.value = true
          })
          output.on('data', quad => {
              shapesDataset.add(quad)
              const subject = quad.subject.value;
              const predicate = quad.predicate.value;
              const object = quad.object.value;
              // Isolate sh:NodeShape instances
              if (predicate === RDF.type.value && object === SHACL.NodeShape.value) {
                  nodeShapes[subject] = { properties: [] };
              }
              // Get properties of node shapes
              if (predicate === SHACL.property.value) {
                  nodeShapes[subject].properties.push(object);
              }
              // Get property groups, if any
              if (predicate === RDF.type.value && object === SHACL.PropertyGroup.value) {
                propertyGroups[subject] = { };
              }
          }).on('end', () => {
              // Loop through all nodeshapes
              for (const [key, value] of Object.entries(nodeShapes)) {
                  // Get attributes (other than 'properties') of the nodeshape
                  shapesDataset.forEach(quad => {
                      if (quad.subject.value === key && quad.predicate.value != SHACL.property.value) {
                          nodeShapes[key][quad.predicate.value] = quad.object.value
                      }
                  });
                  // Loop through property elements, i.e. blank nodes, and set correct attributes
                  for (var i = 0; i < value.properties.length; i++) {
                      var node = value.properties[i];
                      var new_node = {}
                      shapesDataset.forEach(quad => {
                          if (quad.subject.value === node) {
                              new_node[quad.predicate.value] = quad.object.value
                          }
                      });
                      // replace blank nodes with new object
                      value.properties[i] = new_node;
                  }
              }
              nodeShapeNames = {}
              for (const iri of Object.keys(nodeShapes)) { 
                var parts = iri.split('/')
                nodeShapeNames[parts[parts.length - 1]] = iri
              }

              nodeShapeNamesArray = Object.keys(nodeShapeNames).sort()
              nodeShapeIRIs = Object.keys(nodeShapes).sort()
              console.log('SHACL Shapes:');
              console.log(nodeShapes);
              console.log(nodeShapeIRIs);
              // Now handle the (possibility of) property groups
              for (const [key, value] of Object.entries(propertyGroups)) {
                shapesDataset.forEach(quad => {
                    if (quad.subject.value === key && quad.predicate.value != RDF.type.value ) {
                      propertyGroups[key][quad.predicate.value] = quad.object.value
                    }
                });
              }
              console.log('PropertyGroups')
              console.log(propertyGroups)
              page_ready.value = true
          });
      })
      .catch(error => {
          console.error('Error loading Turtle file:', error);
      });
  }

  function selectIRI(IRI) { 
      selectedIRI.value = IRI
      selectedShape.value = nodeShapes[IRI]
      add_node(IRI)
  }

</script>./composables/formdata