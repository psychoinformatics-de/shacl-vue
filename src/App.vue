<template>
  <v-app>
      <AppHeader />
      <v-main v-show="page_ready">
          <v-navigation-drawer location="left">
              <v-list>
                  <v-list-item link title="Shapes"></v-list-item>
                  <v-divider></v-divider>
                  <span v-for="(value, key) in nodeShapes">
                      <v-list-item link :title="toCURIE(key)" @click="selectIRI(key)"></v-list-item>
                  </span>
              </v-list>
          </v-navigation-drawer>

          <v-container class=" mb-6">
              <v-row align="start" style="height: 150px;" no-gutters>
                  <v-col cols="1"><v-sheet class="pa-2 ma-2"></v-sheet></v-col>
                  <v-col>
                      <v-sheet class="pa-4" border rounded elevation="2">
                          <span v-if="selectedIRI && prefixes_ready">
                              <NodeShapeViewer :prefixes="prefixes" :shape_iri="selectedIRI" :shape_obj="selectedShape"/>
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
  import { ref, onMounted } from 'vue'
  import rdf from 'rdf-ext';
  import ParserN3  from '@rdfjs/parser-n3';
  import { Readable } from 'readable-stream';
  import NodeShapeViewer from './components/NodeShapeViewer.vue'

  // Define a namespace for SHACL
  const SHACL = rdf.namespace('http://www.w3.org/ns/shacl#');
  const RDF = rdf.namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#');
  var datasetObj = ref(null);
  const parserN3 = new ParserN3();
  var page_ready = ref(false);
  var prefixes_ready = ref(false);
  var nodeShapes = ref(null);
  var prefixes = ref(null);
  var prefixArray = ref(null);
  var selectedIRI = ref(null)
  var selectedShape = ref(null)


  function getSHACLschema() {
      const shape_file = "/src/assets/ddist-shacl.ttl";
      fetch(shape_file, {headers: {
          'Accept': 'text/turtle',
          'Content-Type': 'text/turtle',
      }})
      .then(response => response.text())
      .then(turtleContent => {
          const input = Readable.from(turtleContent)

          const output = parserN3.import(input)
          nodeShapes = {}
          prefixes = {}
          prefixArray = []
          datasetObj = rdf.dataset()
          output.on('prefix', (prefix, ns) => {
              prefixes[prefix] = ns.value;
              prefixArray.push(ns.value)
              console.log(`prefix: ${prefix} ${ns.value}`)
          }).on('end', () => {
              prefixes_ready.value = true
          })
          output.on('data', quad => {
              datasetObj.add(quad)
              const subject = quad.subject.value;
              const predicate = quad.predicate.value;
              const object = quad.object.value;
              console.log(`quad: ${subject} - ${predicate} - ${object}`)
              // Isolate sh:NodeShape instances
              if (predicate === RDF.type.value && object === SHACL.NodeShape.value) {
                  nodeShapes[subject] = { properties: [] };
              }
              // Get properties of node shapes
              if (predicate === SHACL.property.value) {
                  nodeShapes[subject].properties.push(object);
              }
          }).on('end', () => {
              // Loop through all nodeshapes
              for (const [key, value] of Object.entries(nodeShapes)) {
                  // Get attributes (other than 'properties') of the nodeshape
                  datasetObj.forEach(quad => {
                      if (quad.subject.value === key && quad.predicate.value != SHACL.property.value) {
                          nodeShapes[key][quad.predicate.value] = quad.object.value
                      }
                  });
                  // Loop through property elements, i.e. blank nodes, and set correct attributes
                  for (var i = 0; i < value.properties.length; i++) {
                      var node = value.properties[i];
                      var new_node = {}
                      datasetObj.forEach(quad => {
                          if (quad.subject.value === node) {
                              new_node[quad.predicate.value] = quad.object.value
                          }
                      });
                      // replace blank nodes with new object
                      value.properties[i] = new_node;
                  }
              }
              console.log('Node Shapes:');
              console.log(nodeShapes);
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
              return curie + ':' + IRI.split(iri)[1]
          }
      }
  }

  function selectIRI(IRI) {
      selectedIRI.value = IRI
      selectedShape.value = nodeShapes[IRI]
      console.log(selectedIRI)
      console.log(selectedShape)
  }


  onMounted(() => {
      console.log(`the root component is now mounted.`)
      getSHACLschema()
  })
</script>



