<template>
    <v-container fluid>

      <v-card height="100%">
          <v-tabs
            v-model="testtab"
            align-tabs="left"
            color="deep-purple-accent-4"
          >
            <v-tab :value="1">rdf-object view</v-tab>
            <v-tab :value="2" @click="selectViz">Cytoscape Viz</v-tab>
            <v-tab :value="3" @click="">rdf-object edit</v-tab>
          </v-tabs>
          <br>
          <v-tabs-window v-model="testtab">
            <v-tabs-window-item :key="1" :value="1">
              <v-sheet class="pa-4" border rounded>
                  <v-select v-model="selectedFormItem" v-if="prefixes_ready" :items="nodeShapeNamesArray" item-title="name" label="Select" density="compact">
                    <template v-slot:item="{ props, item }">
                      <v-list-item v-bind="props" :title="toCURIE(nodeShapeNames[item.raw], shapePrefixes)" @click="selectIRI(nodeShapeNames[item.raw])"></v-list-item>
                    </template>
                  </v-select>
                  <span v-if="resources_loaded">
                      <v-card v-for="r in selectedResources" class="mb-4">
                        <v-card-title>{{ r.value }}</v-card-title>
                        <v-card-text>
                          <strong>Properties</strong><br>
                          <span v-for="(v, k, index) in r.property">
                            &nbsp;&nbsp; <em>{{ k }}</em>: {{ r.properties[k] }} <br>
                          </span>
                        </v-card-text>
                      </v-card>
                  </span>
              </v-sheet>
            </v-tabs-window-item>
            
            
            <v-tabs-window-item :key="2" :value="2">
              <div ref="cyContainer" style="width: 100%; height: 500px;"></div>
            </v-tabs-window-item>

            <v-tabs-window-item :key="3" :value="3">
            </v-tabs-window-item>
          </v-tabs-window>
      </v-card>
  </v-container>
</template>


<script setup>
  import { ref, onMounted, computed, reactive, toRaw, inject, nextTick, watch} from 'vue'
  import {RdfObjectLoader} from "rdf-object";
  import rdf from 'rdf-ext';
  import cytoscape from 'cytoscape';
  import { toCURIE } from '@/modules/utils';
  import {SHACL, RDF, RDFS, DLTHING, XSD} from '@/modules/namespaces'

  const cyContainer = ref(null);

  const shapePrefixes = inject('shapePrefixes')
  const nodeShapes = inject('nodeShapes')
  const nodeShapeNamesArray = inject('nodeShapeNamesArray')
  const nodeShapeNames = inject('nodeShapeNames')
  const prefixes_ready = inject('prefixes_ready')
  const graphPrefixes = inject('graphPrefixes')
  const allPrefixes = reactive({});
  const classPrefixes = inject('classPrefixes');

  var selectedIRI = ref(null)
  var selectedShape = ref(null)
  var selectedFormItem = ref(null)

  const quadArray = ref([])
  const graphData = inject('graphData')
  // const context = {
  //   'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  //   'rdfs': 'http://www.w3.org/2000/01/rdf-schema#',
  //   'ex': 'http://example.org/'
  // };
  
  const resources_loaded = ref(false)
  const myResources = ref({})
  const myResourcesArray = ref([])

  const viz_viewed = ref(false)
  const testtab = ref(1)
  var RDFOBLoader

  onMounted(() => {
    console.log()
    console.log(graphData)
  });

  watch(prefixes_ready, (newValue) => {
    console.log("CHECK: prefixesready")
    if (newValue) {
      // Get all prefixes and derive context from it
      Object.assign(allPrefixes, shapePrefixes, graphPrefixes, classPrefixes)
      const context = toRaw(allPrefixes)
      // Map graph dataset to an array
      graphData.forEach(quad => {
        quadArray.value.push(quad)
      });
      // Create new RdfObjectLoader with context, and load all quads into it as resources
      RDFOBLoader = new RdfObjectLoader({ context });
      RDFOBLoader.importArray(quadArray.value).then(() => {
        console.log("RDFOBLoader")
        console.log(RDFOBLoader)
        myResources.value = RDFOBLoader.resources;
        myResourcesArray.value = Object.values(myResources.value);
        resources_loaded.value = true
      });
      globalThis.RDFOBLoader = RDFOBLoader
    }
    }, { immediate: true });


  const selectedResources = computed(() => {
    if (!selectedIRI.value) return [];
    // URIs of resources come in the form of literals and named nodes (not sure why yet...)
    // this means we have to match to both to find all related resources
    var iriNode = rdf.namedNode(selectedIRI.value)
    var curieNode = rdf.literal(toCURIE(selectedIRI.value, allPrefixes), XSD.anyURI)
    var filteredResources = {}
    Object.values(RDFOBLoader.resources).forEach( (r) => {
      const properties = toRaw(r.property);
      if (properties[RDF.type.value]) {
        var typeNode = rdf.namedNode(properties[RDF.type.value])
        if ([iriNode.value, curieNode.value].indexOf(typeNode.value) >= 0) {
          filteredResources[r.value] = r
        }
      }
    })
    return filteredResources
  });

  function selectIRI(IRI) {
      selectedIRI.value = IRI
      selectedShape.value = nodeShapes.value[IRI]
      console.log(IRI)
      var iriNode = rdf.namedNode(IRI)
      var curieNode = rdf.literal(toCURIE(IRI, allPrefixes), XSD.anyURI)
      Object.values(RDFOBLoader.resources).forEach( (r) => {
        const properties = toRaw(r.property);
        if (properties[RDF.type.value]) {
          var typeNode = rdf.namedNode(properties[RDF.type.value])
          if ([iriNode.value, curieNode.value].indexOf(typeNode.value) >= 0) {
            // console.log("Found matching resource:")
            // console.log(`\t${r.value}`)
            // console.log(`\t${JSON.stringify(properties[RDF.type.value], null, 2)}`)
          }
        }
      })



      // var koek = myResourcesArray.value.filter((r) => {
      //   r.property[RDF.type] ? r.property[RDF.type] == selectedIRI.value : false
      // })
  }


  function selectViz() {
    if (viz_viewed.value) return;

    nextTick(() => {

      const elements = datasetToCytoscapeElements();
      cytoscape({
        container: cyContainer.value,
        elements: elements,
        style: [
          {
            selector: 'node',
            style: {
              'label': 'data(label)',
              'background-color': '#0074D9',
              'color': '#ffffff',
              'text-valign': 'center',
              'text-halign': 'center',
              'font-size': '10px',
            }
          },
          {
            selector: 'edge',
            style: {
              'label': 'data(label)',
              'width': 2,
              'line-color': '#ff7f0e',
              'target-arrow-color': '#ff7f0e',
              'target-arrow-shape': 'triangle',
              'curve-style': 'bezier',
              'font-size': '8px',
            }
          }
        ],
        layout: {
          name: 'breadthfirst',
          animate: true,
        }
      });
      viz_viewed.value = true
    });
    
  }

  // Function to convert RDF dataset to Cytoscape elements
  function datasetToCytoscapeElements() {
    const elements = [];
    const nodeIds = new Set();  // Track unique nodes

    graphData.forEach(quad => {
      const subjectId = quad.subject.value;
      const objectId = quad.object.value;
      const predicateLabel = quad.predicate.value;

      // Add unique nodes to elements
      if (!nodeIds.has(subjectId)) {
        elements.push({ data: { id: subjectId, label: subjectId } });
        nodeIds.add(subjectId);
      }
      if (!nodeIds.has(objectId)) {
        elements.push({ data: { id: objectId, label: objectId } });
        nodeIds.add(objectId);
      }

      // Add edge
      elements.push({
        data: {
          source: subjectId,
          target: objectId,
          label: predicateLabel,
        }
      });
    });

    return elements;
  }

</script>