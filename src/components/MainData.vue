<template>
  <v-container fluid>
    <v-card height="100%">
            <v-sheet class="pa-4" border rounded >
                <div class="d-flex flex-row" style="width: 100%; height: 100%;">
                    <v-tabs
                        v-model="datadatatab"
                        direction="vertical"
                        bg-color="#41b883"
                        color="deep-purple-accent-4">
                        <v-tab :value="1">Browse data</v-tab>    
                        <v-tab :value="2">View RDF</v-tab>
                        <v-tab :value="3" @click="selectViz">View Graph</v-tab>
                        <v-tab :value="4">Add data</v-tab>

                    </v-tabs>
                    <v-tabs-window v-model="datadatatab" style="width: 100%;">
                        
                        <!-- BROWSE DATA -->
                        <v-tabs-window-item :key="1" :value="1">
                            <v-sheet d-flex d-flex-grow class="pa-4 ml-2" border rounded style="width: 100%;">
                                <!-- <v-btn text="Download samples.tsv" @click="serializeNodesToTSV"></v-btn> -->
                                <v-select v-model="selectedFormItem" v-if="prefixes_ready" :items="nodeShapeNamesArray" item-title="name" label="Select" density="compact" style="width: 100%;">
                                    <template v-slot:item="{ props, item }">
                                    <v-list-item v-bind="props" :title="toCURIE(nodeShapeNames[item.raw], shapePrefixes)" @click="selectIRI(nodeShapeNames[item.raw])"></v-list-item>
                                    </template>

                                </v-select>

                                <v-card v-for="r in instanceItems" class="mb-4">
                                    <v-card-title>{{ r.title }}</v-card-title>
                                    <v-card-subtitle>{{ toCURIE(r.props.subtitle, allPrefixes) }}</v-card-subtitle>
                                    <v-card-text>
                                    <strong>Properties</strong><br>
                                    <span v-for="(v, k, index) in r.props">
                                        <span v-if="k == 'subtitle' || k == 'quad'"></span>
                                        <span v-else-if="v.length == 1">
                                            &nbsp;&nbsp; <em>{{ toCURIE(k, allPrefixes) }}</em>: {{ v[0] }} <br>
                                        </span>
                                        <span v-else>
                                            &nbsp;&nbsp; <em>{{ toCURIE(k, allPrefixes) }}</em>: <br>
                                            <span v-for="el in v">
                                                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {{ el }} <br>
                                            </span>
                                        </span>
                                    </span>
                                    </v-card-text>
                                    <v-card-actions>
                                        <div style="display: flex;">
                                            <v-btn
                                                style="margin-left: auto;"
                                                prepend-icon="mdi-pencil"
                                                variant="outlined"
                                                text="Edit"
                                                @click="editNode(r)"
                                            ></v-btn>
                                        </div>
                                    </v-card-actions>
                                </v-card>
                            </v-sheet>
                        </v-tabs-window-item>

                        <!-- VIEW RDF -->
                        <v-tabs-window-item :key="2" :value="2">
                            <v-sheet class="pa-4 ml-2" border rounded elevation="2">
                                <v-row align="start" no-gutters>
                                    <v-btn text="Export to TTL" @click="exportGraphData()"></v-btn>
                                </v-row>
                                <br>
                                <pre class="formatted-pre">
                                    <code class="formatted-code">{{ serializedGraphData }}</code>
                                </pre>
                            </v-sheet>
                        </v-tabs-window-item>

                        <!-- VIEW GRAPH -->
                        <v-tabs-window-item :key="3" :value="3">
                            <v-sheet class="pa-4 ml-2" border rounded elevation="2">
                                <div ref="cyContainer" style="width: 100%; height: 500px;"></div>
                            </v-sheet>
                            
                        </v-tabs-window-item>

                        <!-- ADD DATA -->
                        <v-tabs-window-item :key="4" :value="4">
                            <v-sheet class="pa-4 ml-2" border rounded elevation="2">
                            <h3>Add data</h3>
                            <v-row align="start" no-gutters>
                                <v-col>
                                <v-form @submit.prevent>
                                    <v-file-input
                                    density="compact"
                                    variant="outlined"
                                    v-model="upload_url"
                                    accept="*.ttl"
                                    label="Upload a ttl file"
                                    chips
                                    validate-on="input"
                                    ></v-file-input>
                                </v-form>
                                </v-col>
                                <v-col cols="1" style="text-align: center;">...or...</v-col>
                                <v-col>
                                <v-form @submit.prevent>
                                    <v-text-field
                                    v-model="public_url"
                                    density="compact"
                                    variant="outlined"
                                    type="url"
                                    label="Paste a public URL"
                                    validate-on="input"
                                    >
                                    </v-text-field>
                                </v-form>
                                </v-col>
                            </v-row>
                            <v-row align="start" no-gutters>
                                <v-btn text="Load data" @click="handleUpload()"></v-btn>
                            </v-row>
                            </v-sheet>
                        </v-tabs-window-item>
                        
                    </v-tabs-window>
                </div>
            </v-sheet>

    </v-card>

    <v-dialog v-model="editDialog" max-width="700">
        <template v-slot:default="{ isActive }">
            <FormEditor :key="editShapeIRI" :shape_iri="editShapeIRI" :node_idx="editNodeIdx"></FormEditor>
        </template>
    </v-dialog>


  </v-container>
</template>


<script setup>
    import { ref, computed, provide, inject, watch, reactive, toRaw, nextTick, onBeforeUpdate } from 'vue'
    import rdf from 'rdf-ext';
    import cytoscape from 'cytoscape';
    import fetch from '@rdfjs/fetch-lite'
    import N3 from 'n3';
    import { toCURIE, getLiteralAndNamedNodes, getSubjectTriples, toIRI, dlTTL} from '../modules/utils';
    import {SHACL, RDF, RDFS, DLTHING, XSD} from '@/modules/namespaces'


    const batchMode = inject('batchMode');
    const getGraphData = inject('getGraphData');
    const triggerReactivity = inject('triggerReactivity');
    const updateSerializedData = inject('updateSerializedData');
    const graphData = inject('graphData');
    const formData = inject('formData');
    const classData = inject('classData');
    const serializedGraphData = inject('serializedGraphData');
    const serializeNodesToTSV = inject('serializeNodesToTSV')
    const public_url = ref('')
    const upload_url = ref(null)
    const datatab = ref(1)
    const datadatatab = ref("2")
    const cyContainer = ref(null);
    const quadsToFormData = inject('quadsToFormData')
    const ID_IRI = inject('ID_IRI')

    const shapePrefixes = inject('shapePrefixes')
    const nodeShapes = inject('nodeShapes')
    const nodeShapeNamesArray = inject('nodeShapeNamesArray')
    const nodeShapeNames = inject('nodeShapeNames')
    const prefixes_ready = inject('prefixes_ready')
    const graphPrefixes = inject('graphPrefixes')
    const allPrefixes = reactive({});
    const classPrefixes = inject('classPrefixes');
    const viz_viewed = ref(false)
    provide('allPrefixes', allPrefixes)

    var selectedIRI = ref(null)
    var selectedShape = ref(null)
    var selectedFormItem = ref(null)

    const editDialog = ref(false)
    const editShapeIRI = ref(null)
    const editNodeIdx = ref(null)
    const editMode = inject('editMode')

    const quadArray = ref([])

    const instanceItems = ref([])

    function cancelFormHandler() {
        editDialog.value = false
        editMode.form = editMode.graph = false
    }
    provide('cancelFormHandler', cancelFormHandler);
    const saveMainForm = () => {
        editDialog.value = false
        editMode.form = editMode.graph = false
        instanceItems.value = getInstanceItems()
    };
    provide('saveFormHandler', saveMainForm);

    onBeforeUpdate( () => {
        console.log("onBeforeUpdate maindata")
        editNodeIdx.value = null
        editShapeIRI.value = null
        if (selectedIRI.value) {
            instanceItems.value = getInstanceItems()
        }
    })

    watch(prefixes_ready, (newValue) => {
        // console.log("CHECK: prefixesready")
        if (newValue) {
            // Get all prefixes and derive context from it
            Object.assign(allPrefixes, shapePrefixes, graphPrefixes, classPrefixes)
            const context = toRaw(allPrefixes)
            // Map graph dataset to an array
            graphData.forEach(quad => {
                quadArray.value.push(quad)
            });
        }
    }, {immediate: true });

    // async function exportGraphData() {
    //     console.log("exporting ttl")
    //     const textStream = rdfSerializer.serialize(graphData.toStream(), { contentType: 'text/turtle' });
    //     var kaas = await stringifyStream(textStream);
    //     console.log(kaas)


    // }

    function exportGraphData() {
        const writer = new N3.Writer({ prefixes: toRaw(allPrefixes) }); // Create a writer which uses `c` as a prefix for the namespace `http://example.org/cartoons#`
        graphData.forEach(quad => {
            writer.addQuad(quad)
        });
        writer.end((error, result) => {
            // console.log(result)
            dlTTL(result)
        });
    }
    
    
    function editNode(instance) {
        // When user selects to edit, it will be either a namedNode or blankNode
        // and the related information would already be in the graph as triples
        // Also, related information might already be in formData if the user
        // created or edited the same node before in the same session. If not,
        // then a formData node has to be created from the triples in the graph.
        var subjectTerm = instance.props.quad.subject
        var objectTerm = instance.props.quad.object
        if (objectTerm.termType === "NamedNode") {
            editShapeIRI.value = objectTerm.value
        } else {
            editShapeIRI.value = toIRI(objectTerm.value, allPrefixes)
        }
        editNodeIdx.value = instance.value
        // console.log(subjectTerm)
        // if the node is already in the formData, edit that
        if (formData[editShapeIRI.value]?.[editNodeIdx.value]) {
            editMode.form = true
            editMode.graph = false
            // open formEditor
            editDialog.value = true
        } else {
            // If not, we need to create the formData entries from quads in the dataset
            quadsToFormData(editShapeIRI.value, subjectTerm, graphData, ID_IRI.value)
            editMode.form = false
            editMode.graph = true
            // open formEditor
            editDialog.value = true
        }
    }


    function selectIRI(IRI) {
        selectedIRI.value = IRI
        selectedShape.value = nodeShapes.value[IRI]
        // console.log(IRI)
        instanceItems.value = getInstanceItems()
    }


    function getInstanceItems() {
        // ---
        // The goal of this method is to populate the list of data objects of the selected type
        // ---
        // find nodes with predicate rdf:type and object being selected class
        var quads = getLiteralAndNamedNodes(
            graphData,
            rdf.namedNode(RDF.type),
            selectedIRI.value,
            allPrefixes
        )
        // then find nodes with predicate rdfs:subClassOf and object being the property class
        // TODO: here we are only using a named node for the object because this is how the
        // tools/gen_owl_minimal.py script outputs the triples in the ttl file. This should be
        // generalised
        const subClasses = rdf.grapoi({ dataset: classData })
            .hasOut(rdf.namedNode(RDFS.subClassOf.value), rdf.namedNode(selectedIRI.value))
            .quads();
        // For each subclass, find the quads in graphData that has the class name as object
        // and RDF.type as predicate
        var myArr = []
        Array.from(subClasses).forEach(quad => {
            const cl = quad.subject.value
            // console.log(`\t - getting quads with class: ${cl}`)
            // console.log(`\t - (size of data graph: ${graphData.size})`)
            myArr = myArr.concat(getLiteralAndNamedNodes(graphData, rdf.namedNode(RDF.type), cl, allPrefixes))
        });
        // Then combine all quad arrays
        // const combinedQuads = quads.concat(savedQuads).concat(myArr);
        const combinedQuads = quads.concat(myArr);
        // Finally, create list items from quads
        var instanceItemsArr = []
        combinedQuads.forEach(quad => {
            var extra = ''
            if (quad.subject.termType === 'BlankNode') {
                extra = ' (BlankNode)'
            }
            var relatedTrips = getSubjectTriples(graphData, quad.subject)
            var item = {
                title: quad.subject.value + extra,
                value: quad.subject.value,
                props: { subtitle: quad.object.value, 'quad': quad },
            }
            relatedTrips.forEach(quad => {
                if (!Object.hasOwn(item.props, quad.predicate.value)) {
                    item.props[quad.predicate.value] = []
                }
                item.props[quad.predicate.value].push(quad.object.value)
            })
            instanceItemsArr.push(item)
        });
        return instanceItemsArr
    }


    async function handleUpload() {

        if (!upload_url.value) {
            console.error("No file uploaded yet")
            return
        }
        const file = upload_url.value
        const reader = new FileReader();

        batchMode.value = true
        const parser = new N3.Parser();
        // const parser_options = {
        //     // onQuad (required) accepts a listener of type (quad: RDF.Quad) => void
        //     onQuad: (err, quad) => { console.log(quad); },
        //     // onPrefix (optional) accepts a listener of type (prefix: string, iri: NamedNode) => void
        //     onPrefix: (prefix, iri) => { console.log(prefix, 'expands to', iri.value); },
        //     // onComment (optional) accepts a listener of type (comment: string) => void
        //     onComment: (comment) => { console.log('#', comment); },
        // }

        const parserfunc = (error, quad, prefixes) => {
            if (quad) {
                console.log(quad);
                graphData.add(quad)
            }
            else {
                console.log("# That's all, folks!", prefixes);
                updateSerializedData();
                triggerReactivity();
                batchMode.value = false;
            }
        }

        // An array of resultant Quads
        // const quadArray = parser.parse(tomAndJerry);

        // What happens once all file content has been read:
        reader.onload = (event) => {
            const fileContent = event.target.result;
            const contentType = file.type || "text/turtle";
            parser.parse(fileContent, parserfunc);
            // const newURL = URL.createObjectURL(file)
            // getGraphData(newURL)
            // Create a mock Response object
            // const mockResponse = new Response(fileContent, {
            //     headers: { "Content-Type": contentType },
            // });



            // try {
            //     // Use @rdfjs/fetch-lite's quadStream function
            //     const quadStream = await fetch(mockResponse).quadStream();

            //     // Process the quads
            //     quadStream.on("data", (quad) => {
            //         console.log(`${quad.subject.value} - ${quad.predicate.value} - ${quad.object.value}`);
            //     });

            //     quadStream.on("end", () => {
            //         console.log("Finished processing the RDF file");
            //     });
            // } catch (error) {
            //     console.error("Error reading TTL data:", error);
            // }
        };

        reader.onerror = (error) => {
            console.error("Error reading file:", error);
        };

        // Now read the file
        reader.readAsText(file);

        

        // 
    }


    function selectViz() {
        if (viz_viewed.value) return;

        nextTick(() => {

            // cytoscape.use(spread);

            const elements = datasetToCytoscapeElements();
            cytoscape({
            container: cyContainer.value,
            elements: elements,
            style: [
                {
                selector: 'node',
                style: {
                    'shape': 'round-rectangle',
                    'width': '100px',
                    'height': '40px',
                    'label': 'data(label)',
                    'background-color': '#3451B2',
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
                    'line-color': '#41b883',
                    'target-arrow-color': '#41b883',
                    'target-arrow-shape': 'triangle',
                    'curve-style': 'bezier',
                    'font-size': '8px',
                }
                }
            ],
            layout: {
                name: 'cose',
                animate: true,
                ready: undefined, // Callback on layoutready
                stop: undefined, // Callback on layoutstop
                fit: true, // Reset viewport to fit default simulationBounds
                minDist: 200, // Minimum distance between nodes
                padding: 40, // Padding
                expandingFactor: -1.0, // If the network does not satisfy the minDist
                // criterium then it expands the network of this amount
                // If it is set to -1.0 the amount of expansion is automatically
                // calculated based on the minDist, the aspect ratio and the
                // number of nodes
                // prelayout: { name: 'cose' }, // Layout options for the first phase
                maxExpandIterations: 4, // Maximum number of expanding iterations
                boundingBox: undefined, // Constrain layout bounds; { x1, y1, x2, y2 } or { x1, y1, w, h }
                randomize: false // Uses random initial node positions on true
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