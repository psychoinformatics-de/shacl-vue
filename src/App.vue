<template>
  <v-app>
      <AppHeader />
      <v-main v-show="page_ready">

        

        <v-container class=" mb-6">
          <v-row align="start" no-gutters>
            <v-col cols="1"><v-sheet class="pa-2 ma-2"></v-sheet></v-col>
            <v-col>
              <v-select :items="nodeShapeNamesArray" item-title="name" label="Select a Node" density="compact">
                <template v-slot:item="{ props, item }">
                  <v-list-item v-bind="props" :title="toCURIE(nodeShapeNames[item.raw])" @click="selectIRI(nodeShapeNames[item.raw])"></v-list-item>
                </template>
              </v-select>
            </v-col>
            <v-col cols="2"><v-sheet class="pa-2 ma-2"></v-sheet></v-col>
          </v-row>
          <v-row align="start" style="height: 150px;" no-gutters>
              <v-col cols="1"><v-sheet class="pa-2 ma-2"></v-sheet></v-col>
              <v-col>
                  <v-sheet class="pa-4" border rounded elevation="2">
                      <span v-if="selectedIRI && prefixes_ready">
                          <NodeShapeEditor :prefixes="prefixes" :shape_iri="selectedIRI" :shape_obj="selectedShape" :prop_groups="propertyGroups"/>
                      </span>
                      
                  </v-sheet>
              </v-col>
              <v-col cols="2"><v-sheet class="pa-2 ma-2"></v-sheet></v-col>
          </v-row>
        </v-container>
          
      </v-main>

  </v-app>
</template>


<script setup>
  import { ref, onMounted, onBeforeMount, provide} from 'vue'
  import rdf from 'rdf-ext';
  import ParserN3  from '@rdfjs/parser-n3';
  import { Readable } from 'readable-stream';
  import {SHACL, RDF} from './plugins/namespaces'
  
  // ---- //
  // Data //
  // ---- //

  const parserN3 = new ParserN3();
  var shapesDataset = ref(null);
  var page_ready = ref(false);
  var prefixes_ready = ref(false);
  var nodeShapes = ref(null);
  var propertyGroups = ref(null);
  var nodeShapeIRIs = ref(null);
  var nodeShapeNames = ref(null);
  var nodeShapeNamesArray = ref([]);
  var prefixes = ref(null);
  var prefixArray = ref(null);
  var selectedIRI = ref(null)
  var selectedShape = ref(null)

  const defaultPropertyGroup = {}
  defaultPropertyGroup.key = "https://concepts.datalad.org/DefaultPropertyGroup"
  defaultPropertyGroup.value = {
    "http://www.w3.org/2000/01/rdf-schema#comment": "",
    "http://www.w3.org/2000/01/rdf-schema#label": "Default Properties",
    "http://www.w3.org/ns/shacl#order": 100,
  }
  
  provide('defaultPropertyGroup', defaultPropertyGroup)

  // ----------------- //
  // Lifecycle methods //
  // ----------------- //

  onBeforeMount(() => {
    console.log(`the root component is about to be mounted.`)
    getSHACLschema()
  })

  // --------- //
  // Functions //
  // --------- //

  function getSHACLschema() {
      const shape_file_url = new URL("./assets/sddui-shacl.ttl", import.meta.url).href
      fetch(shape_file_url, {headers: {
          'Accept': 'text/turtle',
          'Content-Type': 'text/turtle',
      }})
      .then(response => response.text())
      .then(turtleContent => {
          const input = Readable.from(turtleContent)
          const output = parserN3.import(input)
          nodeShapes = {}
          propertyGroups = {}
          prefixes = {}
          prefixArray = []
          nodeShapeNamesArray = []
          shapesDataset = rdf.dataset()
          output.on('prefix', (prefix, ns) => {
              prefixes[prefix] = ns.value;
              prefixArray.push(ns.value)
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

  function toCURIE(IRI) {
      for (const [curie, iri] of Object.entries(prefixes)) {
          if (IRI.indexOf(iri) >= 0) {
            var parts = IRI.split('/')
            return curie + ':' + parts[parts.length - 1]
          }
      }
  }

  function selectIRI(IRI) { 
      selectedIRI.value = IRI
      selectedShape.value = nodeShapes[IRI]
  }

</script>





