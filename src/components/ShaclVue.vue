<template>
    <span v-if="page_ready">
        <v-card>
            <v-layout>
                <v-navigation-drawer
                    theme="dark"
                    color="#41b883"
                    permanent
                >
                    <v-list nav selectable :disabled="formOpen" v-model:selected="selectedItem">
                        <v-list-item prepend-icon="mdi-tag-multiple" value="data"><h4>Data Types</h4></v-list-item>
                        <!-- <v-text-field variant="outlined" append-inner-icon="mdi-magnify" density="compact"></v-text-field> -->
                        <v-list-item
                            v-for="node in idFilteredNodeShapeNames"
                            :title="node"
                            @click="selectType(nodeShapeNames[node], true)">
                        </v-list-item>
                    </v-list>
                </v-navigation-drawer>
                <v-main style="min-height: 90vh">
                    <v-container fluid>
                        <v-row>
                            <v-col
                                :cols="formOpen ? 3 : 12"
                                class="transition-all"
                                :class="formOpen ? 'opacity-column' : ''"
                            >
                                
                                <span v-if="selectedIRI">
                                    <h2 class="mx-4 mb-4 truncate-heading">
                                        {{ toCURIE(selectedIRI, allPrefixes) }}
                                        &nbsp;&nbsp; <v-btn icon="mdi-plus" size="x-small" variant="tonal" @click="addInstanceItem()"></v-btn>
                                    </h2>

                                    <p class="mx-4 mb-4" v-html="formattedDescription"></p>
                                    
                                    <span v-if="classRecordsLoading">
                                        <v-skeleton-loader type="list-item-avatar"></v-skeleton-loader>
                                    </span>
                                    <span v-else>
                                        <div v-if="instanceItems.length">
                                            <v-card v-for="r in instanceItems" class="mx-4 mb-4" :variant="r.title == queried_id ? 'outlined' : 'tonal'">
                                                <v-card-title class="text-h6">
                                                    {{ r.title }}
                                                    <v-btn
                                                        icon="mdi-pencil"
                                                        variant="tonal"
                                                        size="x-small"
                                                        class="rounded-lg"
                                                        @click="editInstanceItem(r)"
                                                    ></v-btn>
                                                </v-card-title>
                                                <v-card-subtitle>{{ toCURIE(r.props.subtitle, allPrefixes) }}</v-card-subtitle>
                                                <v-card-text v-if="!formOpen">
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
                                            </v-card>
                                        </div>
                                        <div v-else style="margin-top: 1em; margin-left: 1em;">
                                            <em>No items</em>
                                        </div>
                                    </span>
                                </span>
                                <span v-else style="margin-top: 1em; margin-left: 1em;">
                                    <em>Select a data type</em>
                                </span>

                            </v-col>
                            <v-col v-if="formOpen" cols="9">
                                <v-expansion-panels variant="accordion" v-model="currentOpenForm" class="custompanels">
                                    <v-expansion-panel
                                        v-for="(f, i) in openForms"
                                        :key="f.shapeIRI + '-'+ f.nodeIDX + '-expansionpanel'"
                                        :value="'panel' + (i+1).toString()"
                                        :disabled="f.disabled"
                                    >
                                        <v-expansion-panel-title> <h2><em>Editing: {{ toCURIE(f.shapeIRI, allPrefixes) }} </em></h2></v-expansion-panel-title>
                                        <v-expansion-panel-text density="compact">
                                            <span v-if="idRecordLoading">
                                                <v-skeleton-loader type="list-item-avatar"></v-skeleton-loader>
                                            </span>
                                            <span v-else>
                                                <FormEditor :key="f.shapeIRI + '-'+ f.nodeIDX + '-form-' + f.formType" :shape_iri="f.shapeIRI" :node_idx="f.nodeIDX"></FormEditor>
                                            </span>
                                        </v-expansion-panel-text>
                                    </v-expansion-panel>
                                </v-expansion-panels>
                            </v-col>
                        </v-row>
                    </v-container>
                </v-main>
            </v-layout>
        </v-card>
        <v-dialog v-model="submitDialog" max-width="700">
            <SubmitComp></SubmitComp>
        </v-dialog>
    </span>
    <span v-else>
        <v-skeleton-loader type="article"></v-skeleton-loader>
    </span>
</template>


<script setup>
    import { ref, computed, provide, watch, reactive, onBeforeUpdate, nextTick, inject, toRaw} from 'vue'
    import rdf from 'rdf-ext';
    import { useConfig } from '@/composables/configuration';
    import { useGraphData } from '@/composables/graphdata';
    import { useClassData } from '@/composables/classdata';
    import { useShapeData } from '@/composables/shapedata';
    import { useFormData } from '@/composables/formdata';
    import editorMatchers from '@/modules/editors';
    import defaultEditor from '@/components/UnknownEditor.vue';
    import {
        toCURIE,
        getLiteralAndNamedNodes,
        getSubjectTriples,
        toIRI,
        addCodeTagsToText, 
        findObjectByKey
    } from '../modules/utils';
    import {SHACL, RDF, RDFS, DLTHINGS, XSD} from '@/modules/namespaces'
import SubmitComp from './SubmitComp.vue';

    const props = defineProps({
        configUrl: String
    })

    const queried_id = ref(null)
    const showShapesWoID = ref(true)
    const { config, configFetched, configError} = useConfig(props.configUrl);
    const classRecordsLoading = ref(false)
    const idRecordLoading = ref(false)
    provide('config', config)
    provide('configFetched', configFetched)
    provide('configError', configError)
    const ID_IRI = ref("")
    provide('ID_IRI', ID_IRI)
    const {
        graphData,
        batchMode,
        getGraphData,
        graphPrefixes,
        serializedGraphData,
        graphTriples,
        updateSerializedData,
        triggerReactivity,
        fetchFromService
    } = useGraphData(config)
    const {
        classData,
        getClassData,
        classPrefixes,
        serializedClassData
    } = useClassData(config)
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
        getSHACLschema
    } = useShapeData(config)
    const {
        formData,
        add_empty_node,
        remove_current_node,
        clear_current_node,
        add_empty_triple,
        add_empty_triple_manual,
        remove_triple,
        save_node,
        quadsToFormData,
    } = useFormData()
    provide('fetchFromService', fetchFromService)
    provide('formData', formData)
    provide('batchMode', batchMode)
    provide('updateSerializedData', updateSerializedData)
    provide('triggerReactivity', triggerReactivity)
    provide('quadsToFormData', quadsToFormData)
    provide('editorMatchers', editorMatchers)
    provide('defaultEditor', defaultEditor)
    provide('add_empty_triple', add_empty_triple)
    provide('add_empty_triple_manual', add_empty_triple_manual)
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
    const allPrefixes = reactive({});
    provide('allPrefixes', allPrefixes)
    const submitButtonPressed = inject('submitButtonPressed')
    const canSubmit = inject('canSubmit')
    const submitDialog = ref(false)
    provide('submitDialog', submitDialog)
    const configPrefixes = ref({})

    // When user clicks the submit button
    watch(submitButtonPressed, (newValue) => {
        if (newValue) {
            submitDialog.value = true            
        }
    }, { immediate: true });

    watch(configFetched, async (newValue) => {
        if (newValue) {
            if (config.value.id_iri) {
                ID_IRI.value = config.value.id_iri
                console.log(`ID_IRI is: ${ID_IRI.value}`)
            }
            if (config.value.hasOwnProperty("show_shapes_wo_id")) {
                showShapesWoID.value = config.value.show_shapes_wo_id
            }
            if (config.value.hasOwnProperty("prefixes")) {
                configPrefixes.value = config.value.prefixes
            }

            await getGraphData()
            await getClassData()
            await getSHACLschema()
        }
    }, { immediate: true });

    // Data for creating/editing items
    // Select a data type
    var selectedShape = ref(null)
    var selectedIRI = ref(null)
    const instanceItems = ref([])

    // Select a data item
    var selectedItem = ref(null)
    
    // Create or edit a data item
    const addItem = ref(false)
    const newItemIdx = ref(null)
    const editItem = ref(false)
    const formOpen = ref(false)
    const editShapeIRI = ref(null)
    const editItemIdx = ref(null)
    const editMode = reactive({
        form: false,
        graph: false,
    })
    provide('editMode', editMode)

    onBeforeUpdate( () => {
        console.log("onBeforeUpdate ShaclVue")
        editItemIdx.value = null
        editShapeIRI.value = null
        if (selectedIRI.value) {
            instanceItems.value = getInstanceItems()
        }
    })

    const idFilteredNodeShapeNames = computed(() =>{

        if (showShapesWoID.value === true) {
            return nodeShapeNamesArray.value
        }
        var shapeNames = []
        for (var n of nodeShapeNamesArray.value) {
            if ( findObjectByKey(
                nodeShapes.value[nodeShapeNames.value[n]].properties,
                SHACL.path.value,
                ID_IRI.value)
            ) {
                shapeNames.push(n)
            }
        }
        return shapeNames
    })


    watch(prefixes_ready, (newValue) => {
        // console.log("CHECK: prefixesready")
        if (newValue) {
            // Get all prefixes and derive context from it
            Object.assign(allPrefixes, shapePrefixes, graphPrefixes, classPrefixes)
            var allPrefixKeys = Object.keys(allPrefixes)
            Object.keys(configPrefixes.value).forEach(p => {
                if (allPrefixKeys.indexOf(p) < 0) {
                    allPrefixes[p] = configPrefixes.value[p]
                }
            });
            console.log("ALL PREFIXES READY")
            console.log(toRaw(allPrefixes))
            setViewFromQuery()
        }
    }, {immediate: true });


    const formattedDescription = computed(() => {
        // For the class description, use a regular expression to replace text between backticks with <code> tags
        if (selectedShape.value) {
            return addCodeTagsToText(selectedShape.value[SHACL.description])
        } else { return '-'}
    })

    async function selectType(IRI, fromUser) {
        selectedIRI.value = IRI
        selectedShape.value = nodeShapes.value[IRI]

        if (config.value.use_service) {
            classRecordsLoading.value = true
            // First fetch rdf data from configured service
            await fetchFromService('get-records', IRI, allPrefixes)
            classRecordsLoading.value = false
            // Then continue with the rest
            await nextTick();
        }
        instanceItems.value = getInstanceItems()
        if (fromUser) updateURL(IRI)
    }

    function updateURL(IRI) {
        var curie = toCURIE(IRI, allPrefixes)
        var queryParams = `?${encodeURIComponent("sh:NodeShape")}=${encodeURIComponent(curie)}`
        history.replaceState(null, '', window.location.pathname + queryParams)
    }

    function getQueryParams() {
        const url = new URL(window.location)
        return url.searchParams
    }

    async function setViewFromQuery() {
        const qparams = getQueryParams()
        const nodeShape = qparams.get("sh:NodeShape")
        const instance_id = qparams.get("id")

        if (instance_id) {
            console.log("Queried ID FOUND")
            queried_id.value = instance_id
            console.log(queried_id.value)
        }

        if (nodeShape) {
            console.log("Queried nodeshape FOUND")
            // this could be a curie or iri
            // check if iri is in 
            var nodeShapeIRI = toIRI(nodeShape, allPrefixes)
            if (nodeShapes.value[nodeShapeIRI]) {
                await selectType(nodeShapeIRI)
            } else {
                console.log("Queried nodeshape not found in shacl schema")
            }
        } else {
            console.log("nodeshape not in query params")
        }
    }

    function addInstanceItem() {
        newItemIdx.value = null
        editItem.value = false
        addItem.value = false
        // selectedIRI.value = IRI
        // selectedShape.value = nodeShapes.value[IRI]
        newItemIdx.value = '_:' + crypto.randomUUID()
        addForm(selectedIRI.value, newItemIdx.value, 'new')
        addItem.value = true
        formOpen.value = true
        canSubmit.value = false
    }

    async function editInstanceItem(instance) {
        // When user selects to edit, it will be either a namedNode or blankNode
        // and the related information would already be in the graph as triples
        // Also, related information might already be in formData if the user
        // created or edited the same node before in the same session. If not,
        // then a formData node has to be created from the triples in the graph.
        console.log(instance)
        addItem.value = false
        editItem.value = false
        var subjectTerm = instance.props.quad.subject
        var objectTerm = instance.props.quad.object
        if (objectTerm.termType === "NamedNode") {
            editShapeIRI.value = objectTerm.value
        } else {
            editShapeIRI.value = toIRI(objectTerm.value, allPrefixes)
        }
        editItemIdx.value = instance.value // this is the id
        console.log(editShapeIRI.value)
        console.log(editItemIdx.value)

        if (config.value.use_service) {
            idRecordLoading.value = true
            // First fetch rdf data from configured service
            await fetchFromService('get-record', editItemIdx.value, allPrefixes)
            idRecordLoading.value = false
            // Then continue with the rest
            await nextTick();
        }

        // if the node is already in the formData, edit that
        if (formData[editShapeIRI.value]?.[editItemIdx.value]) {
            editMode.form = true
            editMode.graph = false
        } else {
            // If not, we need to create the formData entries from quads in the dataset
            quadsToFormData(editShapeIRI.value, subjectTerm, graphData, ID_IRI.value, allPrefixes)
            editMode.form = false
            editMode.graph = true
        }
        // open formEditor
        addForm(editShapeIRI.value, editItemIdx.value, 'edit')
        editItem.value = true
        formOpen.value = true
        canSubmit.value = false
        window.scrollTo(0,0);
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

    const openForms = ref([])
    const currentOpenForm = computed(() => {
        if (openForms.value.length > 0) {
            return 'panel' + openForms.value.length.toString();
        }
        return null;
    })

    function addForm(shapeIRI, nodeIDX, formType) {
        for (var i=0;i<openForms.value.length;i++) {
            openForms.value[i].disabled = true;
        }
        openForms.value.push({
            "shapeIRI": shapeIRI,
            "nodeIDX": nodeIDX,
            "formType": formType,
            "disabled": false
        })
    }

    function removeForm() {
        openForms.value.pop()
        if (openForms.value.length > 0) {
            openForms.value.at(-1).disabled = false
        } else {
            editItem.value = false
            formOpen.value = false
            canSubmit.value = true
            editMode.form = editMode.graph = false
            instanceItems.value = getInstanceItems()
        }
    }
    provide('addForm', addForm)
    provide('openForms', openForms)
    provide('removeForm', removeForm)

</script>

<style>
    .code-style {
        color: red;
        background-color: #f5f5f5;
        padding: 0.1em 0.2em;
        font-family: monospace;
        border-radius: 4px;
        border: 1px solid #ddd;
    }
    .v-expansion-panel-text {
        display: unset !important;
        margin: 0 !important;
        padding: 0 !important;
    }
    .v-expansion-panel-text__wrapper {
        margin: 0 !important;
        padding: 0 !important;
    }
</style>

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
    .truncate-heading {
        white-space: nowrap; /* Prevent text wrapping */
        overflow: hidden;    /* Hide overflowed text */
        text-overflow: ellipsis; /* Add ellipsis for overflowed text */
    }
    .opacity-column {
        opacity: 0.5; /* Set opacity value between 0 (fully transparent) and 1 (fully opaque) */
    }
    .custompanels {
        border: 1px solid #ccc !important; /* Change to your preferred color */
        box-shadow: none !important; /* Remove elevation */
        border-radius: 8px; /* Optional: Adjust border rounding */
    }
    .custompanels .v-expansion-panel {
        border-bottom: 1px solid #ddd !important; /* Adds a subtle divider between panels */
        box-shadow: none !important;
        border-radius: 8px; /* Optional: Adjust border rounding */
    }
</style>